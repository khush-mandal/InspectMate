import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authenticateJWT, AuthRequest } from '../middleware/authMiddleware';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'refreshsecret';

// In-memory mock database
const users: any[] = [];
const refreshTokens: string[] = []; // In a real app, store this in DB mapped to user

// Helper functions for tokens
const generateAccessToken = (user: any) => {
  return jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '15m' });
};

const generateRefreshToken = (user: any) => {
  const token = jwt.sign({ userId: user.id, role: user.role }, REFRESH_SECRET, { expiresIn: '7d' });
  refreshTokens.push(token);
  return token;
};

// Seed initial users for quick testing
(async () => {
  const passwordHash = await bcrypt.hash('password123', 10);
  users.push({
    id: 'user-1',
    email: 'inspector@inspectmate.com',
    password: passwordHash,
    role: 'inspector',
    name: 'Jane Inspector'
  });
  users.push({
    id: 'user-2',
    email: 'admin@inspectmate.com',
    password: passwordHash,
    role: 'admin',
    name: 'Admin User'
  });
  users.push({
    id: 'user-3',
    email: 'regulator@inspectmate.com',
    password: passwordHash,
    role: 'regulator',
    name: 'Chief Regulator'
  });
})();

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name, role = 'inspector' } = req.body;
    
    if (users.find(u => u.email === email)) {
      res.status(400).json({ error: 'User already exists' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: `user-${Date.now()}`,
      email,
      password: hashedPassword,
      name,
      role
    };

    users.push(newUser);
    res.status(201).json({ message: 'User registered successfully', userId: newUser.id });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email);

    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
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
  // Remove refresh token
  const index = refreshTokens.indexOf(token);
  if (index > -1) {
    refreshTokens.splice(index, 1);
  }
  res.json({ message: 'Logged out successfully' });
});

// GET /api/auth/me
router.get('/me', authenticateJWT, (req: AuthRequest, res: Response): void => {
  if (!req.user) {
     res.status(401).json({ error: 'Unauthorized' });
     return;
  }
  
  const user = users.find(u => u.id === req.user?.userId);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    }
  });
});

// POST /api/auth/refresh
router.post('/refresh', (req: Request, res: Response): void => {
  const { token } = req.body;

  if (!token) {
    res.status(401).json({ error: 'Refresh token required' });
    return;
  }

  if (!refreshTokens.includes(token)) {
    res.status(403).json({ error: 'Invalid refresh token' });
    return;
  }

  jwt.verify(token, REFRESH_SECRET, (err: any, payload: any) => {
    if (err) {
      res.status(403).json({ error: 'Invalid refresh token' });
      return;
    }

    const user = users.find(u => u.id === payload.userId);
    if (!user) {
      res.status(403).json({ error: 'User not found' });
      return;
    }

    const accessToken = generateAccessToken(user);
    res.json({ accessToken });
  });
});

export default router;
