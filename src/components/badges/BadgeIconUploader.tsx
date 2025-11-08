import { useState, useRef } from 'react';
import type { DragEvent, ChangeEvent } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Avatar,
  Alert,
  Typography,
  Paper,
  IconButton,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  Image as ImageIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { uploadBadgeIcon, validateBadgeIcon, deleteBadgeIcon } from '../../utils/storageHelpers';

// ============================================================================
// TYPES
// ============================================================================

interface BadgeIconUploaderProps {
  /** Current icon URL (if badge already has an icon) */
  currentIconUrl?: string | null;
  /** Badge code for naming uploaded file */
  badgeCode?: string;
  /** Callback when upload completes successfully */
  onUploadComplete: (url: string, path: string) => void;
  /** Optional callback when icon is deleted */
  onDelete?: () => void;
  /** Disable upload interactions */
  disabled?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * BadgeIconUploader Component
 *
 * Complete image upload component with drag & drop support for badge icons.
 *
 * Features:
 * - Drag & drop file upload
 * - Click to browse file selector
 * - Image preview before and after upload
 * - Real-time upload progress indicator
 * - Validation feedback (size, type, dimensions)
 * - Delete/replace functionality
 * - Accessible keyboard navigation
 * - Norwegian messages
 *
 * Validation Rules:
 * - Max file size: 2MB
 * - Allowed types: PNG, JPG, JPEG, SVG, WebP
 * - Max dimensions: 1024x1024px (except SVG)
 */
export default function BadgeIconUploader({
  currentIconUrl,
  badgeCode,
  onUploadComplete,
  onDelete,
  disabled = false,
}: BadgeIconUploaderProps) {
  // ============================================================================
  // STATE
  // ============================================================================

  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ============================================================================
  // DRAG & DROP HANDLERS
  // ============================================================================

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelection(files[0]);
    }
  };

  // ============================================================================
  // FILE SELECTION HANDLERS
  // ============================================================================

  const handleClickUpload = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelection(files[0]);
    }
  };

  // ============================================================================
  // FILE PROCESSING
  // ============================================================================

  const handleFileSelection = async (file: File) => {
    // Reset previous states
    setError(null);
    setSuccessMessage(null);
    setPreviewUrl(null);

    // Validate file
    const validation = await validateBadgeIcon(file);
    if (!validation.valid) {
      setError(validation.error || 'Ugyldig fil');
      return;
    }

    // Create preview URL
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    // Upload file
    await uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      // Simulate progress (since Supabase doesn't provide upload progress)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      // Upload to Supabase
      const result = await uploadBadgeIcon(file, badgeCode);

      // Complete progress
      clearInterval(progressInterval);
      setUploadProgress(100);

      // Clean up preview URL
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      // Success
      setSuccessMessage('Ikonet ble lastet opp!');
      onUploadComplete(result.url, result.path);

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Opplasting feilet');
      // Revert preview on error
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // ============================================================================
  // DELETE HANDLER
  // ============================================================================

  const handleDelete = async () => {
    if (!currentIconUrl || !onDelete) return;

    setError(null);
    setIsUploading(true);

    try {
      await deleteBadgeIcon(currentIconUrl);
      onDelete();
      setSuccessMessage('Ikon slettet');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunne ikke slette ikon');
    } finally {
      setIsUploading(false);
    }
  };

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const displayImageUrl = currentIconUrl || previewUrl;
  const hasImage = Boolean(displayImageUrl);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <Box sx={{ width: '100%' }}>
      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Success Alert */}
      {successMessage && (
        <Alert
          severity="success"
          sx={{ mb: 2 }}
          icon={<CheckCircleIcon />}
          onClose={() => setSuccessMessage(null)}
        >
          {successMessage}
        </Alert>
      )}

      {/* Image Preview */}
      {hasImage && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            mb: 2,
          }}
        >
          <Box sx={{ position: 'relative' }}>
            <Avatar
              src={displayImageUrl || undefined}
              sx={{
                width: 120,
                height: 120,
                bgcolor: '#f3f4f6',
                border: '2px solid #e5e7eb',
              }}
            >
              <ImageIcon sx={{ fontSize: 48, color: '#9ca3af' }} />
            </Avatar>

            {/* Delete Button */}
            {currentIconUrl && onDelete && (
              <IconButton
                onClick={handleDelete}
                disabled={disabled || isUploading}
                sx={{
                  position: 'absolute',
                  top: -8,
                  right: -8,
                  bgcolor: '#dc2626',
                  color: 'white',
                  width: 32,
                  height: 32,
                  '&:hover': {
                    bgcolor: '#991b1b',
                  },
                  '&:disabled': {
                    bgcolor: '#fca5a5',
                  },
                }}
                aria-label="Slett ikon"
              >
                <DeleteIcon sx={{ fontSize: 18 }} />
              </IconButton>
            )}

            {/* Upload Progress Overlay */}
            {isUploading && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'rgba(0, 0, 0, 0.6)',
                  borderRadius: '50%',
                }}
              >
                <CircularProgress
                  variant={uploadProgress > 0 ? 'determinate' : 'indeterminate'}
                  value={uploadProgress}
                  sx={{ color: 'white' }}
                />
              </Box>
            )}
          </Box>
        </Box>
      )}

      {/* Drop Zone */}
      <Paper
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClickUpload}
        sx={{
          p: 3,
          textAlign: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
          border: '2px dashed',
          borderColor: isDragging ? '#3b82f6' : '#d1d5db',
          bgcolor: isDragging ? '#eff6ff' : '#f9fafb',
          transition: 'all 0.2s ease',
          '&:hover': disabled
            ? {}
            : {
                borderColor: '#3b82f6',
                bgcolor: '#f0f9ff',
              },
          opacity: disabled ? 0.5 : 1,
        }}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="Last opp badge-ikon"
        onKeyDown={(e) => {
          if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            handleClickUpload();
          }
        }}
      >
        <CloudUploadIcon
          sx={{
            fontSize: 48,
            color: isDragging ? '#3b82f6' : '#9ca3af',
            mb: 1,
          }}
        />

        <Typography variant="body1" sx={{ fontWeight: 500, mb: 0.5 }}>
          {hasImage ? 'Erstatt ikon' : 'Last opp ikon'}
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Dra og slipp fil her, eller klikk for å velge
        </Typography>

        <Typography variant="caption" color="text.secondary" display="block">
          PNG, JPG, SVG, WebP - Maks 2MB - Maks 1024x1024px
        </Typography>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
          disabled={disabled}
          aria-hidden="true"
        />
      </Paper>

      {/* Upload Progress Text */}
      {isUploading && uploadProgress > 0 && (
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Laster opp... {uploadProgress}%
          </Typography>
        </Box>
      )}

      {/* Replace Button (when image exists) */}
      {hasImage && !isUploading && (
        <Button
          variant="outlined"
          startIcon={<CloudUploadIcon />}
          onClick={handleClickUpload}
          disabled={disabled}
          fullWidth
          sx={{ mt: 2 }}
        >
          Velg nytt ikon
        </Button>
      )}
    </Box>
  );
}
