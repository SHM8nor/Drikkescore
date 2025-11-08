import { useState } from 'react';
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
import { useCreateBadge } from '../../hooks/useBadges';
import BadgeIconUploader from './BadgeIconUploader';
import BadgeCriteriaEditor from './BadgeCriteriaEditor';
import type { BadgeCategory, BadgeTier, BadgeCriteria } from '../../types/badges';

// ============================================================================
// TYPES
// ============================================================================

interface BadgeCreateDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

// Default criteria template
const DEFAULT_CRITERIA: BadgeCriteria = {
  type: 'threshold',
  conditions: [
    {
      metric: 'total_drinks',
      operator: '>=',
      value: 1,
      timeframe: 'session',
    },
  ],
  requireAll: true,
};

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * BadgeCreateDialog Component
 *
 * Dialog for creating a new badge with full form validation.
 */
export default function BadgeCreateDialog({
  open,
  onClose,
  onSuccess,
}: BadgeCreateDialogProps) {
  // ============================================================================
  // STATE
  // ============================================================================

  const createBadgeMutation = useCreateBadge();

  // Form fields
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<BadgeCategory>('session');
  const [tier, setTier] = useState<BadgeTier>('bronze');
  const [tierOrder, setTierOrder] = useState<number>(1);
  const [points, setPoints] = useState<number>(10);
  const [iconUrl, setIconUrl] = useState<string>('');
  const [criteria, setCriteria] = useState<BadgeCriteria>(DEFAULT_CRITERIA);
  const [isActive, setIsActive] = useState(true);
  const [isAutomatic, setIsAutomatic] = useState(true);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ============================================================================
  // VALIDATION
  // ============================================================================

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Code validation
    if (!code.trim()) {
      newErrors.code = 'Kode er påkrevd';
    } else if (!/^[A-Z_]+$/.test(code)) {
      newErrors.code = 'Koden må være store bokstaver og understrek (_)';
    }

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
    // Validate form
    if (!validateForm()) {
      return;
    }

    try {
      await createBadgeMutation.mutateAsync({
        code: code.toUpperCase(),
        title,
        description,
        category,
        tier,
        tier_order: tierOrder,
        icon_url: iconUrl || undefined,
        criteria,
        is_active: isActive,
        is_automatic: isAutomatic,
        points,
      });

      // Success - reset form and close
      handleReset();
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Create badge error:', err);
      // Error is handled by mutation
    }
  };

  const handleReset = () => {
    setCode('');
    setTitle('');
    setDescription('');
    setCategory('session');
    setTier('bronze');
    setTierOrder(1);
    setPoints(10);
    setIconUrl('');
    setCriteria(DEFAULT_CRITERIA);
    setIsActive(true);
    setIsAutomatic(true);
    setErrors({});
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleIconUpload = (url: string) => {
    setIconUrl(url);
  };

  const handleCodeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // Auto-uppercase and validate
    const value = event.target.value.toUpperCase().replace(/[^A-Z_]/g, '');
    setCode(value);
    if (errors.code) {
      setErrors({ ...errors, code: '' });
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Opprett nytt merke</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          {/* Error Alert */}
          {createBadgeMutation.isError && (
            <Alert severity="error">
              {createBadgeMutation.error?.message || 'Kunne ikke opprette merke'}
            </Alert>
          )}

          {/* Code */}
          <TextField
            label="Kode"
            value={code}
            onChange={handleCodeChange}
            error={Boolean(errors.code)}
            helperText={errors.code || 'Store bokstaver og understrek, f.eks. FIRST_DRINK'}
            required
            fullWidth
            inputProps={{
              style: { fontFamily: 'monospace', textTransform: 'uppercase' },
            }}
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
              currentIconUrl={iconUrl || null}
              badgeCode={code}
              onUploadComplete={handleIconUpload}
              onDelete={() => setIconUrl('')}
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
        <Button onClick={handleClose} disabled={createBadgeMutation.isPending}>
          Avbryt
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={createBadgeMutation.isPending}
          startIcon={createBadgeMutation.isPending ? <CircularProgress size={20} /> : null}
        >
          Opprett
        </Button>
      </DialogActions>
    </Dialog>
  );
}
