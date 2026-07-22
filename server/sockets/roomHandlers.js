import Room from '../models/Room.js';
import { updateRoomSession, leaveRoom } from '../controllers/roomController.js';

const buildUserList = (room) =>
    Array.from(room.users.entries()).map(([id, data]) => ({
        id,
        name: data.userName,
        status: 'online',
        isAdmin: data.userId === room.creatorId
    }));

const registerRoomHandlers = (io, socket, rooms) => {
    socket.on('join-room', async ({ roomId, userName, userId, name }) => {
        try {
            socket.join(roomId);
            const roomData = await Room.findOne({ roomId });
            const creatorId = roomData?.creatorId?.toString() || userId;

            if (userId) {
                const result = await updateRoomSession(roomId, userId, name);
                if (result?.error) {
                    socket.emit('re-entry-blocked', { message: result.error });
                    return;
                }
            }

            if (roomData?.status === 'expired') {
                socket.emit('re-entry-blocked', { message: 'Session expired' });
                return;
            }

            if (!rooms.has(roomId)) {
                rooms.set(roomId, { creatorId, users: new Map() });
            }

            const currentRoom = rooms.get(roomId);
            currentRoom.users.set(socket.id, { userName, userId });

            const userList = buildUserList(currentRoom);

            socket.emit('room-users', userList);

            if (roomData) {
                socket.emit('room-details', { name: roomData.name });
                socket.emit('whiteboard-data', roomData.whiteboardData || []);
                socket.emit('chat-history', roomData.chatHistory || []);
            }

            socket.to(roomId).emit('user-joined', { id: socket.id, name: userName });
            io.to(roomId).emit('room-users', userList);
        } catch (err) {
            console.error('Error joining room:', err);
        }
    });

    socket.on('leave-room', async ({ roomId, userId }) => {
        await leaveRoom(roomId, userId);
        socket.leave(roomId);

        if (rooms.has(roomId)) {
            const currentRoom = rooms.get(roomId);
            currentRoom.users.delete(socket.id);

            io.to(roomId).emit('room-users', buildUserList(currentRoom));
            socket.to(roomId).emit('user-left', socket.id);
        }
    });

    socket.on('cursor-move', ({ roomId, x, y, name }) => {
        socket.to(roomId).emit('cursor-move', { id: socket.id, x, y, name });
    });

    socket.on('start-sharing', ({ roomId, userName }) => {
        socket.to(roomId).emit('screen-share-start', { streamId: socket.id, userName });
    });

    socket.on('stop-sharing', (roomId) => {
        socket.to(roomId).emit('screen-share-stop', socket.id);
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
