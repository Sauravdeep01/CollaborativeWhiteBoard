import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import User from '../models/User.js';

const registerSchema = z.object({
    name: z.string().trim().min(2).max(60),
    email: z.string().trim().email().toLowerCase(),
    password: z.string().min(6).max(128)
});

const loginSchema = z.object({
    email: z.string().trim().email().toLowerCase(),
    password: z.string().min(1).max(128)
});

const signToken = (userId) => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET is not set in environment variables');
    }

    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
    return jwt.sign({ id: userId }, secret, { expiresIn });
};

export const register = async (req, res) => {
    try {
        const parsed = registerSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                success: false,
                message: 'Invalid input',
                errors: parsed.error.flatten()
            });
        }

        const { name, email, password } = parsed.data;

        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(409).json({
                success: false,
                message: 'Email already registered'
            });
        }

        const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS || 10);
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const user = await User.create({
            name,
            email,
            password: hashedPassword
        });

        const token = signToken(user._id);

        return res.status(201).json({
            success: true,
            message: 'Registered successfully',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || 'Server error'
        });
    }
};

export const login = async (req, res) => {
    try {
        const parsed = loginSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                success: false,
                message: 'Invalid input',
                errors: parsed.error.flatten()
            });
        }

        const { email, password } = parsed.data;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const ok = await bcrypt.compare(password, user.password);
        if (!ok) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const token = signToken(user._id);

        return res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || 'Server error'
        });
    }
};
