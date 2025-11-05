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
  Checkbox,
  FormControlLabel,
  CircularProgress,
} from '@mui/material';
import {
  Warning as WarningIcon,
  Person as PersonIcon,
  Security as SecurityIcon,
  LocalBar as LocalBarIcon,
  People as PeopleIcon,
  Image as ImageIcon,
  Leaderboard as LeaderboardIcon,
} from '@mui/icons-material';

interface DeleteAccountDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

/**
 * DeleteAccountDialog Component
 *
 * Confirmation dialog for complete account deletion.
 *
 * Features:
 * - Shows comprehensive list of what will be deleted
 * - Two-step confirmation: checkbox + text input
 * - Strong warning alerts
 * - Loading state during deletion
 * - Norwegian text throughout
 */
export default function DeleteAccountDialog({
  open,
  onClose,
  onConfirm,
  loading = false,
}: DeleteAccountDialogProps) {
  const [confirmText, setConfirmText] = useState('');
  const [confirmCheckbox, setConfirmCheckbox] = useState(false);

  const handleClose = () => {
    if (!loading) {
      setConfirmText('');
      setConfirmCheckbox(false);
      onClose();
    }
  };

  const handleConfirm = () => {
    if (confirmText === 'SLETT KONTO' && confirmCheckbox) {
      onConfirm();
      setConfirmText('');
      setConfirmCheckbox(false);
    }
  };

  const isConfirmEnabled = confirmText === 'SLETT KONTO' && confirmCheckbox;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="delete-account-dialog-title"
    >
      <DialogTitle id="delete-account-dialog-title">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon sx={{ color: '#dc2626', fontSize: '2rem' }} />
          <Typography variant="h6" component="span" sx={{ color: '#dc2626', fontWeight: 600 }}>
            Slett konto permanent
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Alert
          severity="error"
          icon={<WarningIcon />}
          sx={{ mb: 2 }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
            ADVARSEL: Dette er permanent og kan ikke angres!
          </Typography>
          <Typography variant="body2">
            Kontoen din vil bli slettet for alltid. Du vil ikke kunne logge inn igjen med denne e-postadressen.
          </Typography>
        </Alert>

        <Typography variant="body1" sx={{ fontWeight: 500, mb: 2 }}>
          Følgende vil bli permanent slettet:
        </Typography>

        <List dense>
          <ListItem>
            <ListItemIcon>
              <PersonIcon sx={{ color: '#dc2626' }} />
            </ListItemIcon>
            <ListItemText
              primary="Din profil og alle personopplysninger"
              secondary="Navn, vekt, høyde, alder, kjønn"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <SecurityIcon sx={{ color: '#dc2626' }} />
            </ListItemIcon>
            <ListItemText
              primary="Brukerautentisering"
              secondary="Du vil ikke kunne logge inn igjen"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <LocalBarIcon sx={{ color: '#dc2626' }} />
            </ListItemIcon>
            <ListItemText
              primary="Alle drikkeregistreringer og økter"
              secondary="All aktivitetshistorikk og BAC-data"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <PeopleIcon sx={{ color: '#dc2626' }} />
            </ListItemIcon>
            <ListItemText
              primary="Alle vennskapsforhold"
              secondary="Vennelister og invitasjoner"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <ImageIcon sx={{ color: '#dc2626' }} />
            </ListItemIcon>
            <ListItemText
              primary="Profilbilde"
              secondary="Lagrede bilder i sky"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <LeaderboardIcon sx={{ color: '#dc2626' }} />
            </ListItemIcon>
            <ListItemText
              primary="Leaderboard-oppføringer"
              secondary="All historikk og statistikk"
            />
          </ListItem>
        </List>

        <Alert severity="warning" sx={{ mt: 3, mb: 3 }}>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            Det finnes ingen måte å angre denne handlingen. All data vil være tapt for alltid.
          </Typography>
        </Alert>

        <Box sx={{ mb: 2 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={confirmCheckbox}
                onChange={(e) => setConfirmCheckbox(e.target.checked)}
                disabled={loading}
                sx={{
                  color: '#dc2626',
                  '&.Mui-checked': {
                    color: '#dc2626',
                  },
                }}
              />
            }
            label={
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                Jeg forstår at dette er permanent og kan ikke angres
              </Typography>
            }
          />
        </Box>

        <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
          Skriv "SLETT KONTO" for å bekrefte:
        </Typography>

        <TextField
          fullWidth
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder="SLETT KONTO"
          disabled={loading || !confirmCheckbox}
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
          {loading ? 'Sletter konto...' : 'Slett konto permanent'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
