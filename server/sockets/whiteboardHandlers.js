import Room from '../models/Room.js';

const registerWhiteboardHandlers = (io, socket) => {
    socket.on('draw', async ({ roomId, stroke }) => {
        socket.to(roomId).emit('draw', stroke);

        try {
            const room = await Room.findOne({ roomId });
            if (room) {
                const index = room.whiteboardData.findIndex((s) => s.id === stroke.id);
                if (index > -1) {
                    room.whiteboardData[index] = stroke;
                } else {
                    room.whiteboardData.push(stroke);
                    room.redoStack = [];
                }
                room.markModified('whiteboardData');
                room.markModified('redoStack');
                room.lastActive = Date.now();
                await room.save();
            }
        } catch (err) {
            console.error('Error saving draw data:', err);
        }
    });

    socket.on('clear', async (roomId) => {
        socket.to(roomId).emit('clear');
        try {
            await Room.findOneAndUpdate(
                { roomId },
                { $set: { whiteboardData: [], lastActive: Date.now() } }
            );
        } catch (err) {
            console.error('Error clearing whiteboard:', err);
        }
    });

    socket.on('undo', async (roomId) => {
        socket.to(roomId).emit('undo');
        try {
            const room = await Room.findOne({ roomId });
            if (room && room.whiteboardData.length > 0) {
                const lastStroke = room.whiteboardData.pop();
                room.redoStack.push(lastStroke);
                room.markModified('whiteboardData');
                room.markModified('redoStack');
                room.lastActive = Date.now();
                await room.save();
            }
        } catch (err) {
            console.error('Error on undo:', err);
        }
    });

    socket.on('redo', async (roomId) => {
        try {
            const room = await Room.findOne({ roomId });
            if (room && room.redoStack.length > 0) {
                const stroke = room.redoStack.pop();
                room.whiteboardData.push(stroke);

                io.to(roomId).emit('draw', stroke);

                room.markModified('whiteboardData');
                room.markModified('redoStack');
                room.lastActive = Date.now();
                await room.save();
            }
        } catch (err) {
            console.error('Error on redo:', err);
        }
    });
};

export default registerWhiteboardHandlers;
