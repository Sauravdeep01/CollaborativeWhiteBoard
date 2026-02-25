import express from 'express';
import { login, register, updateUser } from '../controllers/authController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.patch('/update', auth, updateUser);

export default router;
