import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  CircularProgress,
  Alert,
  Box,
  Typography,
  Stack,
} from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';
import type { AdminSession } from '../../hooks/useAdminSessions';
import type { Session } from '../../types/database';

interface SessionEditDialogProps {
  open: boolean;
  sessions: AdminSession[];
  onClose: () => void;
  onSave: (updates: Partial<Session>) => Promise<void>;
}

/**
 * Dialog for bulk editing session properties
 * Features:
 * - Edit session name and end time for multiple sessions
 * - Form validation
 * - Handles async updates with loading state
 * - Shows success/error messages
 */
export default function SessionEditDialog({
  open,
  sessions,
  onClose,
  onSave,
}: SessionEditDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionName, setSessionName] = useState('');
  const [endTime, setEndTime] = useState('');

  const handleSave = async () => {
    setLoading(true);
    setError(null);

    // Validate inputs
    if (!sessionName.trim() && !endTime) {
      setError('Du må fylle ut minst ett felt for å oppdatere');
      setLoading(false);
      return;
    }

    // Validate session name
    if (sessionName.trim() && sessionName.trim().length < 3) {
      setError('Sesjonsnavn må være minst 3 tegn');
      setLoading(false);
      return;
    }

    // Validate end time
    if (endTime) {
      const endDate = new Date(endTime);
      if (isNaN(endDate.getTime())) {
        setError('Ugyldig sluttid');
        setLoading(false);
        return;
      }

      // Check if end time is before start time for any session
      const hasInvalidEndTime = sessions.some(
        (session) => endDate < new Date(session.start_time)
      );

      if (hasInvalidEndTime) {
        setError('Sluttid kan ikke være før starttid');
        setLoading(false);
        return;
      }
    }

    try {
      const updates: Partial<Session> = {};
      if (sessionName.trim()) {
        updates.session_name = sessionName.trim();
      }
      if (endTime) {
        updates.end_time = new Date(endTime).toISOString();
      }

      await onSave(updates);
      // Success - reset form and close
      setSessionName('');
      setEndTime('');
      onClose();
    } catch (err) {
      console.error('Update failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Ukjent feil oppstod';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setError(null);
      setSessionName('');
      setEndTime('');
      onClose();
    }
  };

  // Format datetime-local input value
  const formatDateTimeLocal = (isoString: string) => {
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Get the minimum end time (earliest start time among selected sessions)
  const minEndTime =
    sessions.length > 0
      ? formatDateTimeLocal(
          sessions.reduce((earliest, session) =>
            new Date(session.start_time) < new Date(earliest)
              ? session.start_time
              : earliest
          , sessions[0].start_time)
        )
      : undefined;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="edit-dialog-title"
    >
      <DialogTitle id="edit-dialog-title">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EditIcon color="primary" />
          <Typography variant="h6" component="span">
            Rediger sesjoner
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Typography variant="body2" color="text.secondary" paragraph>
          Redigerer {sessions.length} sesjon(er). Verdiene du oppgir vil overskrive eksisterende
          verdier for alle valgte sesjoner.
        </Typography>

        <Stack spacing={3} sx={{ mt: 2 }}>
          <TextField
            fullWidth
            label="Nytt sesjonsnavn"
            value={sessionName}
            onChange={(e) => setSessionName(e.target.value)}
            helperText="La stå tom for å beholde eksisterende navn"
            disabled={loading}
          />

          <TextField
            fullWidth
            label="Ny sluttid"
            type="datetime-local"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            InputLabelProps={{
              shrink: true,
            }}
            inputProps={{
              min: minEndTime,
            }}
            helperText="La stå tom for å beholde eksisterende sluttid"
            disabled={loading}
          />
        </Stack>

        {sessions.length > 0 && (
          <Box
            sx={{
              mt: 3,
              p: 2,
              bgcolor: 'background.default',
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
              Valgte sesjoner:
            </Typography>
            {sessions.slice(0, 3).map((session) => (
              <Typography key={session.id} variant="body2" color="text.secondary">
                • {session.session_name}
              </Typography>
            ))}
            {sessions.length > 3 && (
              <Typography variant="body2" color="text.secondary">
                ... og {sessions.length - 3} flere
              </Typography>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={loading} color="inherit">
          Avbryt
        </Button>
        <Button
          onClick={handleSave}
          disabled={loading}
          variant="contained"
          startIcon={loading ? <CircularProgress size={16} /> : null}
          sx={{
            backgroundColor: '#0f3460',
            '&:hover': {
              backgroundColor: '#0a2542',
            },
          }}
        >
          {loading ? 'Lagrer...' : 'Lagre'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
