import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Typography,
  Chip,
  Avatar,
  CircularProgress,
  Alert,
  Snackbar,
} from '@mui/material';
import { Image as ImageIcon, EmojiEvents as TrophyIcon } from '@mui/icons-material';
import { useBadges, useUserBadges, useAwardBadge } from '../../hooks/useBadges';
import { useAdmin } from '../../hooks/useAdmin';
import type { Badge, BadgeCategory } from '../../types/badges';

// ============================================================================
// TYPES
// ============================================================================

interface BadgeAwardDialogProps {
  open: boolean;
  userId: string; // User who will receive the badge
  onClose: () => void;
  onSuccess?: () => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const TIER_COLORS: Record<string, string> = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700',
  platinum: '#E5E4E2',
  legendary: '#9C27B0',
};

const CATEGORY_LABELS: Record<BadgeCategory, string> = {
  session: 'Sesjon',
  global: 'Global',
  social: 'Sosial',
  milestone: 'Milepæl',
  special: 'Spesiell',
};

const TIER_LABELS: Record<string, string> = {
  bronze: 'Bronse',
  silver: 'Sølv',
  gold: 'Gull',
  platinum: 'Platina',
  legendary: 'Legendarisk',
};

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * BadgeAwardDialog Component
 *
 * Dialog for admins to manually award badges to users.
 * Shows available badges filtered by what the user hasn't already earned.
 */
export default function BadgeAwardDialog({
  open,
  userId,
  onClose,
  onSuccess,
}: BadgeAwardDialogProps) {
  // ============================================================================
  // STATE & HOOKS
  // ============================================================================

  const { isAdmin } = useAdmin();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<BadgeCategory | 'all'>('all');
  const [selectedBadgeId, setSelectedBadgeId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const { data: allBadges, isLoading: badgesLoading, error: badgesError } = useBadges(open);
  const { data: userBadges, isLoading: userBadgesLoading } = useUserBadges(userId, open);
  const awardBadgeMutation = useAwardBadge();

  // ============================================================================
  // COMPUTED DATA
  // ============================================================================

  // Filter out badges the user already has
  const availableBadges = useMemo(() => {
    if (!allBadges || !userBadges) return [];

    const earnedBadgeIds = new Set(userBadges.map((ub) => ub.badge_id));
    return allBadges.filter((badge) => !earnedBadgeIds.has(badge.id));
  }, [allBadges, userBadges]);

  // Apply search and category filters
  const filteredBadges = useMemo(() => {
    let filtered = availableBadges;

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((badge) => badge.category === selectedCategory);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (badge) =>
          badge.title.toLowerCase().includes(query) ||
          badge.description.toLowerCase().includes(query) ||
          badge.code.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [availableBadges, selectedCategory, searchQuery]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleBadgeSelect = (badgeId: string) => {
    setSelectedBadgeId(badgeId);
  };

  const handleAwardBadge = async () => {
    if (!selectedBadgeId) return;

    try {
      await awardBadgeMutation.mutateAsync({
        user_id: userId,
        badge_id: selectedBadgeId,
      });

      const awardedBadge = allBadges?.find((b) => b.id === selectedBadgeId);
      setSuccessMessage(
        `Merket "${awardedBadge?.title}" ble tildelt brukeren!`
      );
      setSelectedBadgeId(null);
      onSuccess?.();

      // Close dialog after short delay to show success message
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err: any) {
      console.error('Award badge error:', err);
      const errorMsg = err?.message || 'Kunne ikke tildele merke';

      // Handle specific error cases
      if (errorMsg.includes('already earned')) {
        setErrorMessage('Brukeren har allerede dette merket');
      } else {
        setErrorMessage(errorMsg);
      }
    }
  };

  const handleClose = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedBadgeId(null);
    setSuccessMessage(null);
    setErrorMessage(null);
    onClose();
  };

  const handleSnackbarClose = () => {
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  const isLoading = badgesLoading || userBadgesLoading;

  // Early return if not admin
  if (!isAdmin) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm">
        <DialogTitle>Ingen tilgang</DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mt: 2 }}>
            Du må være administrator for å tildele merker
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Lukk</Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>Tildel merke til bruker</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            {/* Error Alert */}
            {badgesError && (
              <Alert severity="error">
                Kunne ikke laste merker: {badgesError.message}
              </Alert>
            )}

            {/* Loading State */}
            {isLoading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            )}

            {/* Search and Filters */}
            {!isLoading && (
              <>
                {/* Search Field */}
                <TextField
                  label="Søk etter merker"
                  placeholder="Søk etter tittel, beskrivelse eller kode..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  fullWidth
                />

                {/* Category Filter Chips */}
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip
                    label="Alle"
                    onClick={() => setSelectedCategory('all')}
                    color={selectedCategory === 'all' ? 'primary' : 'default'}
                    variant={selectedCategory === 'all' ? 'filled' : 'outlined'}
                  />
                  {(Object.keys(CATEGORY_LABELS) as BadgeCategory[]).map((category) => (
                    <Chip
                      key={category}
                      label={CATEGORY_LABELS[category]}
                      onClick={() => setSelectedCategory(category)}
                      color={selectedCategory === category ? 'primary' : 'default'}
                      variant={selectedCategory === category ? 'filled' : 'outlined'}
                    />
                  ))}
                </Box>

                {/* No Badges Available */}
                {filteredBadges.length === 0 && (
                  <Alert severity="info">
                    {availableBadges.length === 0
                      ? 'Brukeren har tjent alle tilgjengelige merker!'
                      : 'Ingen merker matchet søket'}
                  </Alert>
                )}

                {/* Badge Grid */}
                {filteredBadges.length > 0 && (
                  <Grid container spacing={2} sx={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {filteredBadges.map((badge) => (
                      <Grid item xs={12} sm={6} key={badge.id}>
                        <Card
                          sx={{
                            border:
                              selectedBadgeId === badge.id
                                ? `2px solid ${TIER_COLORS[badge.tier] || '#1976d2'}`
                                : '2px solid transparent',
                            backgroundColor:
                              selectedBadgeId === badge.id
                                ? 'action.selected'
                                : 'background.paper',
                            transition: 'all 0.2s',
                            '&:hover': {
                              boxShadow: 4,
                              transform: 'translateY(-2px)',
                            },
                          }}
                        >
                          <CardActionArea onClick={() => handleBadgeSelect(badge.id)}>
                            <CardContent>
                              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                                {/* Badge Icon */}
                                <Avatar
                                  src={badge.icon_url || undefined}
                                  sx={{
                                    width: 48,
                                    height: 48,
                                    bgcolor: TIER_COLORS[badge.tier] || 'primary.main',
                                  }}
                                >
                                  {badge.icon_url ? (
                                    <ImageIcon />
                                  ) : (
                                    <TrophyIcon />
                                  )}
                                </Avatar>

                                {/* Badge Info */}
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                  <Typography variant="h6" component="div" noWrap>
                                    {badge.title}
                                  </Typography>
                                  <Box sx={{ display: 'flex', gap: 0.5, mb: 1 }}>
                                    <Chip
                                      label={TIER_LABELS[badge.tier]}
                                      size="small"
                                      sx={{
                                        backgroundColor: TIER_COLORS[badge.tier],
                                        color: badge.tier === 'silver' || badge.tier === 'platinum' ? 'black' : 'white',
                                        fontWeight: 'bold',
                                      }}
                                    />
                                    <Chip
                                      label={CATEGORY_LABELS[badge.category]}
                                      size="small"
                                      variant="outlined"
                                    />
                                  </Box>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      display: '-webkit-box',
                                      WebkitLineClamp: 2,
                                      WebkitBoxOrient: 'vertical',
                                    }}
                                  >
                                    {badge.description}
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{ mt: 1, display: 'block' }}
                                  >
                                    {badge.points} poeng
                                  </Typography>
                                </Box>
                              </Box>
                            </CardContent>
                          </CardActionArea>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={awardBadgeMutation.isPending}>
            Avbryt
          </Button>
          <Button
            onClick={handleAwardBadge}
            variant="contained"
            disabled={!selectedBadgeId || awardBadgeMutation.isPending}
            startIcon={
              awardBadgeMutation.isPending ? <CircularProgress size={20} /> : <TrophyIcon />
            }
          >
            Tildel merke
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success/Error Snackbar */}
      <Snackbar
        open={Boolean(successMessage || errorMessage)}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={successMessage ? 'success' : 'error'}
          sx={{ width: '100%' }}
        >
          {successMessage || errorMessage}
        </Alert>
      </Snackbar>
    </>
  );
}
