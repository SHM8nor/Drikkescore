/**
 * BadgeIconUploader Example Usage
 *
 * This file demonstrates how to integrate the BadgeIconUploader component
 * into an admin badge creation/edit form.
 */

import { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Typography,
} from '@mui/material';
import { BadgeIconUploader } from './index';
import type { BadgeCategory, BadgeTier, CreateBadgeFormData } from '../../types/badges';

/**
 * Example: Badge Create/Edit Form
 *
 * Shows how to use BadgeIconUploader in a complete form
 */
export default function BadgeFormExample() {
  const [formData, setFormData] = useState<CreateBadgeFormData>({
    code: '',
    title: '',
    description: '',
    category: 'session',
    tier: 'bronze',
    tier_order: 1,
    icon_url: '',
    criteria: {
      type: 'threshold',
      conditions: [],
    },
    is_active: true,
    is_automatic: true,
    points: 10,
  });

  const [iconPath, setIconPath] = useState<string>('');

  const handleUploadComplete = (url: string, path: string) => {
    console.log('Upload complete:', { url, path });

    // Update form data with the new icon URL
    setFormData((prev) => ({
      ...prev,
      icon_url: url,
    }));

    // Store the path for potential deletion
    setIconPath(path);
  };

  const handleDeleteIcon = () => {
    console.log('Icon deleted');

    // Clear icon from form data
    setFormData((prev) => ({
      ...prev,
      icon_url: undefined,
    }));

    setIconPath('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Here you would submit formData to your API
    console.log('Submitting badge:', formData);

    // Example API call:
    // const { data, error } = await supabase
    //   .from('badges')
    //   .insert([formData])
    //   .select()
    //   .single();

    alert('Badge opprettet! (Se konsollen for data)');
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Opprett nytt badge
        </Typography>

        <form onSubmit={handleSubmit}>
          {/* Badge Icon Upload Section */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Badge-ikon
            </Typography>
            <BadgeIconUploader
              currentIconUrl={formData.icon_url || null}
              badgeCode={formData.code || undefined}
              onUploadComplete={handleUploadComplete}
              onDelete={handleDeleteIcon}
              disabled={false}
            />
          </Box>

          {/* Basic Information */}
          <TextField
            fullWidth
            label="Badge-kode"
            value={formData.code}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, code: e.target.value }))
            }
            placeholder="f.eks. first_drink"
            helperText="Unik identifikator for badge (brukes i filnavn)"
            required
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Tittel"
            value={formData.title}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, title: e.target.value }))
            }
            placeholder="f.eks. Første drink"
            required
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            multiline
            rows={3}
            label="Beskrivelse"
            value={formData.description}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, description: e.target.value }))
            }
            placeholder="Beskriv hvordan badge oppnås"
            required
            sx={{ mb: 2 }}
          />

          {/* Category and Tier */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Kategori</InputLabel>
              <Select<BadgeCategory>
                value={formData.category}
                label="Kategori"
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    category: e.target.value as BadgeCategory,
                  }))
                }
              >
                <MenuItem value="session">Økt</MenuItem>
                <MenuItem value="global">Global</MenuItem>
                <MenuItem value="social">Sosial</MenuItem>
                <MenuItem value="milestone">Milepæl</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Tier</InputLabel>
              <Select<BadgeTier>
                value={formData.tier}
                label="Tier"
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    tier: e.target.value as BadgeTier,
                  }))
                }
              >
                <MenuItem value="bronze">Bronze</MenuItem>
                <MenuItem value="silver">Sølv</MenuItem>
                <MenuItem value="gold">Gull</MenuItem>
                <MenuItem value="platinum">Platina</MenuItem>
                <MenuItem value="legendary">Legendær</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Points */}
          <TextField
            fullWidth
            type="number"
            label="Poeng"
            value={formData.points}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                points: parseInt(e.target.value) || 0,
              }))
            }
            inputProps={{ min: 0 }}
            sx={{ mb: 3 }}
          />

          {/* Submit Button */}
          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={!formData.code || !formData.title || !formData.description}
          >
            Opprett badge
          </Button>
        </form>

        {/* Debug Output */}
        <Box sx={{ mt: 3, p: 2, bgcolor: '#f3f4f6', borderRadius: 1 }}>
          <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
            Form Data:
          </Typography>
          <Typography variant="caption" component="pre" sx={{ fontSize: '0.75rem' }}>
            {JSON.stringify({ ...formData, iconStoragePath: iconPath }, null, 2)}
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}

/**
 * Example: Simple Usage in Badge Edit Form
 */
export function SimpleBadgeIconUploadExample() {
  const [iconUrl, setIconUrl] = useState<string>('');

  return (
    <Box sx={{ maxWidth: 400, p: 3 }}>
      <BadgeIconUploader
        currentIconUrl={iconUrl || null}
        badgeCode="example_badge"
        onUploadComplete={(url, path) => {
          console.log('Uploaded:', { url, path });
          setIconUrl(url);
        }}
        onDelete={() => {
          console.log('Deleted icon');
          setIconUrl('');
        }}
      />

      {iconUrl && (
        <Box sx={{ mt: 2, p: 2, bgcolor: '#f0f9ff', borderRadius: 1 }}>
          <Typography variant="caption" sx={{ wordBreak: 'break-all' }}>
            <strong>URL:</strong> {iconUrl}
          </Typography>
        </Box>
      )}
    </Box>
  );
}
