import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authenticateJWT, AuthRequest } from '../middleware/authMiddleware';
import { User } from '../db/models/User';
import { env } from '../config/env';

const router = Router();

const JWT_SECRET = env.JWT_SECRET;
const REFRESH_SECRET = env.REFRESH_SECRET;

// Helper functions for tokens
const generateAccessToken = (user: any) => {
  return jwt.sign({ userId: user.id || user._id, role: user.role }, JWT_SECRET, { expiresIn: '15m' });
};

const generateRefreshToken = (user: any) => {
  return jwt.sign({ userId: user.id || user._id, role: user.role }, REFRESH_SECRET, { expiresIn: '7d' });
};

// In a real app, refresh tokens would be managed in the DB.
const refreshTokens: string[] = [];

// Seed initial users for quick testing
export const seedUsers = async () => {
  const count = await User.countDocuments();
  if (count === 0) {
    const passwordHash = await bcrypt.hash('password123', 10);
    await User.insertMany([
      { email: 'inspector@inspectmate.com', passwordHash, role: 'inspector', name: 'Jane Inspector' },
      { email: 'admin@inspectmate.com', passwordHash, role: 'admin', name: 'Admin User' },
      { email: 'regulator@inspectmate.com', passwordHash, role: 'regulator', name: 'Chief Regulator' }
    ]);
  }
};

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name, role = 'inspector' } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ error: 'User already exists' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      email,
      passwordHash: hashedPassword,
      name,
      role
    });

    await newUser.save();
    res.status(201).json({ message: 'User registered successfully', userId: newUser._id });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    refreshTokens.push(refreshToken);

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req: Request, res: Response) => {
  const { token } = req.body;
  const index = refreshTokens.indexOf(token);
  if (index > -1) {
    refreshTokens.splice(index, 1);
  }
  res.json({ message: 'Logged out successfully' });
});

// GET /api/auth/me
router.get('/me', authenticateJWT, async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
     res.status(401).json({ error: 'Unauthorized' });
     return;
  }
  
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  const { token } = req.body;

  if (!token) {
    res.status(401).json({ error: 'Refresh token required' });
    return;
  }

  if (!refreshTokens.includes(token)) {
    res.status(403).json({ error: 'Invalid refresh token' });
    return;
  }

  jwt.verify(token, REFRESH_SECRET, async (err: any, payload: any) => {
    if (err) {
      res.status(403).json({ error: 'Invalid refresh token' });
      return;
    }

    try {
      const user = await User.findById(payload.userId);
      if (!user) {
        res.status(403).json({ error: 'User not found' });
        return;
      }

      const accessToken = generateAccessToken(user);
      res.json({ accessToken });
    } catch (dbErr) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
});

export default router;
