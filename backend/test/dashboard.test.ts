import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '../src/index';
import { User } from '../src/db/models/User';
import { Inspection } from '../src/db/models/Inspection';

let mongoServer: MongoMemoryServer;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

describe('Dashboard API', () => {
  let inspectorToken: string;
  let inspectorId: mongoose.Types.ObjectId;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    const inspector = await User.create({
      email: 'dash_inspector@example.com',
      passwordHash: 'hashedpassword',
      name: 'Dash Inspector',
      role: 'inspector'
    });
    inspectorId = inspector._id as mongoose.Types.ObjectId;

    inspectorToken = jwt.sign(
      { userId: inspectorId.toString(), email: inspector.email, role: inspector.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Create 3 inspections for this inspector
    await Inspection.create([
      { inspector: inspectorId, lifecycleStatus: 'AWAITING_REVIEW', finalStatus: 'PENDING', clientReference: 'INS-01' },
      { inspector: inspectorId, lifecycleStatus: 'COMPLETED', finalStatus: 'POTENTIAL_VIOLATION', clientReference: 'INS-02' },
      { inspector: inspectorId, lifecycleStatus: 'COMPLETED', finalStatus: 'VERIFIED', clientReference: 'INS-03' }
    ]);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  it('should fetch dashboard data for an inspector', async () => {
    const res = await request(app)
      .get('/api/inspections/dashboard')
      .set('Authorization', `Bearer ${inspectorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.summary.totalInspections).toBe(3);
    expect(res.body.data.summary.pendingReview).toBe(1);
    expect(res.body.data.summary.potentialViolations).toBe(1);
    expect(res.body.data.summary.verified).toBe(1);
    expect(res.body.data.recentInspections.length).toBe(3);
  });

  it('should reject unauthenticated requests', async () => {
    const res = await request(app).get('/api/inspections/dashboard');
    expect(res.status).toBe(401);
  });
});
