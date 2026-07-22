import 'dotenv/config';
import http from 'http';
import { Server } from 'socket.io';

import app from './app.js';
import connectDB from './db/connection.js';
import { socketCorsOptions, CLIENT_ORIGIN } from './config/cors.js';
import initSocket from './sockets/index.js';

process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
const io = new Server(server, { cors: socketCorsOptions });

initSocket(io);

const startServer = async () => {
    await connectDB();

    console.log('✅ All connections established');

    server.listen(() => {
        console.log("Server running successfully");
    });
};

startServer();
