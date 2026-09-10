 import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { env } from './config/env';
import { connectDB } from './db/connection';
import { logger } from './utils/logger';
import authRoutes, { seedUsers } from './routes/auth';
import inspectionsRoutes from './routes/inspections';

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/inspections', inspectionsRoutes);

// Database Health Check
app.get('/api/health', async (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  const status = isDbConnected ? 'healthy' : 'degraded';
  
  res.status(isDbConnected ? 200 : 503).json({ 
    status, 
    database: isDbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString() 
  });
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error(err);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: 'Validation Error', details: err.message });
  }

  if (err.code === 11000) {
    return res.status(409).json({ error: 'Duplicate Key Error', details: 'A record with this identifier already exists.' });
  }

  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    return res.status(400).json({ error: 'Invalid ID Format' });
  }

  res.status(500).json({ error: 'Internal Server Error' });
});

const startServer = async () => {
  await connectDB();
  await seedUsers(); // Seed test users if none exist

  app.listen(Number(env.PORT), '0.0.0.0', () => {
    logger.info(`Server is running on port ${env.PORT}`);
  });
};

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app; // export for testing
