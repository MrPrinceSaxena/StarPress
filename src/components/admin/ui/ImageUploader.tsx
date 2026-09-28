'use client';

// =============================================================================
// ImageUploader — Drag-and-Drop Image Upload Component for Admin Panel
// Supports: drag-drop, file picker, multiple files, progress bars, reorder, delete
// =============================================================================

import React, { useState, useRef, useCallback } from 'react';
import {
  Upload, X, Trash2, GripVertical, Star, Loader2,
  ImageIcon, CheckCircle2, AlertCircle,
} from 'lucide-react';

export interface UploadedImage {
  id: string;
  url: string;
  altText: string;
  isPrimary: boolean;
  position: number;
  /** Storage path in Supabase (for deletion) */
  storagePath?: string;
}

interface UploadingFile {
  id: string;
  file: File;
  preview: string;
  progress: number;
  status: 'uploading' | 'done' | 'error';
  error?: string;
}

interface ImageUploaderProps {
  images: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
  /** Supabase storage bucket */
  bucket?: string;
  /** Folder within bucket (e.g. 'products' or 'categories') */
  folder?: string;
  /** Entity ID for organizing files */
  entityId?: string;
  /** Maximum number of images allowed */
  maxImages?: number;
  /** Maximum file size in MB */
  maxSizeMB?: number;
}

export default function ImageUploader({
  images,
  onChange,
  bucket = 'product-images',
  folder = 'products',
  entityId = 'temp',
  maxImages = 10,
  maxSizeMB = 5,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState<UploadingFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [dragSourceIndex, setDragSourceIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalImages = images.length + uploading.filter((u) => u.status === 'uploading').length;

  // ---- Upload Logic ----
  const uploadFiles = useCallback(
    async (filesToUpload: File[]) => {
      const remaining = maxImages - images.length;
      const batch = filesToUpload.slice(0, remaining);

      if (batch.length === 0) return;

      // Create upload entries with local previews
      const newUploading: UploadingFile[] = batch.map((file) => ({
        id: `upload_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        file,
        preview: URL.createObjectURL(file),
        progress: 0,
        status: 'uploading' as const,
      }));

      setUploading((prev) => [...prev, ...newUploading]);

      // Upload each file
      for (const entry of newUploading) {
        try {
          const formData = new FormData();
          formData.append('files', entry.file);
          formData.append('bucket', bucket);
          formData.append('folder', folder);
          formData.append('entityId', entityId);

          // Simulate progress (since fetch doesn't natively support upload progress)
          const progressInterval = setInterval(() => {
            setUploading((prev) =>
              prev.map((u) =>
                u.id === entry.id && u.progress < 85
                  ? { ...u, progress: u.progress + Math.random() * 15 }
                  : u
              )
            );
          }, 200);

          const res = await fetch('/api/admin/upload', {
            method: 'POST',
            body: formData,
          });

          clearInterval(progressInterval);

          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || `Upload failed (${res.status})`);
          }

          const data = await res.json();
          const result = data.results?.[0];

          if (!result?.success) {
            throw new Error(result?.error || 'Upload failed');
          }

          // Mark upload as done
          setUploading((prev) =>
            prev.map((u) =>
              u.id === entry.id ? { ...u, progress: 100, status: 'done' } : u
            )
          );

          // Add to images array
          const newImage: UploadedImage = {
            id: `img_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            url: result.url,
            altText: entry.file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
            isPrimary: images.length === 0 && newUploading.indexOf(entry) === 0,
            position: images.length + newUploading.indexOf(entry),
            storagePath: result.path,
          };

          onChange([...images, newImage]);

          // Remove from uploading state after brief delay (so user sees success state)
          setTimeout(() => {
            setUploading((prev) => prev.filter((u) => u.id !== entry.id));
            URL.revokeObjectURL(entry.preview);
          }, 800);
        } catch (err: any) {
          setUploading((prev) =>
            prev.map((u) =>
              u.id === entry.id
                ? { ...u, status: 'error', error: err.message, progress: 0 }
                : u
            )
          );
        }
      }
    },
    [images, onChange, bucket, folder, entityId, maxImages]
  );

  // ---- File Selection ----
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length > 0) uploadFiles(files);
      // Reset input so same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [uploadFiles]
  );

  // ---- Drag & Drop Zone ----
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files).filter((f) =>
        f.type.startsWith('image/')
      );
      if (files.length > 0) uploadFiles(files);
    },
    [uploadFiles]
  );

  // ---- Image Actions ----
  const removeImage = useCallback(
    async (index: number) => {
      const img = images[index];
      const newImages = images.filter((_, i) => i !== index);

      // If we removed the primary, set the first remaining as primary
      if (img.isPrimary && newImages.length > 0) {
        newImages[0] = { ...newImages[0], isPrimary: true };
      }

      // Reindex positions
      const reindexed = newImages.map((im, i) => ({ ...im, position: i }));
      onChange(reindexed);

      // Delete from storage in background (non-blocking)
      if (img.storagePath) {
        fetch('/api/admin/upload', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bucket, path: img.storagePath }),
        }).catch(() => {});
      } else if (img.url && img.url.includes('supabase')) {
        fetch('/api/admin/upload', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bucket, url: img.url }),
        }).catch(() => {});
      }
    },
    [images, onChange, bucket]
  );

  const setPrimary = useCallback(
    (index: number) => {
      const updated = images.map((img, i) => ({
        ...img,
        isPrimary: i === index,
      }));
      onChange(updated);
    },
    [images, onChange]
  );

  const removeUploadingEntry = useCallback((id: string) => {
    setUploading((prev) => {
      const entry = prev.find((u) => u.id === id);
      if (entry) URL.revokeObjectURL(entry.preview);
      return prev.filter((u) => u.id !== id);
    });
  }, []);

  // ---- Drag Reorder Logic ----
  const handleImageDragStart = useCallback((index: number) => {
    setDragSourceIndex(index);
  }, []);

  const handleImageDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  }, []);

  const handleImageDrop = useCallback(
    (targetIndex: number) => {
      if (dragSourceIndex === null || dragSourceIndex === targetIndex) {
        setDragSourceIndex(null);
        setDragOverIndex(null);
        return;
      }

      const reordered = [...images];
      const [moved] = reordered.splice(dragSourceIndex, 1);
      reordered.splice(targetIndex, 0, moved);

      const reindexed = reordered.map((img, i) => ({ ...img, position: i }));
      onChange(reindexed);

      setDragSourceIndex(null);
      setDragOverIndex(null);
    },
    [images, dragSourceIndex, onChange]
  );

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
          isDragging
            ? 'border-brand-yellow bg-brand-yellow/[0.05] scale-[1.01]'
            : 'border-border-subtle hover:border-brand-yellow/30 hover:bg-brand-yellow/[0.02]'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
        <div className={`transition-transform ${isDragging ? 'scale-110' : ''}`}>
          <Upload
            size={28}
            className={`mx-auto mb-2.5 ${isDragging ? 'text-brand-yellow' : 'text-text-muted'}`}
          />
          <p className="text-xs font-medium text-text-secondary">
            {isDragging ? 'Drop images here' : 'Drag & drop images or click to browse'}
          </p>
          <p className="text-[11px] text-text-muted mt-1">
            PNG, JPG, WebP, GIF, AVIF • Max {maxSizeMB} MB per file • {totalImages}/{maxImages} images
          </p>
        </div>
      </div>

      {/* Uploading Progress */}
      {uploading.length > 0 && (
        <div className="space-y-2">
          {uploading.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.02] border border-border-subtle"
            >
              {/* Thumbnail Preview */}
              <div className="w-10 h-10 rounded-md overflow-hidden bg-white/[0.04] shrink-0">
                <img
                  src={entry.preview}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>

              {/* File Info & Progress */}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white truncate">{entry.file.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  {entry.status === 'uploading' && (
                    <>
                      <div className="flex-1 h-1 bg-white/[0.06] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand-yellow rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(entry.progress, 100)}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-text-muted font-mono">
                        {Math.round(entry.progress)}%
                      </span>
                    </>
                  )}
                  {entry.status === 'done' && (
                    <span className="flex items-center gap-1 text-[11px] text-emerald-400">
                      <CheckCircle2 size={12} /> Uploaded
                    </span>
                  )}
                  {entry.status === 'error' && (
                    <span className="flex items-center gap-1 text-[11px] text-rose-400">
                      <AlertCircle size={12} /> {entry.error || 'Failed'}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              {entry.status === 'uploading' && (
                <Loader2 size={14} className="text-brand-yellow animate-spin shrink-0" />
              )}
              {entry.status === 'error' && (
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeUploadingEntry(entry.id);
                      uploadFiles([entry.file]);
                    }}
                    className="px-2 py-1 rounded text-[10px] font-medium text-brand-yellow hover:bg-brand-yellow/10 transition-colors"
                  >
                    Retry
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeUploadingEntry(entry.id);
                    }}
                    className="p-1 rounded text-text-muted hover:text-rose-400 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Uploaded Images Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {images.map((img, idx) => (
            <div
              key={img.id}
              draggable
              onDragStart={() => handleImageDragStart(idx)}
              onDragOver={(e) => handleImageDragOver(e, idx)}
              onDrop={() => handleImageDrop(idx)}
              onDragEnd={() => {
                setDragSourceIndex(null);
                setDragOverIndex(null);
              }}
              className={`
                relative rounded-lg border overflow-hidden aspect-square bg-white/[0.03]
                transition-all duration-200 group
                ${img.isPrimary ? 'border-brand-yellow/40 ring-1 ring-brand-yellow/20' : 'border-border-subtle'}
                ${dragSourceIndex === idx ? 'opacity-40 scale-95' : ''}
                ${dragOverIndex === idx && dragSourceIndex !== idx ? 'border-brand-yellow ring-2 ring-brand-yellow/30 scale-105' : ''}
              `}
            >
              {/* Image */}
              {img.url ? (
                <img
                  src={img.url}
                  alt={img.altText || ''}
                  className="absolute inset-0 w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-text-muted">
                  <ImageIcon size={24} />
                </div>
              )}

              {/* Top-left: Drag handle + Primary badge */}
              <div className="absolute top-2 left-2 flex items-center gap-1">
                <div className="p-0.5 rounded bg-black/40 backdrop-blur-sm cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity">
                  <GripVertical size={12} className="text-white/80" />
                </div>
                {img.isPrimary && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-brand-yellow text-black shadow-sm">
                    PRIMARY
                  </span>
                )}
              </div>

              {/* Top-right: Actions */}
              <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {!img.isPrimary && (
                  <button
                    onClick={() => setPrimary(idx)}
                    title="Set as primary image"
                    className="p-1 rounded bg-black/50 backdrop-blur-sm text-white/70 hover:text-brand-yellow transition-colors"
                  >
                    <Star size={12} />
                  </button>
                )}
                <button
                  onClick={() => removeImage(idx)}
                  title="Remove image"
                  className="p-1 rounded bg-black/50 backdrop-blur-sm text-white/70 hover:text-rose-400 transition-colors"
                >
                  <Trash2 size={12} />
                </button>
              </div>

              {/* Bottom: File info overlay */}
              <div className="absolute bottom-0 left-0 right-0 px-2 py-1.5 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-[10px] text-white/80 truncate">{img.altText || 'Image'}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {images.length === 0 && uploading.length === 0 && (
        <p className="text-center text-xs text-text-muted py-2">
          No images uploaded yet. Add images to make your product stand out!
        </p>
      )}
    </div>
  );
}
