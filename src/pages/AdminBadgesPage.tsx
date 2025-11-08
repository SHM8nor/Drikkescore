import { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Container,
  Snackbar,
  Alert,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  EmojiEvents as TrophyIcon,
} from '@mui/icons-material';
import { useQueryClient } from '@tanstack/react-query';
import AdminBadgeGrid from '../components/badges/AdminBadgeGrid';
import BadgeCreateDialog from '../components/badges/BadgeCreateDialog';
import BadgeEditDialog from '../components/badges/BadgeEditDialog';
import BadgeDeleteDialog from '../components/badges/BadgeDeleteDialog';
import { useBadges } from '../hooks/useBadges';
import { queryKeys } from '../lib/queryKeys';
import { supabase } from '../lib/supabase';
import type { Badge } from '../types/badges';

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * AdminBadgesPage Component
 *
 * Main admin page for managing badges.
 * Features:
 * - Stats cards showing badge overview
 * - Toolbar with create, search, filter, refresh, and bulk delete
 * - DataGrid for badge management
 * - Create, edit, and delete dialogs
 */
export default function AdminBadgesPage() {
  // ============================================================================
  // STATE & HOOKS
  // ============================================================================

  const queryClient = useQueryClient();
  const { data: badges, refetch } = useBadges();

  // Selection and filters
  const [selectedBadges, setSelectedBadges] = useState<Badge[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Dialog states
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);

  // Snackbar state
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info',
  });

  // Stats
  const [totalAwarded, setTotalAwarded] = useState(0);
  const [mostEarnedBadge, setMostEarnedBadge] = useState<{
    badge: Badge | null;
    count: number;
  }>({ badge: null, count: 0 });

  // ============================================================================
  // FETCH STATS
  // ============================================================================

  useEffect(() => {
    const fetchStats = async () => {
      if (!badges || badges.length === 0) return;

      try {
        // Fetch all user_badges
        const { data, error } = await supabase.from('user_badges').select('badge_id');

        if (error) throw error;

        // Count total awarded
        setTotalAwarded(data?.length || 0);

        // Count per badge
        const badgeCounts: Record<string, number> = {};
        data?.forEach((userBadge) => {
          badgeCounts[userBadge.badge_id] = (badgeCounts[userBadge.badge_id] || 0) + 1;
        });

        // Find most earned
        let maxCount = 0;
        let maxBadgeId: string | null = null;

        Object.entries(badgeCounts).forEach(([badgeId, count]) => {
          if (count > maxCount) {
            maxCount = count;
            maxBadgeId = badgeId;
          }
        });

        if (maxBadgeId) {
          const badge = badges.find((b) => b.id === maxBadgeId);
          setMostEarnedBadge({ badge: badge || null, count: maxCount });
        }
      } catch (err) {
        console.error('Error fetching stats:', err);
      }
    };

    fetchStats();
  }, [badges]);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const totalBadges = badges?.length || 0;
  const activeBadges = useMemo(() => {
    return badges?.filter((b) => b.is_active).length || 0;
  }, [badges]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSelectionChange = (selected: Badge[]) => {
    setSelectedBadges(selected);
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleStatusFilter = (event: any) => {
    setStatusFilter(event.target.value as 'all' | 'active' | 'inactive');
  };

  const handleRefresh = () => {
    refetch();
    setSnackbar({
      open: true,
      message: 'Merker oppdatert',
      severity: 'info',
    });
  };

  const handleBadgeClick = (badge: Badge) => {
    setSelectedBadge(badge);
    setEditOpen(true);
  };

  const handleEditClick = (badge: Badge) => {
    setSelectedBadge(badge);
    setEditOpen(true);
  };

  const handleDeleteClick = (badge: Badge) => {
    setSelectedBadges([badge]);
    setDeleteOpen(true);
  };

  const handleBulkDelete = () => {
    if (selectedBadges.length === 0) return;
    setDeleteOpen(true);
  };

  const handleCreateSuccess = () => {
    setSnackbar({
      open: true,
      message: 'Merke opprettet',
      severity: 'success',
    });
    queryClient.invalidateQueries({ queryKey: queryKeys.badges.all });
  };

  const handleEditSuccess = () => {
    setSnackbar({
      open: true,
      message: 'Merke oppdatert',
      severity: 'success',
    });
    setSelectedBadge(null);
    queryClient.invalidateQueries({ queryKey: queryKeys.badges.all });
  };

  const handleDeleteSuccess = () => {
    setSnackbar({
      open: true,
      message: `${selectedBadges.length} merke(r) slettet`,
      severity: 'success',
    });
    setSelectedBadges([]);
    queryClient.invalidateQueries({ queryKey: queryKeys.badges.all });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Merkeadministrasjon
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Administrer alle merker i systemet. Du kan opprette nye merker, redigere eksisterende, og
          utføre masseoperasjoner på valgte merker.
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <TrophyIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                <Box>
                  <Typography variant="h4" component="div">
                    {totalBadges}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Totalt merker
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <TrophyIcon sx={{ fontSize: 40, color: 'success.main' }} />
                <Box>
                  <Typography variant="h4" component="div">
                    {activeBadges}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Aktive merker
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <TrophyIcon sx={{ fontSize: 40, color: 'warning.main' }} />
                <Box>
                  <Typography variant="h4" component="div">
                    {totalAwarded}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Totalt tildelt
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <TrophyIcon sx={{ fontSize: 40, color: 'info.main' }} />
                <Box>
                  <Typography variant="h6" component="div" noWrap>
                    {mostEarnedBadge.badge?.title || 'Ingen'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Mest opptjent ({mostEarnedBadge.count}x)
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content */}
      <Paper
        elevation={2}
        sx={{
          p: 3,
          backgroundColor: 'background.paper',
          borderRadius: 2,
        }}
      >
        {/* Toolbar */}
        <Box
          sx={{
            mb: 3,
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            gap: 2,
            alignItems: { xs: 'stretch', md: 'center' },
          }}
        >
          {/* Create Button */}
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateOpen(true)}
            sx={{ flexShrink: 0 }}
          >
            Opprett nytt merke
          </Button>

          {/* Search */}
          <TextField
            placeholder="Søk etter merker..."
            value={searchQuery}
            onChange={handleSearch}
            size="small"
            sx={{ flex: 1, minWidth: 200 }}
          />

          {/* Status Filter */}
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select value={statusFilter} onChange={handleStatusFilter} label="Status">
              <MenuItem value="all">Alle</MenuItem>
              <MenuItem value="active">Aktive</MenuItem>
              <MenuItem value="inactive">Inaktive</MenuItem>
            </Select>
          </FormControl>

          {/* Refresh */}
          <Tooltip title="Oppdater">
            <IconButton onClick={handleRefresh} color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>

          {/* Delete Selected */}
          <Tooltip title={selectedBadges.length === 0 ? 'Velg merker for å slette' : 'Slett valgte'}>
            <span>
              <IconButton
                onClick={handleBulkDelete}
                color="error"
                disabled={selectedBadges.length === 0}
              >
                <DeleteIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Box>

        {/* Data Grid */}
        <AdminBadgeGrid
          onSelectionChange={handleSelectionChange}
          searchQuery={searchQuery}
          statusFilter={statusFilter}
          onBadgeClick={handleBadgeClick}
          onEditClick={handleEditClick}
          onDeleteClick={handleDeleteClick}
        />
      </Paper>

      {/* Create Dialog */}
      <BadgeCreateDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      {/* Edit Dialog */}
      <BadgeEditDialog
        open={editOpen}
        badge={selectedBadge}
        onClose={() => {
          setEditOpen(false);
          setSelectedBadge(null);
        }}
        onSuccess={handleEditSuccess}
      />

      {/* Delete Dialog */}
      <BadgeDeleteDialog
        open={deleteOpen}
        badges={selectedBadges}
        onClose={() => setDeleteOpen(false)}
        onSuccess={handleDeleteSuccess}
      />

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
