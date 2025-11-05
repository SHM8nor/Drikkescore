import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  TextField,
  Alert,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
} from '@mui/material';
import {
  Warning as WarningIcon,
  LocalBar as LocalBarIcon,
  Group as GroupIcon,
  Event as EventIcon,
  History as HistoryIcon,
} from '@mui/icons-material';

interface DeleteDataDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

/**
 * DeleteDataDialog Component
 *
 * Confirmation dialog for deleting drinking data only (not account).
 *
 * Features:
 * - Shows list of what will be deleted
 * - Requires typing "SLETT MINE DATA" to confirm
 * - Red warning alert
 * - Loading state during deletion
 * - Norwegian text throughout
 */
export default function DeleteDataDialog({
  open,
  onClose,
  onConfirm,
  loading = false,
}: DeleteDataDialogProps) {
  const [confirmText, setConfirmText] = useState('');

  const handleClose = () => {
    if (!loading) {
      setConfirmText('');
      onClose();
    }
  };

  const handleConfirm = () => {
    if (confirmText === 'SLETT MINE DATA') {
      onConfirm();
      setConfirmText('');
    }
  };

  const isConfirmEnabled = confirmText === 'SLETT MINE DATA';

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="delete-data-dialog-title"
    >
      <DialogTitle id="delete-data-dialog-title">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon sx={{ color: '#dc2626' }} />
          <Typography variant="h6" component="span">
            Slett drikkeopplysninger
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Alert
          severity="error"
          icon={<WarningIcon />}
          sx={{ mb: 3 }}
        >
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            Dette vil permanent slette alle dine drikkeopplysninger!
          </Typography>
        </Alert>

        <Typography variant="body1" paragraph>
          Følgende data vil bli slettet:
        </Typography>

        <List dense>
          <ListItem>
            <ListItemIcon>
              <LocalBarIcon sx={{ color: '#003049' }} />
            </ListItemIcon>
            <ListItemText
              primary="Alle drikkeregistreringer"
              secondary="Alle drikker du har logget i appen"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <GroupIcon sx={{ color: '#003049' }} />
            </ListItemIcon>
            <ListItemText
              primary="Alle øktdeltagelser"
              secondary="Din deltakelse i andre sine økter"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <EventIcon sx={{ color: '#003049' }} />
            </ListItemIcon>
            <ListItemText
              primary="Økter du opprettet"
              secondary="Slettes hvis ingen andre deltakere"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <HistoryIcon sx={{ color: '#003049' }} />
            </ListItemIcon>
            <ListItemText
              primary="Aktivitetshistorikk"
              secondary="Alle BAC-målinger og statistikk"
            />
          </ListItem>
        </List>

        <Alert severity="info" sx={{ mt: 3, mb: 2 }}>
          <Typography variant="body2">
            Din profil og brukerkonto vil ikke bli slettet. Du kan fortsatt logge inn og starte nye økter.
          </Typography>
        </Alert>

        <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
          Skriv "SLETT MINE DATA" for å bekrefte:
        </Typography>

        <TextField
          fullWidth
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder="SLETT MINE DATA"
          disabled={loading}
          autoComplete="off"
          sx={{
            '& .MuiOutlinedInput-root': {
              '&.Mui-focused fieldset': {
                borderColor: '#dc2626',
              },
            },
          }}
        />
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={loading} color="inherit">
          Avbryt
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={!isConfirmEnabled || loading}
          variant="contained"
          sx={{
            backgroundColor: '#dc2626',
            '&:hover': {
              backgroundColor: '#991b1b',
            },
            '&:disabled': {
              backgroundColor: '#fca5a5',
            },
          }}
          startIcon={loading ? <CircularProgress size={16} /> : null}
        >
          {loading ? 'Sletter...' : 'Slett mine data'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
