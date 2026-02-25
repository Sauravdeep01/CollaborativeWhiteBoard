import express from 'express';
import { getStatus } from '../controllers/sampleController.js';

const router = express.Router();

// Sample Route
router.get('/status', getStatus);

export default router;
