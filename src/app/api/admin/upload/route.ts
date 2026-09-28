// =============================================================================
// POST /api/admin/upload — Upload images to Supabase Storage
// Accepts multipart form data with one or more 'files' + optional 'folder' & 'entityId'
//
// DELETE /api/admin/upload — Delete an image from Supabase Storage
// Body: { bucket, path } or { bucket, url }
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import {
  uploadFile,
  deleteFile,
  validateImageFile,
  generateFilePath,
  extractPathFromUrl,
  BUCKETS,
  type BucketName,
} from '@/lib/supabase/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Configuration from form fields
    const bucket = (formData.get('bucket') as string) || BUCKETS.PRODUCT_IMAGES;
    const folder = (formData.get('folder') as string) || 'products';
    const entityId = (formData.get('entityId') as string) || 'temp';

    // Validate bucket name
    const validBuckets = Object.values(BUCKETS);
    if (!validBuckets.includes(bucket as BucketName)) {
      return NextResponse.json(
        { error: `Invalid bucket: ${bucket}. Allowed: ${validBuckets.join(', ')}` },
        { status: 400 }
      );
    }

    // Collect all file entries
    const files: File[] = [];
    for (const [key, value] of formData.entries()) {
      if (key === 'files' && value instanceof File) {
        files.push(value);
      }
    }

    if (files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided. Send files with field name "files".' },
        { status: 400 }
      );
    }

    if (files.length > 10) {
      return NextResponse.json(
        { error: 'Maximum 10 files per upload request.' },
        { status: 400 }
      );
    }

    // Process each file
    const results: Array<{
      success: boolean;
      url?: string;
      path?: string;
      filename: string;
      size: number;
      error?: string;
    }> = [];

    for (const file of files) {
      // Validate
      const validation = validateImageFile({
        size: file.size,
        type: file.type,
        name: file.name,
      });

      if (!validation.valid) {
        results.push({
          success: false,
          filename: file.name,
          size: file.size,
          error: validation.error,
        });
        continue;
      }

      try {
        // Read file into buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Generate unique path
        const filePath = generateFilePath(folder, entityId, file.name);

        // Upload to Supabase Storage
        const { url, path } = await uploadFile(
          bucket as BucketName,
          filePath,
          buffer,
          file.type
        );

        results.push({
          success: true,
          url,
          path,
          filename: file.name,
          size: file.size,
        });
      } catch (err: any) {
        results.push({
          success: false,
          filename: file.name,
          size: file.size,
          error: err.message || 'Upload failed',
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failedCount = results.filter((r) => !r.success).length;

    return NextResponse.json({
      success: failedCount === 0,
      message: `${successCount} uploaded${failedCount > 0 ? `, ${failedCount} failed` : ''}`,
      results,
    });
  } catch (err: any) {
    console.error('[Upload API] Unexpected error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { bucket = BUCKETS.PRODUCT_IMAGES, path, url } = body;

    // Determine file path
    let filePath = path;
    if (!filePath && url) {
      filePath = extractPathFromUrl(url, bucket as BucketName);
    }

    if (!filePath) {
      return NextResponse.json(
        { error: 'Provide either "path" or "url" to identify the file to delete.' },
        { status: 400 }
      );
    }

    const success = await deleteFile(bucket as BucketName, filePath);

    return NextResponse.json({ success, path: filePath });
  } catch (err: any) {
    console.error('[Upload API DELETE] error:', err);
    return NextResponse.json(
      { error: err.message || 'Delete failed' },
      { status: 500 }
    );
  }
}
