// =============================================================================
// StarPress — Supabase Storage Helper (Server-Side Only)
// Handles file uploads, deletions, and public URL generation for product/category images.
// =============================================================================

import { getAdminClient } from './admin';

// Bucket names — must match the buckets created in Supabase Dashboard
export const BUCKETS = {
  PRODUCT_IMAGES: 'product-images',
  CATEGORY_IMAGES: 'category-images',
} as const;

export type BucketName = typeof BUCKETS[keyof typeof BUCKETS];

/**
 * Upload a file buffer to Supabase Storage.
 * Returns the public URL on success.
 */
export async function uploadFile(
  bucket: BucketName,
  filePath: string,
  fileBuffer: Buffer,
  contentType: string
): Promise<{ url: string; path: string }> {
  const supabase = getAdminClient();

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, fileBuffer, {
      contentType,
      upsert: true, // Overwrite if same path exists
      cacheControl: '31536000', // 1 year CDN cache
    });

  if (error) {
    console.error(`[Storage] Upload failed for ${bucket}/${filePath}:`, error);
    throw new Error(`Upload failed: ${error.message}`);
  }

  // Get the public URL
  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return {
    url: urlData.publicUrl,
    path: data.path,
  };
}

/**
 * Delete a file from Supabase Storage by its path within the bucket.
 */
export async function deleteFile(
  bucket: BucketName,
  filePath: string
): Promise<boolean> {
  const supabase = getAdminClient();

  const { error } = await supabase.storage
    .from(bucket)
    .remove([filePath]);

  if (error) {
    console.error(`[Storage] Delete failed for ${bucket}/${filePath}:`, error);
    return false;
  }

  return true;
}

/**
 * Delete multiple files from Supabase Storage.
 */
export async function deleteFiles(
  bucket: BucketName,
  filePaths: string[]
): Promise<boolean> {
  if (filePaths.length === 0) return true;

  const supabase = getAdminClient();

  const { error } = await supabase.storage
    .from(bucket)
    .remove(filePaths);

  if (error) {
    console.error(`[Storage] Bulk delete failed for ${bucket}:`, error);
    return false;
  }

  return true;
}

/**
 * Extract the storage path from a full Supabase public URL.
 * e.g. "https://xxx.supabase.co/storage/v1/object/public/product-images/products/abc/img.webp"
 *   → "products/abc/img.webp"
 */
export function extractPathFromUrl(url: string, bucket: BucketName): string | null {
  try {
    const marker = `/storage/v1/object/public/${bucket}/`;
    const idx = url.indexOf(marker);
    if (idx === -1) return null;
    return url.substring(idx + marker.length);
  } catch {
    return null;
  }
}

/**
 * Generate a unique file path for an uploaded image.
 */
export function generateFilePath(
  folder: string,
  entityId: string,
  originalFilename: string
): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  // Sanitize filename: lowercase, replace spaces with hyphens, remove special chars
  const sanitized = originalFilename
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9.\-_]/g, '')
    .substring(0, 60);
  
  // Ensure extension
  const ext = sanitized.includes('.') ? '' : '.webp';
  
  return `${folder}/${entityId}/${timestamp}-${random}-${sanitized}${ext}`;
}

/**
 * Validate an uploaded file for image requirements.
 */
export function validateImageFile(
  file: { size: number; type: string; name: string },
  maxSizeMB: number = 5
): { valid: boolean; error?: string } {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/avif',
  ];

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type: ${file.type}. Allowed: JPEG, PNG, WebP, GIF, AVIF`,
    };
  }

  const maxBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxBytes) {
    return {
      valid: false,
      error: `File too large: ${(file.size / 1024 / 1024).toFixed(1)} MB. Max: ${maxSizeMB} MB`,
    };
  }

  return { valid: true };
}
