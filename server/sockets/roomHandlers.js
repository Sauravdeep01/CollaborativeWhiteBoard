import Room from '../models/Room.js';
import { updateRoomSession, leaveRoom } from '../controllers/roomController.js';

const buildUserList = (room) =>
    Array.from(room.users.entries()).map(([id, data]) => ({
        id,
        name: data.userName,
        userId: data.userId,
        status: 'online',
        isAdmin: Boolean(
            data.userId &&
            room.creatorId &&
            data.userId.toString() === room.creatorId.toString()
        )
    }));

const registerRoomHandlers = (io, socket, rooms) => {
    socket.on('join-room', async ({ roomId, userName, userId, name }) => {
        try {
            socket.join(roomId);
            const roomData = await Room.findOne({ roomId }).populate('creatorId', 'name');

            if (roomData?.status === 'expired') {
                socket.emit('re-entry-blocked', { message: 'This room session has been ended by the Admin.' });
                return;
            }

            if (userId) {
                const result = await updateRoomSession(roomId, userId, name);
                if (result?.error) {
                    socket.emit('re-entry-blocked', { message: result.error });
                    return;
                }
            }

            const creatorIdStr = roomData?.creatorId?._id
                ? roomData.creatorId._id.toString()
                : (roomData?.creatorId?.toString() || userId);
            const adminName = roomData?.creatorId?.name || userName || 'Admin';

            if (!rooms.has(roomId)) {
                rooms.set(roomId, { creatorId: creatorIdStr, adminName, users: new Map() });
            }

            const currentRoom = rooms.get(roomId);
            if (!currentRoom.creatorId && creatorIdStr) {
                currentRoom.creatorId = creatorIdStr;
            }
            if (!currentRoom.adminName && adminName) {
                currentRoom.adminName = adminName;
            }

            currentRoom.users.set(socket.id, { userName, userId });

            const userList = buildUserList(currentRoom);

            socket.emit('room-users', userList);

            if (roomData) {
                socket.emit('room-details', {
                    name: roomData.name,
                    creatorId: creatorIdStr,
                    adminName: currentRoom.adminName
                });
                socket.emit('whiteboard-data', roomData.whiteboardData || []);
                socket.emit('chat-history', roomData.chatHistory || []);
            }

            socket.to(roomId).emit('user-joined', { id: socket.id, name: userName });
            io.to(roomId).emit('room-users', userList);
        } catch (err) {
            console.error('Error joining room:', err);
        }
    });

    socket.on('leave-room', async ({ roomId, userId, userName }) => {
        try {
            const cleanCode = roomId?.trim();
            if (!cleanCode) return;

            const roomData = await Room.findOne({
                roomId: { $regex: new RegExp(`^${cleanCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
            });

            const creatorIdStr = roomData?.creatorId?.toString();
            const isCreator = Boolean(
                creatorIdStr && userId && creatorIdStr === userId.toString()
            );

            if (isCreator) {
                // Admin is exiting the room!
                // 1. Expire room in DB
                await leaveRoom(cleanCode, userId);

                // 2. Broadcast room-expired event to everyone in real time
                io.to(cleanCode).emit('room-expired', {
                    message: 'The Admin has exited the room. This whiteboard session is now closed.'
                });

                // 3. Delete room from memory map
                if (rooms.has(cleanCode)) {
                    rooms.delete(cleanCode);
                }
            } else {
                // Non-Admin user is leaving
                socket.leave(cleanCode);

                if (rooms.has(cleanCode)) {
                    const currentRoom = rooms.get(cleanCode);
                    currentRoom.users.delete(socket.id);

                    const leavingUserName = userName || 'A participant';

                    const sysMsg = {
                        id: `sys-${Date.now()}-${Math.random()}`,
                        name: 'System',
                        text: `${leavingUserName} left the room.`,
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    };

                    // Broadcast chat notification to remaining participants
                    io.to(cleanCode).emit('chat-message', sysMsg);

                    // Persist system message to chatHistory in DB
                    await Room.findOneAndUpdate(
                        { roomId: cleanCode },
                        { $push: { chatHistory: sysMsg } }
                    );

                    // Update user list for remaining room members
                    io.to(cleanCode).emit('room-users', buildUserList(currentRoom));
                    socket.to(cleanCode).emit('user-left', socket.id);
                }
            }
        } catch (err) {
            console.error('Error in leave-room socket event:', err);
        }
    });

    socket.on('cursor-move', ({ roomId, x, y, name }) => {
        socket.to(roomId).emit('cursor-move', { id: socket.id, x, y, name });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);

        for (const [roomId, roomData] of rooms.entries()) {
            if (roomData.users.has(socket.id)) {
                roomData.users.delete(socket.id);

                io.to(roomId).emit('room-users', buildUserList(roomData));
                io.to(roomId).emit('user-left', socket.id);
                break;
            }
        }
    });
};

export default registerRoomHandlers;
