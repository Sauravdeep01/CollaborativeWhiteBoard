import Room from '../models/Room.js';

export const getRecentSessions = async (req, res) => {
    try {
        const userId = req.user.id; // From auth middleware

        const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

        // Find rooms where the user is a participant and active within 30 mins
        const sessions = await Room.find({
            participants: userId,
            lastActive: { $gte: thirtyMinutesAgo }
        })
            .sort({ lastActive: -1 })
            .limit(3)
            .populate('creatorId', 'name');

        // Check if user has left each room
        const sessionsWithStatus = sessions.map(s => {
            const sessionObj = s.toObject();
            if (s.leftParticipants.includes(userId)) {
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

export const updateRoomSession = async (roomId, userId, name) => {
    try {
        let room = await Room.findOne({ roomId });

        if (!room) {
            room = new Room({
                roomId,
                creatorId: userId,
                participants: [userId],
                participantCount: 1,
                name: name || 'Untitled Whiteboard',
                status: 'active'
            });
        } else {
            // If room is expired, no one can join again
            if (room.status === 'expired') {
                return { error: 'This session has ended and is no longer accessible.' };
            }

            if (!room.participants.includes(userId)) {
                room.participants.push(userId);
                room.participantCount = room.participants.length;
            }
            room.lastActive = Date.now();
        }

        await room.save();
        return room;
    } catch (error) {
        console.error('Error updating room session:', error);
    }
};

export const leaveRoom = async (roomId, userId) => {
    try {
        const room = await Room.findOne({ roomId });
        if (room) {
            // If the person leaving is the creator, expire the whole room permanently
            if (room.creatorId.toString() === userId.toString()) {
                room.status = 'expired';
            }
            // We don't block participants from re-joining an active room anymore
            await room.save();
        }
    } catch (error) {
        console.error('Error in leaveRoom controller:', error);
    }
};

export const expireRoom = async (roomId) => {
    try {
        await Room.findOneAndUpdate({ roomId }, { status: 'expired' });
    } catch (error) {
        console.error('Error expiring room:', error);
    }
};

export const getRoomStatus = async (roomId) => {
    try {
        const room = await Room.findOne({ roomId });
        return room ? room.status : 'active';
    } catch (error) {
        console.error('Error getting room status:', error);
        return 'active';
    }
};
