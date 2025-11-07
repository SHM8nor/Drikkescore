import { useState, useMemo } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import type {
  GridColDef,
  GridRowSelectionModel,
} from '@mui/x-data-grid';
import { Box, Alert, CircularProgress, Typography, Avatar, Chip } from '@mui/material';
import { useAdminUsers, type AdminUser } from '../../hooks/useAdminUsers';

interface AdminUsersGridProps {
  onSelectionChange?: (selectedRows: AdminUser[]) => void;
  searchQuery?: string;
  roleFilter?: 'all' | 'admin' | 'user';
  onRowClick?: (user: AdminUser) => void;
}

/**
 * DataGrid component for displaying and managing users (admin-only)
 * Features:
 * - Real-time updates via Supabase subscription
 * - Row selection for bulk operations
 * - Search and filter functionality
 * - User statistics display
 */
export default function AdminUsersGrid({
  onSelectionChange,
  searchQuery = '',
  roleFilter = 'all',
  onRowClick,
}: AdminUsersGridProps) {
  const { users, loading, error } = useAdminUsers();
  const [selectionModel, setSelectionModel] = useState<GridRowSelectionModel>({
    type: 'include',
    ids: new Set(),
  });

  // Format date for display
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Aldri';
    return new Intl.DateTimeFormat('nb-NO', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(dateString));
  };

  // Filter users based on search query and role filter
  const filteredUsers = useMemo(() => {
    let result = users;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (user) =>
          user.full_name.toLowerCase().includes(query) ||
          user.id.toLowerCase().includes(query)
      );
    }

    // Apply role filter
    if (roleFilter !== 'all') {
      result = result.filter((user) => user.role === roleFilter);
    }

    return result;
  }, [users, searchQuery, roleFilter]);

  // Define columns
  const columns: GridColDef[] = useMemo(
    () => [
      {
        field: 'avatar',
        headerName: '',
        width: 60,
        sortable: false,
        filterable: false,
        renderCell: (params) => (
          <Avatar
            src={params.row.avatar_url || undefined}
            alt={params.row.full_name}
            sx={{ width: 36, height: 36 }}
          >
            {params.row.full_name.charAt(0).toUpperCase()}
          </Avatar>
        ),
      },
      {
        field: 'full_name',
        headerName: 'Navn',
        width: 200,
        editable: false,
      },
      {
        field: 'id',
        headerName: 'E-post (ID)',
        width: 250,
        editable: false,
      },
      {
        field: 'role',
        headerName: 'Rolle',
        width: 120,
        editable: false,
        renderCell: (params) => (
          <Chip
            label={params.value === 'admin' ? 'Admin' : 'Bruker'}
            color={params.value === 'admin' ? 'primary' : 'default'}
            size="small"
          />
        ),
      },
      {
        field: 'session_count',
        headerName: 'Sesjoner',
        width: 120,
        editable: false,
        type: 'number',
        valueGetter: (_value, row: AdminUser) => row.session_count || 0,
      },
      {
        field: 'drink_count',
        headerName: 'Drinker',
        width: 120,
        editable: false,
        type: 'number',
        valueGetter: (_value, row: AdminUser) => row.drink_count || 0,
      },
      {
        field: 'friend_count',
        headerName: 'Venner',
        width: 120,
        editable: false,
        type: 'number',
        valueGetter: (_value, row: AdminUser) => row.friend_count || 0,
      },
      {
        field: 'last_active',
        headerName: 'Sist aktiv',
        width: 180,
        editable: false,
        valueFormatter: (value: string | undefined) => formatDate(value),
      },
    ],
    []
  );

  // Handle selection change
  const handleSelectionChange = (newSelection: GridRowSelectionModel) => {
    setSelectionModel(newSelection);

    // Notify parent component of selected rows
    if (onSelectionChange) {
      const selectedIds = Array.from(newSelection.ids);
      const selectedUsers = filteredUsers.filter((user) =>
        selectedIds.includes(user.id)
      );
      onSelectionChange(selectedUsers);
    }
  };

  // Handle row click
  const handleRowClick = (params: { row: AdminUser }) => {
    if (onRowClick) {
      onRowClick(params.row);
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
        Kunne ikke laste brukere: {error}
      </Alert>
    );
  }

  // Empty state
  if (users.length === 0) {
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
          Ingen brukere funnet
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Det er ingen brukere å vise ennå.
        </Typography>
      </Box>
    );
  }

  // Filtered empty state
  if (filteredUsers.length === 0) {
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
          Ingen brukere funnet
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Prøv å justere søket eller filteret ditt.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* DataGrid */}
      <DataGrid
        rows={filteredUsers}
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
        autoHeight
        sx={{
          '& .MuiDataGrid-cell:focus': {
            outline: 'none',
          },
          '& .MuiDataGrid-row': {
            cursor: onRowClick ? 'pointer' : 'default',
          },
        }}
      />
    </Box>
  );
}
