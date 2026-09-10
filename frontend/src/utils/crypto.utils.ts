/**
 * Calculates authentic SHA-256 checksum from actual file/blob bytes using Web Crypto API.
 * Never hashes string filenames, URIs, or metadata.
 */
export async function calculateFileSha256(blobOrFile: Blob | File): Promise<string> {
  const arrayBuffer = await blobOrFile.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hexString = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hexString;
}

/**
 * Calculates SHA-256 from an ArrayBuffer directly.
 */
export async function calculateBufferSha256(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
