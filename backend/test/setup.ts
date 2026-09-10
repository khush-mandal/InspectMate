import { MongoMemoryReplSet } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { afterAll, beforeAll, beforeEach } from 'vitest';
import '../src/db/models/Inspection';
import '../src/db/models/AuditLog';
import '../src/db/models/User';

let mongoServer: MongoMemoryReplSet;

beforeAll(async () => {
  mongoServer = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  const mongoUri = mongoServer.getUri();
  
  process.env.MONGODB_URI = mongoUri;
  process.env.JWT_SECRET = 'testsecret';
  process.env.REFRESH_SECRET = 'testrefresh';
  process.env.NODE_ENV = 'test';

  await mongoose.connect(mongoUri);

  // Ensure collections are explicitly created to avoid WriteConflict/catalog changes during transactions
  const models = mongoose.models;
  for (const modelName in models) {
    await models[modelName].createCollection();
  }
}, 60000);

beforeEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});
