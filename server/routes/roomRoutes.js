import express from 'express';
import { getRecentSessions } from '../controllers/roomController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.get('/recent', auth, getRecentSessions);

export default router;
