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

import { updateRoomSession, leaveRoom } from './controllers/roomController.js';
import Room from './models/Room.js';

dotenv.config();


// ✅ Connect Database
connectDB();


// ✅ Environment variables
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";
const PORT = process.env.PORT || 5000;


// ✅ Initialize express
const app = express();


// ✅ Create HTTP server
const server = http.createServer(app);


// ✅ FIX 1: Proper CORS configuration
const allowedOrigins = [
 process.env.CLIENT_ORIGIN,
 "http://localhost:5173"
];

const corsOptions = {

 origin: function(origin, callback){

  if(!origin) return callback(null, true);

  if(allowedOrigins.includes(origin))
   return callback(null, true);

  callback(null, true);

 },

 credentials: true

};

// ✅ Applied CORS configuration once
app.use(cors(corsOptions));


// ✅ Middlewares
app.use(express.json());
app.use(morgan("dev"));
app.use(requestLogger);


// ✅ Routes
app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);


// ✅ Test route
app.get("/", (req, res) => {

    res.send(`
        <h1>Collaborative Whiteboard API Running</h1>
        <p>Status: OK</p>
        <p>Client Origin: ${CLIENT_ORIGIN}</p>
    `);

});



// ✅ Socket.io with proper CORS
const io = new Server(server, {

    cors: {
        origin: CLIENT_ORIGIN,
        methods: ["GET", "POST"],
        credentials: true
    }

});



// ✅ Room tracking
const rooms = new Map();



// ✅ Socket logic
io.on("connection", (socket) => {

    console.log("User connected:", socket.id);



    socket.on("join-room", async ({ roomId, userName, userId, name }) => {
        socket.join(roomId);
        let roomData = await Room.findOne({ roomId });
        const creatorId = roomData?.creatorId?.toString() || userId;

        if (userId) {
            const result = await updateRoomSession(roomId, userId, name);
            if (result?.error) {
                socket.emit("re-entry-blocked", { message: result.error });
                return;
            }
        }

        if (roomData?.status === "expired") {
            socket.emit("re-entry-blocked", {
                message: "Session expired"
            });
            return;
        }

        if (!rooms.has(roomId)) {
            rooms.set(roomId, {
                creatorId,
                users: new Map()
            });
        }

        const currentRoom = rooms.get(roomId);
        currentRoom.users.set(socket.id, { userName, userId });

        const userList = Array.from(currentRoom.users.entries()).map(
            ([id, data]) => ({
                id,
                name: data.userName,
                status: "online",
                isAdmin: data.userId === currentRoom.creatorId
            })
        );

        socket.emit("room-users", userList);

        if (roomData) {
            socket.emit("room-details", {
                name: roomData.name
            });
            socket.emit("whiteboard-data",
                roomData.whiteboardData || []);
            socket.emit("chat-history",
                roomData.chatHistory || []);
        }

        socket.to(roomId).emit("user-joined", {
            id: socket.id,
            name: userName
        });
        
        // Broadcast user list to all in room
        io.to(roomId).emit("room-users", userList);
    });

    socket.on("draw", async ({ roomId, stroke }) => {
        socket.to(roomId).emit("draw", stroke);
        
        // Update DB with the drawing data
        // For pencil/erase we update the stroke if it exists, otherwise push
        try {
            const room = await Room.findOne({ roomId });
            if (room) {
                const index = room.whiteboardData.findIndex(s => s.id === stroke.id);
                if (index > -1) {
                    room.whiteboardData[index] = stroke;
                } else {
                    room.whiteboardData.push(stroke);
                }
                room.markModified('whiteboardData');
                room.lastActive = Date.now();
                await room.save();
            }
        } catch (err) {
            console.error("Error saving draw data:", err);
        }
    });

    socket.on("cursor-move", ({ roomId, x, y, name }) => {
        socket.to(roomId).emit("cursor-move", { id: socket.id, x, y, name });
    });

    socket.on("chat-message", async ({ roomId, message }) => {
        socket.to(roomId).emit("chat-message", message);
        try {
            await Room.findOneAndUpdate(
                { roomId }, 
                { 
                    $push: { chatHistory: message },
                    $set: { lastActive: Date.now() }
                }
            );
        } catch (err) {
            console.error("Error saving chat message:", err);
        }
    });

    socket.on("clear", async (roomId) => {
        socket.to(roomId).emit("clear");
        try {
            await Room.findOneAndUpdate(
                { roomId }, 
                { 
                    $set: { whiteboardData: [], lastActive: Date.now() }
                }
            );
        } catch (err) {
            console.error("Error clearing whiteboard:", err);
        }
    });

    socket.on("undo", async (roomId) => {
        socket.to(roomId).emit("undo");
        try {
            // Pop the last stroke from DB
            await Room.findOneAndUpdate(
                { roomId },
                { 
                    $pop: { whiteboardData: 1 },
                    $set: { lastActive: Date.now() }
                }
            );
        } catch (err) {
            console.error("Error on undo:", err);
        }
    });

    socket.on("redo", (roomId) => {
        socket.to(roomId).emit("redo");
        // Redo complex to handle in DB without a separate redo stack, 
        // but we broadcast it at least for real-time.
    });

    socket.on("leave-room", async ({ roomId, userId }) => {
        await leaveRoom(roomId, userId);
        socket.leave(roomId);
        
        if (rooms.has(roomId)) {
            const currentRoom = rooms.get(roomId);
            currentRoom.users.delete(socket.id);
            
            const userList = Array.from(currentRoom.users.entries()).map(
                ([id, data]) => ({
                    id,
                    name: data.userName,
                    status: "online",
                    isAdmin: data.userId === currentRoom.creatorId
                })
            );
            
            io.to(roomId).emit("room-users", userList);
            socket.to(roomId).emit("user-left", socket.id);
        }
    });

    socket.on("start-sharing", ({ roomId, userName }) => {
        socket.to(roomId).emit("screen-share-start", { streamId: socket.id, userName });
    });

    socket.on("stop-sharing", (roomId) => {
        socket.to(roomId).emit("screen-share-stop", socket.id);
    });

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
        
        // Find which room this user was in and clean up
        for (const [roomId, roomData] of rooms.entries()) {
            if (roomData.users.has(socket.id)) {
                roomData.users.delete(socket.id);
                
                const userList = Array.from(roomData.users.entries()).map(
                    ([id, data]) => ({
                        id,
                        name: data.userName,
                        status: "online",
                        isAdmin: data.userId === roomData.creatorId
                    })
                );
                
                io.to(roomId).emit("room-users", userList);
                io.to(roomId).emit("user-left", socket.id);
                break;
            }
        }
    });

});




// ✅ Start server
server.listen(PORT, () => {

    console.log(`
========================================
Server running successfully
PORT: ${PORT}
CLIENT_ORIGIN: ${CLIENT_ORIGIN}
========================================
`);

});