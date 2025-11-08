/**
 * Example Badge Icon Upload Component for Admin Panel
 *
 * This file demonstrates how to integrate badge icon uploads in the admin panel.
 * Copy this code to your admin badge management component.
 */

import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Avatar,
  IconButton,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Stack
} from '@mui/material';
import { Delete as DeleteIcon, Upload as UploadIcon } from '@mui/icons-material';
import { uploadBadgeIcon, deleteBadgeIcon, validateBadgeIcon } from './utils/storageHelpers';
import { supabase } from './lib/supabase';

interface BadgeIconUploaderProps {
  badgeId: string;
  badgeCode: string;
  currentIconUrl?: string | null;
  onIconUpdated?: (newUrl: string) => void;
}

export function BadgeIconUploader({
  badgeId,
  badgeCode,
  currentIconUrl,
  onIconUpdated
}: BadgeIconUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setError(null);
    setSuccess(false);

    // Validate the file
    const validation = await validateBadgeIcon(selectedFile);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      setFile(null);
      setPreview(null);
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);

    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Upload the icon to Supabase Storage
      const { url } = await uploadBadgeIcon(file, badgeCode);

      // Update the badge record with the new icon URL
      const { error: updateError } = await supabase
        .from('badges')
        .update({ icon_url: url })
        .eq('id', badgeId);

      if (updateError) throw updateError;

      setSuccess(true);
      setFile(null);
      setPreview(null);

      // Notify parent component
      onIconUpdated?.(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!currentIconUrl || !confirm('Are you sure you want to delete this icon?')) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Delete from storage
      await deleteBadgeIcon(currentIconUrl);

      // Update the badge record to remove the icon URL
      const { error: updateError } = await supabase
        .from('badges')
        .update({ icon_url: null })
        .eq('id', badgeId);

      if (updateError) throw updateError;

      // Notify parent component
      onIconUpdated?.(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Badge Icon
        </Typography>

        {/* Current Icon Display */}
        {currentIconUrl && !preview && (
          <Box sx={{ mb: 2, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
              Current Icon
            </Typography>
            <Avatar
              src={currentIconUrl}
              alt="Badge icon"
              sx={{ width: 128, height: 128, mx: 'auto', mb: 1 }}
              variant="rounded"
            />
            <IconButton
              color="error"
              onClick={handleDelete}
              disabled={loading}
              size="small"
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        )}

        {/* Preview of New Icon */}
        {preview && (
          <Box sx={{ mb: 2, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
              Preview
            </Typography>
            <Avatar
              src={preview}
              alt="Preview"
              sx={{ width: 128, height: 128, mx: 'auto', mb: 1 }}
              variant="rounded"
            />
          </Box>
        )}

        {/* Upload Form */}
        <Stack spacing={2}>
          <Button
            variant="outlined"
            component="label"
            startIcon={<UploadIcon />}
            disabled={loading}
            fullWidth
          >
            Choose Icon
            <input
              type="file"
              hidden
              accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
              onChange={handleFileChange}
              disabled={loading}
            />
          </Button>

          {file && (
            <>
              <Typography variant="body2" color="text.secondary">
                Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </Typography>

              <Button
                onClick={handleUpload}
                disabled={loading}
                variant="contained"
                fullWidth
              >
                {loading ? <CircularProgress size={24} /> : 'Upload Icon'}
              </Button>
            </>
          )}

          {/* Error Message */}
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Success Message */}
          {success && (
            <Alert severity="success" onClose={() => setSuccess(false)}>
              Icon uploaded successfully!
            </Alert>
          )}

          {/* Info */}
          <Alert severity="info">
            <Typography variant="caption" component="div">
              Requirements:
            </Typography>
            <Typography variant="caption" component="ul" sx={{ pl: 2, mb: 0 }}>
              <li>Max file size: 2MB</li>
              <li>Formats: PNG, JPG, SVG, WebP</li>
              <li>Max dimensions: 1024×1024px</li>
            </Typography>
          </Alert>
        </Stack>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// USAGE EXAMPLE IN ADMIN BADGE FORM
// ============================================================================

export function AdminBadgeFormExample() {
  const [badgeId, setBadgeId] = useState('');
  const [badgeCode, setBadgeCode] = useState('');
  const [iconUrl, setIconUrl] = useState<string | null>(null);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Create/Edit Badge
      </Typography>

      {/* Badge Details Form */}
      <Stack spacing={3} sx={{ mb: 3 }}>
        <TextField
          label="Badge Code"
          value={badgeCode}
          onChange={(e) => setBadgeCode(e.target.value)}
          helperText="Unique identifier (e.g., first_drink)"
        />

        <TextField
          label="Badge Title"
          helperText="Display name (e.g., First Drink)"
        />

        <TextField
          label="Description"
          multiline
          rows={3}
          helperText="What this badge represents"
        />

        {/* Other badge fields... */}
      </Stack>

      {/* Icon Upload Component */}
      {badgeId && badgeCode && (
        <BadgeIconUploader
          badgeId={badgeId}
          badgeCode={badgeCode}
          currentIconUrl={iconUrl}
          onIconUpdated={(newUrl) => {
            setIconUrl(newUrl);
            console.log('Icon updated:', newUrl);
          }}
        />
      )}
    </Box>
  );
}

// ============================================================================
// SIMPLE INLINE UPLOAD EXAMPLE
// ============================================================================

export function SimpleInlineUploadExample() {
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Validate
      const validation = await validateBadgeIcon(file);
      if (!validation.valid) {
        alert(validation.error);
        return;
      }

      // Upload
      const { url } = await uploadBadgeIcon(file, 'my_badge_code');

      // Update badge in database
      await supabase
        .from('badges')
        .update({ icon_url: url })
        .eq('code', 'my_badge_code');

      alert('Icon uploaded successfully!');
    } catch (error) {
      alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <input
      type="file"
      accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
      onChange={handleFileUpload}
    />
  );
}

// ============================================================================
// BADGE DISPLAY EXAMPLE (FOR END USERS)
// ============================================================================

interface BadgeDisplayProps {
  iconUrl?: string | null;
  title: string;
  description: string;
  tier: string;
}

export function BadgeDisplay({ iconUrl, title, description, tier }: BadgeDisplayProps) {
  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'bronze': return '#CD7F32';
      case 'silver': return '#C0C0C0';
      case 'gold': return '#FFD700';
      case 'platinum': return '#E5E4E2';
      case 'legendary': return '#FF6B35';
      default: return '#888';
    }
  };

  return (
    <Card sx={{ maxWidth: 200 }}>
      <CardMedia
        component="img"
        height="140"
        image={iconUrl || '/default-badge-icon.png'}
        alt={title}
        sx={{
          backgroundColor: getTierColor(tier),
          objectFit: 'contain',
          p: 2
        }}
      />
      <CardContent>
        <Typography variant="h6" component="div">
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
          {tier}
        </Typography>
      </CardContent>
    </Card>
  );
}
