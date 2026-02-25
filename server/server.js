import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import http from 'http';
import { Server } from 'socket.io';
import connectDB from './db/connection.js';
import { requestLogger } from './middleware/logger.js';
import authRoutes from './routes/authRoutes.js';
import roomRoutes from './routes/roomRoutes.js';
import { updateRoomSession, expireRoom, leaveRoom } from './controllers/roomController.js';
import Room from './models/Room.js';

dotenv.config();

// Database Connection
connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*', // In production, replace with your client URL
        methods: ['GET', 'POST']
    }
});

// Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use(requestLogger);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);

app.get('/', (req, res) => {
    try {
        res.send(`
            <h1>Welcome to Collaborative Whiteboard API!</h1>
            <p>The API is running with Socket.io enabled.</p>
        `);
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong on the server' });
    }
});

// Room users tracking
const rooms = new Map(); // roomId -> { creatorId, users: Map(socket.id -> {userName, userId}) }

// Socket.io Logic
io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on('join-room', async ({ roomId, userName, userId, name }) => {
        socket.join(roomId);

        let roomData = await Room.findOne({ roomId });
        const creatorId = roomData ? roomData.creatorId?.toString() : userId;

        if (userId) {
            const result = await updateRoomSession(roomId, userId, name);
            if (result && result.error) {
                socket.emit('re-entry-blocked', { message: result.error });
                return;
            }
        }

        // Check if room is expired
        if (roomData && roomData.status === 'expired') {
            socket.emit('re-entry-blocked', { message: 'This session has ended and is no longer accessible.' });
            return;
        }

        // Track user
        if (!rooms.has(roomId)) {
            rooms.set(roomId, {
                creatorId,
                users: new Map()
            });
        }

        const currentRoom = rooms.get(roomId);
        currentRoom.users.set(socket.id, { userName, userId });

        const userList = Array.from(currentRoom.users.entries()).map(([id, data]) => ({
            id,
            name: data.userName,
            status: 'online',
            isAdmin: data.userId === currentRoom.creatorId
        }));

        // Send full user list to the new user
        socket.emit('room-users', userList);

        // Send room details (like name) to the new user
        if (roomData) {
            socket.emit('room-details', { name: roomData.name });
            // Send existing whiteboard data and chat history
            socket.emit('whiteboard-data', roomData.whiteboardData || []);
            socket.emit('chat-history', roomData.chatHistory || []);
        }

        // Notify others in the room
        socket.to(roomId).emit('user-joined', {
            id: socket.id,
            name: userName,
            isAdmin: userId === currentRoom.creatorId
        });

        // Broadcast updated list to others too
        socket.to(roomId).emit('room-users', userList);
    });

    socket.on('leave-room', async ({ roomId, userId }) => {
        if (userId) {
            await leaveRoom(roomId, userId);
            // Notify others
            socket.to(roomId).emit('user-left', socket.id);
        }
    });

    socket.on('draw', async ({ roomId, stroke }) => {
        socket.to(roomId).emit('draw', stroke);

        // Persist stroke to DB
        try {
            const result = await Room.updateOne(
                { roomId, 'whiteboardData.id': stroke.id },
                { $set: { 'whiteboardData.$': stroke } }
            );
            if (result.matchedCount === 0) {
                await Room.updateOne(
                    { roomId },
                    { $push: { whiteboardData: stroke } }
                );
            }
        } catch (error) {
            console.error('Error saving draw data:', error);
        }
    });

    socket.on('clear', async (roomId) => {
        socket.to(roomId).emit('clear');
        try {
            await Room.updateOne({ roomId }, { $set: { whiteboardData: [] } });
        } catch (error) {
            console.error('Error clearing whiteboard data:', error);
        }
    });

    socket.on('undo', async (roomId) => {
        socket.to(roomId).emit('undo');
        try {
            await Room.updateOne({ roomId }, { $pop: { whiteboardData: 1 } });
        } catch (error) {
            console.error('Error undoing stroke:', error);
        }
    });

    socket.on('redo', (roomId) => {
        socket.to(roomId).emit('redo');
    });

    socket.on('chat-message', async ({ roomId, message }) => {
        socket.to(roomId).emit('chat-message', message);
        try {
            await Room.updateOne({ roomId }, { $push: { chatHistory: message } });
        } catch (error) {
            console.error('Error saving chat message:', error);
        }
    });

    socket.on('cursor-move', ({ roomId, x, y, name }) => {
        socket.to(roomId).emit('cursor-move', { id: socket.id, x, y, name });
    });

    socket.on('start-sharing', ({ roomId, userName }) => {
        socket.to(roomId).emit('screen-share-start', { streamId: socket.id, userName });
    });

    socket.on('stop-sharing', (roomId) => {
        socket.to(roomId).emit('screen-share-stop');
    });

    socket.on('disconnecting', async () => {
        for (const roomId of socket.rooms) {
            if (rooms.has(roomId)) {
                const roomObj = rooms.get(roomId);
                const userData = roomObj.users.get(socket.id);

                if (!userData) continue;

                const { userName, userId } = userData;
                roomObj.users.delete(socket.id);

                // Removed: Automatic expiration on disconnect.
                // Expiration now only happens via explicit 'leave-room' event (clicked Leave button).
                // This allows Admin/Users to rejoin if they closed the tab by mistake.

                if (roomObj.users.size === 0) {
                    rooms.delete(roomId);
                } else {
                    const userList = Array.from(roomObj.users.entries()).map(([id, data]) => ({
                        id: id,
                        name: data.userName,
                        status: 'online',
                        isAdmin: data.userId === roomObj.creatorId
                    }));

                    socket.to(roomId).emit('room-users', userList);
                    socket.to(roomId).emit('user-left', socket.id);
                    socket.to(roomId).emit('chat-message', {
                        id: Date.now(),
                        name: 'System',
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        text: `${userName} left the room.`
                    });
                }
            }
        }
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});

// Server Initialization
const PORT = process.env.PORT || 5000;

try {
    server.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
} catch (error) {
    console.error(`Error: ${error.message}`);
}
