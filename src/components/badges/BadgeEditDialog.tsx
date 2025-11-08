import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useUpdateBadge } from '../../hooks/useBadges';
import BadgeIconUploader from './BadgeIconUploader';
import BadgeCriteriaEditor from './BadgeCriteriaEditor';
import type { Badge, BadgeCategory, BadgeTier, BadgeCriteria } from '../../types/badges';

// ============================================================================
// TYPES
// ============================================================================

interface BadgeEditDialogProps {
  open: boolean;
  badge: Badge | null;
  onClose: () => void;
  onSuccess?: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * BadgeEditDialog Component
 *
 * Dialog for editing an existing badge with pre-populated fields.
 */
export default function BadgeEditDialog({
  open,
  badge,
  onClose,
  onSuccess,
}: BadgeEditDialogProps) {
  // ============================================================================
  // STATE
  // ============================================================================

  const updateBadgeMutation = useUpdateBadge();

  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<BadgeCategory>('session');
  const [tier, setTier] = useState<BadgeTier>('bronze');
  const [tierOrder, setTierOrder] = useState<number>(1);
  const [points, setPoints] = useState<number>(10);
  const [iconUrl, setIconUrl] = useState<string | null>(null);
  const [criteria, setCriteria] = useState<BadgeCriteria>({
    type: 'threshold',
    conditions: [],
    requireAll: true,
  });
  const [isActive, setIsActive] = useState(true);
  const [isAutomatic, setIsAutomatic] = useState(true);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Pre-populate form when dialog opens or badge changes
  useEffect(() => {
    if (open && badge) {
      setTitle(badge.title);
      setDescription(badge.description);
      setCategory(badge.category);
      setTier(badge.tier);
      setTierOrder(badge.tier_order);
      setPoints(badge.points);
      setIconUrl(badge.icon_url);
      setCriteria(badge.criteria);
      setIsActive(badge.is_active);
      setIsAutomatic(badge.is_automatic);
      setErrors({});
    }
  }, [open, badge]);

  // ============================================================================
  // VALIDATION
  // ============================================================================

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Title validation
    if (!title.trim()) {
      newErrors.title = 'Tittel er påkrevd';
    }

    // Description validation
    if (!description.trim()) {
      newErrors.description = 'Beskrivelse er påkrevd';
    }

    // Points validation
    if (points < 0) {
      newErrors.points = 'Poeng må være minst 0';
    }

    // Tier order validation
    if (tierOrder < 1 || tierOrder > 5) {
      newErrors.tierOrder = 'Nivå-rekkefølge må være mellom 1 og 5';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSubmit = async () => {
    if (!badge) return;

    // Validate form
    if (!validateForm()) {
      return;
    }

    try {
      await updateBadgeMutation.mutateAsync({
        badgeId: badge.id,
        data: {
          title,
          description,
          category,
          tier,
          tier_order: tierOrder,
          icon_url: iconUrl,
          criteria,
          is_active: isActive,
          is_automatic: isAutomatic,
          points,
        },
      });

      // Success - close dialog
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Update badge error:', err);
      // Error is handled by mutation
    }
  };

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  const handleIconUpload = (url: string, _path: string) => {
    setIconUrl(url);
  };

  const handleIconDelete = () => {
    setIconUrl(null);
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (!badge) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Rediger merke: {badge.code}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          {/* Error Alert */}
          {updateBadgeMutation.isError && (
            <Alert severity="error">
              {updateBadgeMutation.error?.message || 'Kunne ikke oppdatere merke'}
            </Alert>
          )}

          {/* Code (Read-only) */}
          <TextField
            label="Kode"
            value={badge.code}
            fullWidth
            disabled
            inputProps={{
              style: { fontFamily: 'monospace' },
            }}
            helperText="Kode kan ikke endres etter opprettelse"
          />

          {/* Title */}
          <TextField
            label="Tittel"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (errors.title) setErrors({ ...errors, title: '' });
            }}
            error={Boolean(errors.title)}
            helperText={errors.title}
            required
            fullWidth
          />

          {/* Description */}
          <TextField
            label="Beskrivelse"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              if (errors.description) setErrors({ ...errors, description: '' });
            }}
            error={Boolean(errors.description)}
            helperText={errors.description}
            required
            fullWidth
            multiline
            rows={3}
          />

          {/* Category */}
          <FormControl fullWidth>
            <InputLabel>Kategori</InputLabel>
            <Select
              value={category}
              onChange={(e) => setCategory(e.target.value as BadgeCategory)}
              label="Kategori"
            >
              <MenuItem value="session">Sesjon</MenuItem>
              <MenuItem value="global">Global</MenuItem>
              <MenuItem value="social">Sosial</MenuItem>
              <MenuItem value="milestone">Milepæl</MenuItem>
            </Select>
          </FormControl>

          {/* Tier */}
          <FormControl fullWidth>
            <InputLabel>Nivå</InputLabel>
            <Select value={tier} onChange={(e) => setTier(e.target.value as BadgeTier)} label="Nivå">
              <MenuItem value="bronze">Bronse</MenuItem>
              <MenuItem value="silver">Sølv</MenuItem>
              <MenuItem value="gold">Gull</MenuItem>
              <MenuItem value="platinum">Platina</MenuItem>
              <MenuItem value="legendary">Legendarisk</MenuItem>
            </Select>
          </FormControl>

          {/* Tier Order */}
          <TextField
            label="Nivå-rekkefølge"
            type="number"
            value={tierOrder}
            onChange={(e) => {
              setTierOrder(parseInt(e.target.value, 10));
              if (errors.tierOrder) setErrors({ ...errors, tierOrder: '' });
            }}
            error={Boolean(errors.tierOrder)}
            helperText={errors.tierOrder || '1 (enklest) til 5 (vanskeligst)'}
            required
            fullWidth
            inputProps={{ min: 1, max: 5 }}
          />

          {/* Points */}
          <TextField
            label="Poeng"
            type="number"
            value={points}
            onChange={(e) => {
              setPoints(parseInt(e.target.value, 10));
              if (errors.points) setErrors({ ...errors, points: '' });
            }}
            error={Boolean(errors.points)}
            helperText={errors.points}
            required
            fullWidth
            inputProps={{ min: 0 }}
          />

          {/* Icon Upload */}
          <Box>
            <BadgeIconUploader
              currentIconUrl={iconUrl}
              badgeCode={badge.code}
              onUploadComplete={handleIconUpload}
              onDelete={handleIconDelete}
            />
          </Box>

          {/* Criteria Editor */}
          <BadgeCriteriaEditor
            value={criteria}
            onChange={setCriteria}
            error={errors.criteria}
          />

          {/* Is Active */}
          <FormControlLabel
            control={<Switch checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />}
            label="Aktivt (kan tjenes)"
          />

          {/* Is Automatic */}
          <FormControlLabel
            control={
              <Switch checked={isAutomatic} onChange={(e) => setIsAutomatic(e.target.checked)} />
            }
            label="Automatisk (tildeles av systemet)"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={updateBadgeMutation.isPending}>
          Avbryt
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={updateBadgeMutation.isPending}
          startIcon={updateBadgeMutation.isPending ? <CircularProgress size={20} /> : null}
        >
          Lagre endringer
        </Button>
      </DialogActions>
    </Dialog>
  );
}
