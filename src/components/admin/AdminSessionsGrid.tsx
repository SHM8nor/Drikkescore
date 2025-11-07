import { useState, useMemo } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import type {
  GridColDef,
  GridRowSelectionModel,
  GridRowModel,
  GridRowParams,
} from '@mui/x-data-grid';
import {
  Box,
  Alert,
  CircularProgress,
  Typography,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import { Person as PersonIcon } from '@mui/icons-material';
import { useAdminSessions, type AdminSession } from '../../hooks/useAdminSessions';
import { supabase } from '../../lib/supabase';
import SessionDetailDialog from './SessionDetailDialog';
import SessionDurationColumn from './SessionDurationColumn';

interface AdminSessionsGridProps {
  onSelectionChange?: (selectedRows: AdminSession[]) => void;
  searchQuery?: string;
  statusFilter?: 'all' | 'active' | 'ended';
}

/**
 * DataGrid component for displaying and managing sessions (admin-only)
 * Features:
 * - Real-time updates via Supabase subscription
 * - Inline editing for session_name
 * - Row selection for bulk operations
 * - Participant count display
 * - Status calculation (active/ended)
 * - Search and filter functionality
 * - Duration column with color coding
 * - View Creator action button
 * - Click row to open Session Detail Dialog
 */
export default function AdminSessionsGrid({
  onSelectionChange,
  searchQuery = '',
  statusFilter = 'all',
}: AdminSessionsGridProps) {
  const { sessions, loading, error } = useAdminSessions();
  const [selectionModel, setSelectionModel] = useState<GridRowSelectionModel>({
    type: 'include',
    ids: new Set(),
  });
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [creatorDialogOpen, setCreatorDialogOpen] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState<{
    name: string;
    userId: string;
  } | null>(null);

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('nb-NO', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(dateString));
  };

  // Calculate session status
  const getSessionStatus = (endTime: string) => {
    const now = new Date();
    const end = new Date(endTime);
    return end > now ? 'Aktiv' : 'Avsluttet';
  };

  // Handle view creator
  const handleViewCreator = (session: AdminSession, event: React.MouseEvent) => {
    // Stop propagation to prevent row click
    event.stopPropagation();
    setSelectedCreator({
      name: session.creator?.full_name || 'Ukjent',
      userId: session.created_by,
    });
    setCreatorDialogOpen(true);
  };

  // Handle row click to open detail dialog
  const handleRowClick = (params: GridRowParams) => {
    setSelectedSessionId(String(params.id));
    setDetailDialogOpen(true);
  };

  // Filter sessions based on search query and status filter
  const filteredSessions = useMemo(() => {
    let result = sessions;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (session) =>
          session.session_name.toLowerCase().includes(query) ||
          session.session_code.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter((session) => {
        const isActive = new Date(session.end_time) > new Date();
        return statusFilter === 'active' ? isActive : !isActive;
      });
    }

    return result;
  }, [sessions, searchQuery, statusFilter]);

  // Define columns
  const columns: GridColDef[] = useMemo(
    () => [
      {
        field: 'session_code',
        headerName: 'Sesjonskode',
        width: 130,
        editable: false,
        renderCell: (params) => (
          <Tooltip
            title={
              <Box>
                <Typography variant="body2">Sesjon: {params.row.session_name}</Typography>
                <Typography variant="caption">Kode: {params.value}</Typography>
                <Typography variant="caption" display="block">
                  ID: {params.row.id}
                </Typography>
              </Box>
            }
          >
            <Typography
              variant="body2"
              sx={{
                fontFamily: 'monospace',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {params.value}
            </Typography>
          </Tooltip>
        ),
      },
      {
        field: 'session_name',
        headerName: 'Sesjonsnavn',
        width: 250,
        editable: true,
      },
      {
        field: 'creator',
        headerName: 'Opprettet av',
        width: 200,
        editable: false,
        valueGetter: (_value, row: AdminSession) => {
          return row.creator?.full_name || 'Ukjent';
        },
      },
      {
        field: 'duration',
        headerName: 'Varighet',
        width: 130,
        editable: false,
        sortable: true,
        renderCell: (params) => (
          <SessionDurationColumn
            startTime={params.row.start_time}
            endTime={params.row.end_time}
          />
        ),
        // Value getter for sorting - returns duration in milliseconds
        valueGetter: (_value, row: AdminSession) => {
          return new Date(row.end_time).getTime() - new Date(row.start_time).getTime();
        },
      },
      {
        field: 'start_time',
        headerName: 'Starttid',
        width: 180,
        editable: false,
        valueFormatter: (value: string) => formatDate(value),
      },
      {
        field: 'end_time',
        headerName: 'Sluttid',
        width: 180,
        editable: false,
        valueFormatter: (value: string) => formatDate(value),
      },
      {
        field: 'participants_count',
        headerName: 'Deltakere',
        width: 120,
        editable: false,
        type: 'number',
      },
      {
        field: 'status',
        headerName: 'Status',
        width: 120,
        editable: false,
        valueGetter: (_value, row: AdminSession) => {
          return getSessionStatus(row.end_time);
        },
      },
      {
        field: 'actions',
        headerName: 'Handlinger',
        width: 120,
        editable: false,
        sortable: false,
        renderCell: (params) => (
          <Tooltip title="Vis opprettet av">
            <IconButton
              size="small"
              onClick={(e) => handleViewCreator(params.row, e)}
              sx={{
                color: 'primary.main',
                '&:hover': {
                  backgroundColor: 'primary.light',
                  color: 'primary.dark',
                },
              }}
            >
              <PersonIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        ),
      },
    ],
    []
  );

  // Handle row update (for inline editing)
  const processRowUpdate = async (newRow: GridRowModel, oldRow: GridRowModel) => {
    setUpdateError(null);

    try {
      // Only update if session_name changed
      if (newRow.session_name !== oldRow.session_name) {
        const { error: updateError } = await supabase
          .from('sessions')
          .update({ session_name: newRow.session_name })
          .eq('id', newRow.id);

        if (updateError) throw updateError;

        console.log('Session updated successfully:', newRow.id);
      }

      return newRow;
    } catch (err) {
      console.error('Error updating session:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setUpdateError(`Kunne ikke oppdatere sesjon: ${errorMessage}`);
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
      // Convert Set to array and filter sessions
      const selectedIds = Array.from(newSelection.ids);
      const selectedSessions = filteredSessions.filter((session) =>
        selectedIds.includes(session.id)
      );
      onSelectionChange(selectedSessions);
    }
  };

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
        Kunne ikke laste sesjoner: {error}
      </Alert>
    );
  }

  // Empty state
  if (sessions.length === 0) {
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
          Ingen sesjoner funnet
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Det er ingen sesjoner å vise ennå.
        </Typography>
      </Box>
    );
  }

  // Filtered empty state
  if (filteredSessions.length === 0) {
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
          Ingen sesjoner funnet
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Prøv å justere søket eller filteret ditt.
        </Typography>
      </Box>
    );
  }

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
        rows={filteredSessions}
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

      {/* Creator Info Dialog */}
      <Dialog
        open={creatorDialogOpen}
        onClose={() => setCreatorDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Sesjon opprettet av</DialogTitle>
        <DialogContent>
          <Box sx={{ py: 2 }}>
            <Typography variant="body1" gutterBottom>
              <strong>Navn:</strong> {selectedCreator?.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Bruker-ID:</strong> {selectedCreator?.userId}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreatorDialogOpen(false)}>Lukk</Button>
        </DialogActions>
      </Dialog>

      {/* Session Detail Dialog */}
      <SessionDetailDialog
        sessionId={selectedSessionId}
        open={detailDialogOpen}
        onClose={() => {
          setDetailDialogOpen(false);
          setSelectedSessionId(null);
        }}
      />
    </Box>
  );
}
