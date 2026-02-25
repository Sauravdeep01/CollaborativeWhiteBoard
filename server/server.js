import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import connectDB from './db/connection.js';
import { requestLogger } from './middleware/logger.js';
import authRoutes from './routes/authRoutes.js';

dotenv.config();

// Database Connection
connectDB();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use(requestLogger);

// Routes
app.use('/api/auth', authRoutes);


app.get('/', (req, res) => {
    try {
        res.send(`
            <h1>Welcome to Collaborative Whiteboard API!</h1>
            <p>The API is running.</p>
        `);
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong on the server' });
    }
});

// Server Initialization
const PORT = process.env.PORT || 5000;

try {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
} catch (error) {
    console.error(`Error: ${error.message}`);
}
