import { useState, useMemo, useCallback } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import type {
  GridColDef,
  GridRowSelectionModel,
  GridRowModel,
} from '@mui/x-data-grid';
import {
  Box,
  Alert,
  CircularProgress,
  Typography,
  IconButton,
  Tooltip,
  Avatar,
  Chip,
  Switch,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Image as ImageIcon,
} from '@mui/icons-material';
import { useBadges, useUpdateBadge } from '../../hooks/useBadges';
import type { Badge } from '../../types/badges';
import { supabase } from '../../lib/supabase';

// ============================================================================
// TYPES
// ============================================================================

interface AdminBadgeGridProps {
  onSelectionChange?: (selected: Badge[]) => void;
  searchQuery?: string;
  statusFilter?: 'all' | 'active' | 'inactive';
  onBadgeClick?: (badge: Badge) => void;
  onEditClick?: (badge: Badge) => void;
  onDeleteClick?: (badge: Badge) => void;
}

// Tier color mapping
const TIER_COLORS = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700',
  platinum: '#E5E4E2',
  legendary: '#9C27B0',
} as const;

// Tier labels in Norwegian
const TIER_LABELS = {
  bronze: 'Bronse',
  silver: 'Sølv',
  gold: 'Gull',
  platinum: 'Platina',
  legendary: 'Legendarisk',
} as const;

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * DataGrid component for displaying and managing badges (admin-only)
 * Features:
 * - Real-time updates via Supabase subscription
 * - Inline editing for code and title
 * - Row selection for bulk operations
 * - Badge count per badge (query user_badges)
 * - Status toggle
 * - Search and filter functionality
 */
export default function AdminBadgeGrid({
  onSelectionChange,
  searchQuery = '',
  statusFilter = 'all',
  onBadgeClick,
  onEditClick,
  onDeleteClick,
}: AdminBadgeGridProps) {
  // ============================================================================
  // STATE & HOOKS
  // ============================================================================

  const { data: badges, isLoading: loading, error } = useBadges();
  const updateBadgeMutation = useUpdateBadge();
  const [selectionModel, setSelectionModel] = useState<GridRowSelectionModel>({
    type: 'include',
    ids: new Set(),
  });
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [awardedCounts, setAwardedCounts] = useState<Record<string, number>>({});

  // ============================================================================
  // FETCH AWARDED COUNTS
  // ============================================================================

  // Fetch awarded counts for all badges
  const fetchAwardedCounts = useCallback(async () => {
    if (!badges || badges.length === 0) return;

    try {
      const { data, error } = await supabase
        .from('user_badges')
        .select('badge_id');

      if (error) throw error;

      // Count badges
      const counts: Record<string, number> = {};
      data?.forEach((userBadge) => {
        counts[userBadge.badge_id] = (counts[userBadge.badge_id] || 0) + 1;
      });

      setAwardedCounts(counts);
    } catch (err) {
      console.error('Error fetching awarded counts:', err);
    }
  }, [badges]);

  // Fetch on mount and when badges change
  useMemo(() => {
    fetchAwardedCounts();
  }, [fetchAwardedCounts]);

  // ============================================================================
  // FILTER BADGES
  // ============================================================================

  const filteredBadges = useMemo(() => {
    if (!badges) return [];

    let result = badges;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (badge) =>
          badge.code.toLowerCase().includes(query) ||
          badge.title.toLowerCase().includes(query) ||
          badge.description.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter((badge) => {
        return statusFilter === 'active' ? badge.is_active : !badge.is_active;
      });
    }

    return result;
  }, [badges, searchQuery, statusFilter]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  // Handle active status toggle
  const handleActiveToggle = async (badgeId: string, currentValue: boolean, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent row click

    try {
      await updateBadgeMutation.mutateAsync({
        badgeId,
        data: { is_active: !currentValue },
      });
    } catch (err) {
      console.error('Error toggling badge status:', err);
      setUpdateError('Kunne ikke oppdatere merke-status');
    }
  };

  // Handle row update (for inline editing)
  const processRowUpdate = async (newRow: GridRowModel, oldRow: GridRowModel) => {
    setUpdateError(null);

    try {
      // Check if code or title changed
      const updates: any = {};
      if (newRow.code !== oldRow.code) updates.code = newRow.code;
      if (newRow.title !== oldRow.title) updates.title = newRow.title;

      if (Object.keys(updates).length > 0) {
        await updateBadgeMutation.mutateAsync({
          badgeId: newRow.id,
          data: updates,
        });
      }

      return newRow;
    } catch (err) {
      console.error('Error updating badge:', err);
      const errorMessage = err instanceof Error ? err.message : 'Ukjent feil';
      setUpdateError(`Kunne ikke oppdatere merke: ${errorMessage}`);
      // Return old row to revert changes
      return oldRow;
    }
  };

  // Handle row update error
  const handleProcessRowUpdateError = (error: Error) => {
    console.error('Row update error:', error);
    setUpdateError(`Oppdateringsfeil: ${error.message}`);
  };

  // Handle selection change
  const handleSelectionChange = (newSelection: GridRowSelectionModel) => {
    setSelectionModel(newSelection);

    // Notify parent component of selected rows
    if (onSelectionChange) {
      const selectedIds = Array.from(newSelection.ids);
      const selectedBadges = filteredBadges.filter((badge) =>
        selectedIds.includes(badge.id)
      );
      onSelectionChange(selectedBadges);
    }
  };

  // Handle row click
  const handleRowClick = (params: any) => {
    if (onBadgeClick) {
      onBadgeClick(params.row as Badge);
    }
  };

  // ============================================================================
  // DEFINE COLUMNS
  // ============================================================================

  const columns: GridColDef[] = useMemo(
    () => [
      {
        field: 'icon_url',
        headerName: 'Ikon',
        width: 80,
        editable: false,
        sortable: false,
        renderCell: (params) => {
          const tierColor = TIER_COLORS[params.row.tier as keyof typeof TIER_COLORS];
          return (
            <Avatar
              src={params.value || undefined}
              sx={{
                width: 40,
                height: 40,
                bgcolor: tierColor + '30',
                border: `2px solid ${tierColor}`,
              }}
            >
              <ImageIcon sx={{ fontSize: 20, color: tierColor }} />
            </Avatar>
          );
        },
      },
      {
        field: 'code',
        headerName: 'Kode',
        width: 180,
        editable: true,
        renderCell: (params) => (
          <Typography
            variant="body2"
            sx={{
              fontFamily: 'monospace',
              fontWeight: 600,
            }}
          >
            {params.value}
          </Typography>
        ),
      },
      {
        field: 'title',
        headerName: 'Tittel',
        width: 220,
        editable: true,
      },
      {
        field: 'category',
        headerName: 'Kategori',
        width: 140,
        editable: false,
        valueFormatter: (value: string) => {
          const categoryLabels: Record<string, string> = {
            session: 'Sesjon',
            global: 'Global',
            social: 'Sosial',
            milestone: 'Milepæl',
          };
          return categoryLabels[value] || value;
        },
      },
      {
        field: 'tier',
        headerName: 'Nivå',
        width: 140,
        editable: false,
        renderCell: (params) => {
          const tierColor = TIER_COLORS[params.value as keyof typeof TIER_COLORS];
          const tierLabel = TIER_LABELS[params.value as keyof typeof TIER_LABELS];
          return (
            <Chip
              label={tierLabel}
              size="small"
              sx={{
                backgroundColor: tierColor,
                color: params.value === 'platinum' ? '#000' : '#fff',
                fontWeight: 600,
              }}
            />
          );
        },
      },
      {
        field: 'points',
        headerName: 'Poeng',
        width: 100,
        editable: false,
        type: 'number',
      },
      {
        field: 'is_active',
        headerName: 'Aktiv',
        width: 100,
        editable: false,
        renderCell: (params) => (
          <Switch
            checked={params.value}
            onChange={(e) => handleActiveToggle(params.row.id, params.value, e as any)}
            onClick={(e) => e.stopPropagation()}
            size="small"
          />
        ),
      },
      {
        field: 'awarded',
        headerName: 'Tildelt',
        width: 100,
        editable: false,
        type: 'number',
        valueGetter: (_value, row: Badge) => {
          return awardedCounts[row.id] || 0;
        },
      },
      {
        field: 'actions',
        headerName: 'Handlinger',
        width: 120,
        editable: false,
        sortable: false,
        renderCell: (params) => (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title="Rediger merke">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditClick?.(params.row as Badge);
                }}
                sx={{
                  color: 'primary.main',
                  '&:hover': {
                    backgroundColor: 'primary.light',
                  },
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Slett merke">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteClick?.(params.row as Badge);
                }}
                sx={{
                  color: 'error.main',
                  '&:hover': {
                    backgroundColor: 'error.light',
                  },
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        ),
      },
    ],
    [awardedCounts, onEditClick, onDeleteClick]
  );

  // ============================================================================
  // RENDER STATES
  // ============================================================================

  // Loading state
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 400,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Kunne ikke laste merker: {error.message || 'Ukjent feil'}
      </Alert>
    );
  }

  // Empty state
  if (!badges || badges.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 400,
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <Typography variant="h6" color="text.secondary">
          Ingen merker funnet
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Det er ingen merker å vise ennå.
        </Typography>
      </Box>
    );
  }

  // Filtered empty state
  if (filteredBadges.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 400,
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <Typography variant="h6" color="text.secondary">
          Ingen merker funnet
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Prøv å justere søket eller filteret ditt.
        </Typography>
      </Box>
    );
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <Box>
      {/* Show update error if any */}
      {updateError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setUpdateError(null)}>
          {updateError}
        </Alert>
      )}

      {/* DataGrid */}
      <DataGrid
        rows={filteredBadges}
        columns={columns}
        initialState={{
          pagination: {
            paginationModel: { page: 0, pageSize: 25 },
          },
        }}
        pageSizeOptions={[10, 25, 50, 100]}
        checkboxSelection
        disableRowSelectionOnClick
        rowSelectionModel={selectionModel}
        onRowSelectionModelChange={handleSelectionChange}
        onRowClick={handleRowClick}
        processRowUpdate={processRowUpdate}
        onProcessRowUpdateError={handleProcessRowUpdateError}
        autoHeight
        sx={{
          '& .MuiDataGrid-cell:focus': {
            outline: 'none',
          },
          '& .MuiDataGrid-row': {
            cursor: 'pointer',
          },
        }}
      />
    </Box>
  );
}
