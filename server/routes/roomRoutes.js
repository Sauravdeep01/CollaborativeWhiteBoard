import express from 'express';
import { getRecentSessions, validateRoom, createRoom } from '../controllers/roomController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.get('/recent', auth, getRecentSessions);
router.get('/validate/:roomId', validateRoom);
router.post('/create', auth, createRoom);

export default router;
