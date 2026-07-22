import Room from '../models/Room.js';

const registerChatHandlers = (io, socket) => {
    socket.on('chat-message', async ({ roomId, message }) => {
        socket.to(roomId).emit('chat-message', message);
        try {
            await Room.findOneAndUpdate(
                { roomId },
                {
                    $push: { chatHistory: message },
                    $set: { lastActive: Date.now() }
                }
            );
        } catch (err) {
            console.error('Error saving chat message:', err);
        }
    });
};

export default registerChatHandlers;
