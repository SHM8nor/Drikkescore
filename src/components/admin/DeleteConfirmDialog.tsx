import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Alert,
  Box,
} from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';
import type { AdminSession } from '../../hooks/useAdminSessions';

interface DeleteConfirmDialogProps {
  open: boolean;
  sessions: AdminSession[];
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

/**
 * Confirmation dialog for bulk session deletion
 * Features:
 * - Shows count of sessions to be deleted
 * - Lists session names for review
 * - Handles async deletion with loading state
 * - Shows success/error messages
 */
export default function DeleteConfirmDialog({
  open,
  sessions,
  onClose,
  onConfirm,
}: DeleteConfirmDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);

    try {
      await onConfirm();
      // Success - close dialog
      onClose();
    } catch (err) {
      console.error('Delete failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Ukjent feil oppstod';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="delete-confirm-dialog-title"
    >
      <DialogTitle id="delete-confirm-dialog-title">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon color="error" />
          <Typography variant="h6" component="span">
            Bekreft sletting
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Typography variant="body1" paragraph>
          Er du sikker på at du vil slette {sessions.length} sesjon(er)?
          Denne handlingen kan ikke angres.
        </Typography>

        <Typography variant="body2" color="text.secondary" paragraph>
          Følgende sesjoner vil bli slettet:
        </Typography>

        <List
          dense
          sx={{
            maxHeight: 200,
            overflow: 'auto',
            bgcolor: 'background.default',
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          {sessions.map((session) => (
            <ListItem key={session.id}>
              <ListItemText
                primary={session.session_name}
                secondary={`Kode: ${session.session_code}`}
              />
            </ListItem>
          ))}
        </List>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={loading} color="inherit">
          Avbryt
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={loading}
          variant="contained"
          color="error"
          startIcon={loading ? <CircularProgress size={16} /> : null}
        >
          {loading ? 'Sletter...' : 'Slett'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
