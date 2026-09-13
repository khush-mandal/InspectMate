import { z } from 'zod';

export const SyncMetadataSchema = z.object({
  syncState: z.enum(['LOCAL_ONLY', 'SYNC_PENDING', 'SYNCING', 'SYNCED', 'SYNC_FAILED']),
  lastSyncAttempt: z.string().datetime().optional(),
  errorCategory: z.string().optional(),
  idempotencyKey: z.string().optional(),
});

export const CreateInspectionDTO = z.object({
  inspectorId: z.string(),
  packageId: z.string().optional(),
  location: z.object({
    type: z.literal('Point'),
    coordinates: z.tuple([z.number(), z.number()])
  }).optional(),
  notes: z.string().max(2000).optional(),
  syncMetadata: SyncMetadataSchema.optional()
});

export const UpdateInspectionStatusDTO = z.object({
  status: z.enum([
    'DRAFT', 
    'EVIDENCE_CAPTURE', 
    'EXTRACTION', 
    'COMPLIANCE_PENDING', 
    'REVIEW_REQUIRED', 
    'COMPLETED', 
    'SYNC_PENDING', 
    'SYNCED', 
    'SYNC_FAILED'
  ])
});

export const CreatePackageDTO = z.object({
  gtin: z.string(),
  productName: z.string(),
  brand: z.string().optional(),
  company: z.string().optional(),
  category: z.string().optional(),
  source: z.string().optional()
});

export const CreateEvidenceDTO = z.object({
  inspectionId: z.string(),
  type: z.enum(['IMAGE', 'VIDEO', 'VIDEO_FRAME']),
  metadata: z.object({
    mimeType: z.string(),
    filename: z.string(),
    localFilePath: z.string(),
    storageKey: z.string().optional(),
    size: z.number().min(0),
    sha256: z.string(),
    captureTimestamp: z.string().datetime(),
    deviceMetadata: z.record(z.string(), z.any()).optional(),
    qualityResult: z.record(z.string(), z.any()).optional(),
    sourceEvidenceId: z.string().optional(),
    state: z.enum(['LOCAL', 'UPLOADED', 'SYNC_FAILED'])
  }),
  syncMetadata: SyncMetadataSchema.optional()
});
