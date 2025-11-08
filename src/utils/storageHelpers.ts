/**
 * Storage Helpers for Badge Icon Management
 *
 * Provides utility functions for uploading, deleting, and validating badge icon images
 * in Supabase Storage. All functions handle errors gracefully and return public URLs
 * for display.
 */

import { supabase } from '../lib/supabase';

// ============================================================================
// CONSTANTS
// ============================================================================

const BADGE_ICONS_BUCKET = 'badge-icons';
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB in bytes
const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];
const MAX_IMAGE_DIMENSION = 1024; // Max width/height in pixels

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
}

export interface UploadResult {
  url: string;
  path: string;
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validates an image file for badge icon upload
 * Checks file size, type, and dimensions
 *
 * @param file - The File object to validate
 * @returns Validation result with error message if invalid
 */
export async function validateBadgeIcon(file: File): Promise<ImageValidationResult> {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `Filstørrelsen må være mindre enn ${MAX_FILE_SIZE / 1024 / 1024}MB. Nåværende størrelse: ${(file.size / 1024 / 1024).toFixed(2)}MB`
    };
  }

  // Check file type
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Ugyldig filtype. Tillatte typer: PNG, JPG, JPEG, SVG, WebP. Mottok: ${file.type}`
    };
  }

  // For non-SVG images, check dimensions
  if (file.type !== 'image/svg+xml') {
    try {
      const dimensions = await getImageDimensions(file);
      if (dimensions.width > MAX_IMAGE_DIMENSION || dimensions.height > MAX_IMAGE_DIMENSION) {
        return {
          valid: false,
          error: `Bildedimensjoner må være ${MAX_IMAGE_DIMENSION}x${MAX_IMAGE_DIMENSION}px eller mindre. Mottok: ${dimensions.width}x${dimensions.height}px`
        };
      }
    } catch (error) {
      return {
        valid: false,
        error: `Kunne ikke lese bildedimensjoner: ${error instanceof Error ? error.message : 'Ukjent feil'}`
      };
    }
  }

  return { valid: true };
}

/**
 * Gets the dimensions of an image file
 *
 * @param file - The image File object
 * @returns Promise resolving to width and height
 */
function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

// ============================================================================
// UPLOAD FUNCTIONS
// ============================================================================

/**
 * Uploads a badge icon image to Supabase Storage
 * Validates the file before upload and returns the public URL
 *
 * @param file - The image File object to upload
 * @param badgeCode - Optional badge code to use as filename (defaults to file name)
 * @returns Promise resolving to the public URL and storage path
 * @throws Error if validation fails or upload fails
 */
export async function uploadBadgeIcon(
  file: File,
  badgeCode?: string
): Promise<UploadResult> {
  // Validate the file
  const validation = await validateBadgeIcon(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Generate file path
  const fileExtension = file.name.split('.').pop() || 'png';
  const fileName = badgeCode
    ? `${badgeCode}.${fileExtension}`
    : `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

  const filePath = fileName;

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from(BADGE_ICONS_BUCKET)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true // Allow overwriting existing files
    });

  if (error) {
    throw new Error(`Failed to upload badge icon: ${error.message}`);
  }

  if (!data) {
    throw new Error('Upload succeeded but no data returned');
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(BADGE_ICONS_BUCKET)
    .getPublicUrl(data.path);

  return {
    url: urlData.publicUrl,
    path: data.path
  };
}

// ============================================================================
// DELETE FUNCTIONS
// ============================================================================

/**
 * Deletes a badge icon from Supabase Storage
 * Accepts either a full URL or a storage path
 *
 * @param urlOrPath - The public URL or storage path of the badge icon
 * @throws Error if deletion fails
 */
export async function deleteBadgeIcon(urlOrPath: string): Promise<void> {
  if (!urlOrPath) {
    throw new Error('URL or path is required');
  }

  // Extract path from URL if full URL is provided
  let path = urlOrPath;

  // Check if it's a full URL (contains the bucket name in the path)
  if (urlOrPath.includes('supabase.co/storage/v1/object/public/badge-icons/')) {
    // Extract path after the bucket name
    const parts = urlOrPath.split('badge-icons/');
    if (parts.length > 1) {
      path = parts[1];
    }
  }

  // Remove any query parameters
  path = path.split('?')[0];

  // Delete from storage
  const { error } = await supabase.storage
    .from(BADGE_ICONS_BUCKET)
    .remove([path]);

  if (error) {
    throw new Error(`Failed to delete badge icon: ${error.message}`);
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Gets the public URL for a badge icon path
 *
 * @param path - The storage path of the badge icon
 * @returns The public URL
 */
export function getBadgeIconUrl(path: string): string {
  const { data } = supabase.storage
    .from(BADGE_ICONS_BUCKET)
    .getPublicUrl(path);

  return data.publicUrl;
}

/**
 * Lists all badge icons in the storage bucket
 * Admin-only function
 *
 * @returns Promise resolving to array of file metadata
 */
export async function listBadgeIcons() {
  const { data, error } = await supabase.storage
    .from(BADGE_ICONS_BUCKET)
    .list();

  if (error) {
    throw new Error(`Failed to list badge icons: ${error.message}`);
  }

  return data || [];
}
