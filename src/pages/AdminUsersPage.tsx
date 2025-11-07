import { useState } from 'react';
import { Box, Paper, Typography, Container, Snackbar, Alert } from '@mui/material';
import AdminUsersGrid from '../components/admin/AdminUsersGrid';
import UserActionsToolbar from '../components/admin/UserActionsToolbar';
import UserRoleDialog from '../components/admin/UserRoleDialog';
import { useAdminUsers, type AdminUser } from '../hooks/useAdminUsers';
import { useAuth } from '../context/AuthContext';

/**
 * Admin page for managing all users
 * Features:
 * - View all users in a data grid
 * - Search and filter users by name/email/role
 * - Change user roles (admin/user)
 * - View user statistics (sessions, drinks, friends)
 * - Real-time updates via Supabase subscription
 */
export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const { refetch } = useAdminUsers();
  const [selectedUsers, setSelectedUsers] = useState<AdminUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all');
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [selectedUserForRole, setSelectedUserForRole] = useState<AdminUser | null>(null);

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

  const handleSelectionChange = (selected: AdminUser[]) => {
    setSelectedUsers(selected);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleRoleFilter = (role: 'all' | 'admin' | 'user') => {
    setRoleFilter(role);
  };

  // Bulk role change handler - opens dialog for first selected user
  const handleBulkRoleChange = () => {
    if (selectedUsers.length === 0) return;

    // For now, only handle single user selection
    if (selectedUsers.length === 1) {
      setSelectedUserForRole(selectedUsers[0]);
      setRoleDialogOpen(true);
    } else {
      setSnackbar({
        open: true,
        message: 'Velg kun én bruker for å endre rolle',
        severity: 'info',
      });
    }
  };

  // Handle row click - open role dialog
  const handleRowClick = (user: AdminUser) => {
    setSelectedUserForRole(user);
    setRoleDialogOpen(true);
  };

  // Role dialog success handler
  const handleRoleChangeSuccess = (message: string) => {
    setSnackbar({
      open: true,
      message,
      severity: 'success',
    });
    setSelectedUsers([]);
    setSelectedUserForRole(null);
  };

  // Role dialog error handler
  const handleRoleChangeError = (message: string) => {
    setSnackbar({
      open: true,
      message,
      severity: 'error',
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleCloseRoleDialog = () => {
    setRoleDialogOpen(false);
    // Delay clearing selected user to avoid flash
    setTimeout(() => setSelectedUserForRole(null), 200);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Brukeradministrasjon
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Administrer alle brukere i systemet. Du kan endre brukerroller ved å klikke på en
          rad i tabellen, søke etter brukere, og filtrere etter rolle.
        </Typography>
      </Box>

      <Paper
        elevation={2}
        sx={{
          p: 3,
          backgroundColor: 'background.paper',
          borderRadius: 2,
        }}
      >
        {/* Actions Toolbar */}
        <UserActionsToolbar
          selectedUsers={selectedUsers}
          onBulkRoleChange={handleBulkRoleChange}
          onSearch={handleSearch}
          onRoleFilter={handleRoleFilter}
          onRefresh={refetch}
        />

        {/* Data Grid */}
        <AdminUsersGrid
          onSelectionChange={handleSelectionChange}
          searchQuery={searchQuery}
          roleFilter={roleFilter}
          onRowClick={handleRowClick}
        />
      </Paper>

      {/* Role Change Dialog */}
      <UserRoleDialog
        open={roleDialogOpen}
        user={selectedUserForRole}
        currentUserId={currentUser?.id || null}
        onClose={handleCloseRoleDialog}
        onSuccess={handleRoleChangeSuccess}
        onError={handleRoleChangeError}
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
