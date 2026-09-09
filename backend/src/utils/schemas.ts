import { z } from 'zod';
import mongoose from 'mongoose';

// Validation for MongoDB ObjectId
export const objectIdSchema = z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
  message: 'Invalid ObjectId',
});

// Validation for GeoJSON Point
export const geoJsonPointSchema = z.object({
  type: z.literal('Point'),
  coordinates: z.tuple([
    z.number().min(-180).max(180), // Longitude
    z.number().min(-90).max(90)    // Latitude
  ])
});

// Validation for Bounding Box
export const boundingBoxSchema = z.object({
  x: z.number().min(0),
  y: z.number().min(0),
  width: z.number().min(0),
  height: z.number().min(0)
});

// Validation for Storage Metadata
export const storageMetadataSchema = z.object({
  provider: z.string(),
  bucket: z.string().optional(),
  key: z.string(),
  version: z.string().optional()
});

// Pagination schema
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});
