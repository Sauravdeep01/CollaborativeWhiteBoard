import Room from '../models/Room.js';
import { nanoid } from 'nanoid';

// Helper to generate or validate a unique room ID (Case-Insensitive check)
const generateUniqueRoomId = async (customId = null) => {
    if (customId && typeof customId === 'string' && customId.trim().length > 0) {
        const cleanCustom = customId.trim();
        const existing = await Room.findOne({
            roomId: { $regex: new RegExp(`^${cleanCustom.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
        });
        if (existing) {
            return { error: `A room with code "${cleanCustom}" already exists. Please enter a different room code.` };
        }
        return { roomId: cleanCustom };
    }

    // Auto-generate a guaranteed unique roomId
    let uniqueId = '';
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
        attempts++;
        uniqueId = nanoid(10);
        const existing = await Room.findOne({
            roomId: { $regex: new RegExp(`^${uniqueId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
        });
        if (!existing) {
            isUnique = true;
        }
    }

    if (!isUnique) {
        uniqueId = `${nanoid(6)}-${Date.now().toString(36)}`;
    }

    return { roomId: uniqueId };
};

// 1. Create a new room explicitly in DB
export const createRoom = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User authentication required'
            });
        }

        const { name, roomId: customRoomId } = req.body;

        const { roomId, error } = await generateUniqueRoomId(customRoomId);
        if (error) {
            return res.status(400).json({
                success: false,
                message: error
            });
        }

        const room = new Room({
            roomId,
            creatorId: userId,
            participants: [userId],
            participantCount: 1,
            name: name?.trim() || 'Untitled Whiteboard',
            status: 'active',
            lastActive: Date.now(),
            whiteboardData: [],
            redoStack: [],
            chatHistory: []
        });

        await room.save();

        return res.status(201).json({
            success: true,
            room
        });
    } catch (error) {
        console.error('Error in createRoom:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Server error creating room'
        });
    }
};

// 2. Validate existing room code (Case-Insensitive)
export const validateRoom = async (req, res) => {
    try {
        const { roomId } = req.params;
        if (!roomId || !roomId.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Room code is required'
            });
        }

        const cleanCode = roomId.trim();

        // Case-insensitive exact match regex
        const room = await Room.findOne({
            roomId: { $regex: new RegExp(`^${cleanCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
        });

        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Invalid room code. Room does not exist.'
            });
        }

        if (room.status === 'expired') {
            return res.status(400).json({
                success: false,
                message: 'This whiteboard session has ended and is no longer accessible.'
            });
        }

        res.status(200).json({
            success: true,
            roomId: room.roomId,
            name: room.name,
            status: room.status
        });
    } catch (error) {
        console.error('Error validating room:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error validating room'
        });
    }
};

// 3. Get recent active sessions for user
export const getRecentSessions = async (req, res) => {
    try {
        const userId = req.user.id;
        const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

        const sessions = await Room.find({
            participants: userId,
            lastActive: { $gte: thirtyMinutesAgo }
        })
            .sort({ lastActive: -1 })
            .limit(10)
            .populate('creatorId', 'name');

        const sessionsWithStatus = sessions.map(s => {
            const sessionObj = s.toObject();
            if (s.leftParticipants && s.leftParticipants.includes(userId)) {
                sessionObj.status = 'expired';
            }
            return sessionObj;
        });

        res.status(200).json({
            success: true,
            sessions: sessionsWithStatus
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error'
        });
    }
};

// 4. Update room session on socket connection
export const updateRoomSession = async (roomId, userId, name) => {
    try {
        const cleanCode = roomId.trim();
        let room = await Room.findOne({
            roomId: { $regex: new RegExp(`^${cleanCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
        });

        if (!room) {
            // Room must be explicitly created via /api/rooms/create. Unregistered codes cannot be joined!
            return { error: 'Room does not exist. Please enter a valid room code.' };
        }

        if (room.status === 'expired') {
            return { error: 'This session has ended and is no longer accessible.' };
        }

        if (!room.participants.includes(userId)) {
            room.participants.push(userId);
            room.participantCount = room.participants.length;
        }
        room.lastActive = Date.now();

        await room.save();
        return room;
    } catch (error) {
        console.error('Error updating room session:', error);
        return { error: 'Server error joining room session' };
    }
};

export const leaveRoom = async (roomId, userId) => {
    try {
        const cleanCode = roomId.trim();
        const room = await Room.findOne({
            roomId: { $regex: new RegExp(`^${cleanCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
        });
        if (room) {
            if (room.creatorId && room.creatorId.toString() === userId.toString()) {
                room.status = 'expired';
            }
            await room.save();
        }
    } catch (error) {
        console.error('Error in leaveRoom controller:', error);
    }
};

export const expireRoom = async (roomId) => {
    try {
        const cleanCode = roomId.trim();
        await Room.findOneAndUpdate(
            { roomId: { $regex: new RegExp(`^${cleanCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } },
            { status: 'expired' }
        );
    } catch (error) {
        console.error('Error expiring room:', error);
    }
};

export const getRoomStatus = async (roomId) => {
    try {
        const cleanCode = roomId.trim();
        const room = await Room.findOne({
            roomId: { $regex: new RegExp(`^${cleanCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
        });
        return room ? room.status : 'expired';
    } catch (error) {
        console.error('Error getting room status:', error);
        return 'expired';
    }
};
