import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

import authRoutes from './routes/authRoutes.js';
import roomRoutes from './routes/roomRoutes.js';
import { corsOptions, CLIENT_ORIGIN } from './config/cors.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(cors(corsOptions));
app.use(express.json());
app.use(morgan('dev'));

app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);

app.get('/', (req, res) => {
    res.send(`
        <h1>Collaborative Whiteboard API Running</h1>
        <p>Status: OK</p>
        <p>Client Origin: ${CLIENT_ORIGIN}</p>
    `);
});

app.use(notFound);
app.use(errorHandler);

export default app;
