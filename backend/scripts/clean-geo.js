import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: 'inspectmate' });
  const col = mongoose.connection.db.collection('inspections');
  const res1 = await col.updateMany(
    { $or: [{ 'location.coordinates': { $size: 0 } }, { 'location.type': { $exists: false } }] },
    { $unset: { location: '' } }
  );
  console.log('Unset invalid locations count:', res1.modifiedCount);

  // Set proper valid GeoJSON coordinates for seeded items
  await col.updateMany(
    { location: { $exists: false } },
    { $set: { location: { type: 'Point', coordinates: [77.3910, 28.5355] } } }
  );
  console.log('Finished updating geo coordinates');
  process.exit(0);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
