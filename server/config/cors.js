export const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

const allowedOrigins = [CLIENT_ORIGIN, 'http://localhost:5173'];

export const corsOptions = {
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true
};

export const socketCorsOptions = {
    origin: CLIENT_ORIGIN,
    methods: ['GET', 'POST'],
    credentials: true
};
