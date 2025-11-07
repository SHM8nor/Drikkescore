import { useState } from 'react';
import { Box, Paper, Typography, Container, Snackbar, Alert } from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';
import AdminSessionsGrid from '../components/admin/AdminSessionsGrid';
import AdminActionsToolbar from '../components/admin/AdminActionsToolbar';
import DeleteConfirmDialog from '../components/admin/DeleteConfirmDialog';
import SessionEditDialog from '../components/admin/SessionEditDialog';
import { useAdminSessions, type AdminSession } from '../hooks/useAdminSessions';
import type { Session } from '../types/database';
import { supabase } from '../lib/supabase';
import { queryKeys } from '../lib/queryKeys';

/**
 * Admin page for managing all sessions
 * Features:
 * - View all sessions in a data grid
 * - Search and filter sessions
 * - Bulk operations (delete, edit)
 * - Export to CSV
 * - Real-time updates via Supabase subscription
 */
export default function AdminPage() {
  const queryClient = useQueryClient();
  const { refetch } = useAdminSessions();
  const [selectedSessions, setSelectedSessions] = useState<AdminSession[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'ended'>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

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

  const handleSelectionChange = (selected: AdminSession[]) => {
    setSelectedSessions(selected);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleStatusFilter = (status: 'all' | 'active' | 'ended') => {
    setStatusFilter(status);
  };

  // Bulk delete handler with optimistic update
  const handleBulkDelete = async () => {
    if (selectedSessions.length === 0) return;

    try {
      const sessionIds = selectedSessions.map((s) => s.id);

      // Optimistic update: immediately remove deleted sessions from cache
      queryClient.setQueryData<AdminSession[]>(queryKeys.sessions.admin, (oldData) => {
        if (!oldData) return oldData;
        return oldData.filter((session) => !sessionIds.includes(session.id));
      });

      // Delete sessions from Supabase
      const { error } = await supabase.from('sessions').delete().in('id', sessionIds);

      if (error) {
        // Rollback on error - refetch to restore deleted items
        await refetch();
        throw error;
      }

      // Success
      setSnackbar({
        open: true,
        message: `${selectedSessions.length} sesjon(er) slettet`,
        severity: 'success',
      });

      // Clear selection
      setSelectedSessions([]);
    } catch (err) {
      console.error('Bulk delete failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Ukjent feil oppstod';
      setSnackbar({
        open: true,
        message: `Sletting feilet: ${errorMessage}`,
        severity: 'error',
      });
      throw err; // Re-throw to let dialog handle it
    }
  };

  // Bulk edit handler
  const handleBulkEdit = async (updates: Partial<Session>) => {
    if (selectedSessions.length === 0) return;

    try {
      const sessionIds = selectedSessions.map((s) => s.id);

      // Update sessions in Supabase
      const { error } = await supabase
        .from('sessions')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .in('id', sessionIds);

      if (error) throw error;

      // Success
      setSnackbar({
        open: true,
        message: `${selectedSessions.length} sesjon(er) oppdatert`,
        severity: 'success',
      });

      // Clear selection
      setSelectedSessions([]);
    } catch (err) {
      console.error('Bulk edit failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Ukjent feil oppstod';
      setSnackbar({
        open: true,
        message: `Oppdatering feilet: ${errorMessage}`,
        severity: 'error',
      });
      throw err; // Re-throw to let dialog handle it
    }
  };

  // Export to CSV handler
  const handleExport = () => {
    if (selectedSessions.length === 0) return;

    try {
      // Create CSV content
      const headers = [
        'Sesjonskode',
        'Sesjonsnavn',
        'Opprettet av',
        'Starttid',
        'Sluttid',
        'Deltakere',
        'Status',
      ];

      const rows = selectedSessions.map((session) => {
        const status = new Date(session.end_time) > new Date() ? 'Aktiv' : 'Avsluttet';
        return [
          session.session_code,
          `"${session.session_name.replace(/"/g, '""')}"`, // Escape quotes
          `"${(session.creator?.full_name || 'Ukjent').replace(/"/g, '""')}"`,
          new Date(session.start_time).toLocaleString('nb-NO'),
          new Date(session.end_time).toLocaleString('nb-NO'),
          session.participants_count?.toString() || '0',
          status,
        ];
      });

      const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

      // Create and download file
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }); // BOM for Excel
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sesjoner-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Success message
      setSnackbar({
        open: true,
        message: `${selectedSessions.length} sesjon(er) eksportert til CSV`,
        severity: 'success',
      });
    } catch (err) {
      console.error('Export failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Ukjent feil oppstod';
      setSnackbar({
        open: true,
        message: `Eksport feilet: ${errorMessage}`,
        severity: 'error',
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Sesjonsadministrasjon
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Administrer alle sesjoner i systemet. Du kan redigere sesjonsnavn ved å dobbeltklikke på
          en celle, søke etter sesjoner, og utføre masseoperasjoner på valgte sesjoner.
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
        <AdminActionsToolbar
          selectedSessions={selectedSessions}
          onBulkDelete={() => setDeleteDialogOpen(true)}
          onBulkEdit={() => setEditDialogOpen(true)}
          onSearch={handleSearch}
          onStatusFilter={handleStatusFilter}
          onExport={handleExport}
          onRefresh={refetch}
        />

        {/* Data Grid */}
        <AdminSessionsGrid
          onSelectionChange={handleSelectionChange}
          searchQuery={searchQuery}
          statusFilter={statusFilter}
        />
      </Paper>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        sessions={selectedSessions}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleBulkDelete}
      />

      {/* Edit Dialog */}
      <SessionEditDialog
        open={editDialogOpen}
        sessions={selectedSessions}
        onClose={() => setEditDialogOpen(false)}
        onSave={handleBulkEdit}
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
