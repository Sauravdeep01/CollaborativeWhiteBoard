import registerRoomHandlers from './roomHandlers.js';
import registerWhiteboardHandlers from './whiteboardHandlers.js';
import registerChatHandlers from './chatHandlers.js';

const rooms = new Map();

const initSocket = (io) => {
    io.on('connection', (socket) => {
        console.log('User connected:', socket.id);

        registerRoomHandlers(io, socket, rooms);
        registerWhiteboardHandlers(io, socket);
        registerChatHandlers(io, socket);
    });
};

export default initSocket;
