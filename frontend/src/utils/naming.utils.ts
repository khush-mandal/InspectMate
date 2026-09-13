/**
 * Generates deterministic file and media identifiers for InspectMate evidence capture.
 */

const MIME_EXTENSION_MAP: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'video/webm': 'webm',
  'video/mp4': 'mp4',
  'application/octet-stream': 'bin'
};

/**
 * Returns a deterministic file extension from a MIME type.
 */
export function getExtensionFromMime(mimeType: string): string {
  const cleanMime = (mimeType || '').toLowerCase().split(';')[0].trim();
  return MIME_EXTENSION_MAP[cleanMime] || 'bin';
}

/**
 * Generates a deterministic local file name based on inspection ID, capture slot, and content SHA-256.
 * Format: [sanitizedInspectionId]_[slotId]_[sha256Prefix12].[ext]
 */
export function generateDeterministicLocalFileId(
  inspectionId: string,
  slotId: string,
  sha256Hash: string,
  mimeType: string
): string {
  const safeInspection = (inspectionId || 'unknown').replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeSlot = (slotId || 'GENERIC').toUpperCase().replace(/[^A-Z0-9_]/g, '_');
  const shortHash = (sha256Hash || '000000000000').substring(0, 12).toLowerCase();
  const ext = getExtensionFromMime(mimeType);

  return `${safeInspection}_${safeSlot}_${shortHash}.${ext}`;
}

/**
 * Generates the localMediaId used as the primary key in MediaBlobStore.
 */
export function generateDeterministicMediaStoreId(localFileId: string): string {
  return `media_${localFileId}`;
}
