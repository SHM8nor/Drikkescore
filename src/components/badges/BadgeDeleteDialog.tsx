import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Alert,
  Box,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';
import { useDeleteBadge } from '../../hooks/useBadges';
import { supabase } from '../../lib/supabase';
import type { Badge } from '../../types/badges';

// ============================================================================
// TYPES
// ============================================================================

interface BadgeDeleteDialogProps {
  open: boolean;
  badges: Badge[];
  onClose: () => void;
  onSuccess?: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * BadgeDeleteDialog Component
 *
 * Confirmation dialog for deleting badges with warning about affected users.
 */
export default function BadgeDeleteDialog({
  open,
  badges,
  onClose,
  onSuccess,
}: BadgeDeleteDialogProps) {
  // ============================================================================
  // STATE
  // ============================================================================

  const deleteBadgeMutation = useDeleteBadge();
  const [affectedCounts, setAffectedCounts] = useState<Record<string, number>>({});
  const [isLoadingCounts, setIsLoadingCounts] = useState(false);

  // ============================================================================
  // FETCH AFFECTED USER COUNTS
  // ============================================================================

  const fetchAffectedCounts = useCallback(async () => {
    if (!open || badges.length === 0) return;

    setIsLoadingCounts(true);
    try {
      const badgeIds = badges.map((b) => b.id);

      const { data, error } = await supabase
        .from('user_badges')
        .select('badge_id')
        .in('badge_id', badgeIds);

      if (error) throw error;

      // Count per badge
      const counts: Record<string, number> = {};
      data?.forEach((userBadge) => {
        counts[userBadge.badge_id] = (counts[userBadge.badge_id] || 0) + 1;
      });

      setAffectedCounts(counts);
    } catch (err) {
      console.error('Error fetching affected counts:', err);
    } finally {
      setIsLoadingCounts(false);
    }
  }, [open, badges]);

  useEffect(() => {
    fetchAffectedCounts();
  }, [fetchAffectedCounts]);

  // ============================================================================
  // CALCULATIONS
  // ============================================================================

  const totalAffectedUsers = Object.values(affectedCounts).reduce((sum, count) => sum + count, 0);
  const hasAffectedUsers = totalAffectedUsers > 0;

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleDelete = async () => {
    try {
      // Delete all badges sequentially
      for (const badge of badges) {
        await deleteBadgeMutation.mutateAsync(badge.id);
      }

      // Success
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Delete badge error:', err);
      // Error is handled by mutation
    }
  };

  const handleClose = () => {
    setAffectedCounts({});
    onClose();
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  const isSingleBadge = badges.length === 1;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon color="error" />
          {isSingleBadge ? 'Slett merke?' : `Slett ${badges.length} merker?`}
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Error Alert */}
          {deleteBadgeMutation.isError && (
            <Alert severity="error">
              {deleteBadgeMutation.error?.message || 'Kunne ikke slette merke'}
            </Alert>
          )}

          {/* Warning Message */}
          <Typography variant="body1">
            {isSingleBadge
              ? 'Er du sikker på at du vil slette dette merket?'
              : 'Er du sikker på at du vil slette disse merkene?'}
          </Typography>

          {/* Badge List */}
          <List dense sx={{ bgcolor: 'background.paper', borderRadius: 1 }}>
            {badges.map((badge) => {
              const count = affectedCounts[badge.id] || 0;
              return (
                <ListItem key={badge.id}>
                  <ListItemText
                    primary={badge.title}
                    secondary={
                      <>
                        <Typography component="span" variant="caption" display="block">
                          Kode: {badge.code}
                        </Typography>
                        {isLoadingCounts ? (
                          <Typography component="span" variant="caption" color="text.secondary">
                            Laster...
                          </Typography>
                        ) : count > 0 ? (
                          <Typography component="span" variant="caption" color="error">
                            Tildelt til {count} bruker{count !== 1 ? 'e' : ''}
                          </Typography>
                        ) : (
                          <Typography component="span" variant="caption" color="success.main">
                            Ikke tildelt noen brukere
                          </Typography>
                        )}
                      </>
                    }
                  />
                </ListItem>
              );
            })}
          </List>

          {/* Affected Users Warning */}
          {hasAffectedUsers && !isLoadingCounts && (
            <Alert severity="warning" icon={<WarningIcon />}>
              <Typography variant="body2" gutterBottom>
                <strong>Advarsel:</strong> Sletting av {isSingleBadge ? 'dette merket' : 'disse merkene'} vil
                påvirke <strong>{totalAffectedUsers}</strong> bruker{totalAffectedUsers !== 1 ? 'e' : ''}.
              </Typography>
              <Typography variant="body2">
                Alle merkene som er tildelt disse brukerne vil bli permanent fjernet.
              </Typography>
            </Alert>
          )}

          {/* Confirmation Text */}
          <Typography variant="body2" color="text.secondary">
            Denne handlingen kan ikke angres.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={deleteBadgeMutation.isPending}>
          Avbryt
        </Button>
        <Button
          onClick={handleDelete}
          color="error"
          variant="contained"
          disabled={deleteBadgeMutation.isPending || isLoadingCounts}
          startIcon={deleteBadgeMutation.isPending ? <CircularProgress size={20} /> : null}
        >
          {deleteBadgeMutation.isPending ? 'Sletter...' : 'Slett'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
