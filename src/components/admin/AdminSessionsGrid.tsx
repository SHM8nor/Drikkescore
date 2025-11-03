import { useState, useMemo } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import type {
  GridColDef,
  GridRowSelectionModel,
  GridRowModel,
} from '@mui/x-data-grid';
import { Box, Alert, CircularProgress, Typography } from '@mui/material';
import { useAdminSessions, type AdminSession } from '../../hooks/useAdminSessions';
import { supabase } from '../../lib/supabase';

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
        headerName: 'Sesjonstode',
        width: 130,
        editable: false,
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
        processRowUpdate={processRowUpdate}
        onProcessRowUpdateError={handleProcessRowUpdateError}
        autoHeight
        sx={{
          '& .MuiDataGrid-row:hover': {
            backgroundColor: 'rgba(15, 52, 96, 0.04)',
          },
          '& .MuiDataGrid-cell:focus': {
            outline: 'none',
          },
          '& .MuiDataGrid-cell:focus-within': {
            outline: '2px solid #0f3460',
          },
        }}
      />
    </Box>
  );
}
