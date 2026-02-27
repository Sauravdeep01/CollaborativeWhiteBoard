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

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));


// ✅ Apply CORS
app.use(cors(corsOptions));


// ✅ IMPORTANT: Handle preflight
app.options("*", cors(corsOptions));


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



    });




    socket.on("disconnect", () => {

        console.log("User disconnected:", socket.id);

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