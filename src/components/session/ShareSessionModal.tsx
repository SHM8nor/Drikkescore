import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  IconButton,
  Typography,
  Snackbar,
  Alert,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ShareIcon from '@mui/icons-material/Share';
import { QRCodeGenerator } from './QRCodeGenerator';

interface ShareSessionModalProps {
  open: boolean;
  onClose: () => void;
  sessionId: string;
  sessionCode: string;
  sessionName?: string;
}

export function ShareSessionModal({
  open,
  onClose,
  sessionId,
  sessionCode,
  sessionName,
}: ShareSessionModalProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // SECURITY FIX #2: Validate sessionCode format at component entry
  const isValidSessionCode = useMemo(() => {
    // Session codes must be exactly 6 alphanumeric characters (uppercase)
    const sessionCodeRegex = /^[A-Z0-9]{6}$/;
    return sessionCodeRegex.test(sessionCode);
  }, [sessionCode]);

  // SECURITY FIX #3: Sanitize sessionName to prevent XSS
  const sanitizedSessionName = useMemo(() => {
    if (!sessionName) return '';
    // Remove dangerous characters and limit length to 100 chars
    return sessionName.replace(/[<>'"]/g, '').slice(0, 100);
  }, [sessionName]);

  // Calculate QR code size based on screen size
  const qrSize = isMobile ? 200 : 256;

  // Check if Web Share API is available
  const canShare = typeof navigator !== 'undefined' && 'share' in navigator;

  // Early return if sessionCode is invalid
  if (!isValidSessionCode) {
    return (
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            backgroundColor: '#ffebee',
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#c62828',
            color: '#ffffff',
          }}
        >
          <Typography variant="h6" component="span">
            Ugyldig øktkode
          </Typography>
          <IconButton
            edge="end"
            color="inherit"
            onClick={onClose}
            aria-label="lukk"
            sx={{ color: '#ffffff' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ paddingTop: 3 }}>
          <Typography variant="body1" sx={{ color: '#c62828' }}>
            Øktkoden er ugyldig. Øktkoder må være 6 tegn lange og inneholde kun store bokstaver og tall.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} variant="contained" sx={{ backgroundColor: '#c62828' }}>
            Lukk
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(sessionCode);
      setSnackbarMessage('Øktkode kopiert til utklippstavlen!');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Failed to copy session code:', error);
      setSnackbarMessage('Kunne ikke kopiere øktkode');
      setSnackbarOpen(true);
    }
  };

  const handleCopyLink = async () => {
    // SECURITY FIX #2: Encode sessionCode in URL construction to prevent XSS
    const joinUrl = `${window.location.origin}/join/${encodeURIComponent(sessionCode)}`;
    try {
      await navigator.clipboard.writeText(joinUrl);
      setSnackbarMessage('Lenke kopiert til utklippstavlen!');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Failed to copy join link:', error);
      setSnackbarMessage('Kunne ikke kopiere lenke');
      setSnackbarOpen(true);
    }
  };

  const handleShare = async () => {
    // SECURITY FIX #2 & #3: Use encoded sessionCode and sanitized sessionName
    const joinUrl = `${window.location.origin}/join/${encodeURIComponent(sessionCode)}`;
    const shareData = {
      title: sanitizedSessionName || 'Bli med i økten',
      text: `Bli med i Drikkescore-økten "${sanitizedSessionName || 'min økt'}"! Bruk kode: ${sessionCode}`,
      url: joinUrl,
    };

    // Check if Web Share API is available (primarily mobile)
    if (canShare) {
      try {
        await navigator.share(shareData);
        setSnackbarMessage('Delt!');
        setSnackbarOpen(true);
      } catch (error) {
        // User cancelled share or error occurred
        console.log('Share cancelled or failed:', error);
      }
    } else {
      // Fallback: copy link to clipboard
      await handleCopyLink();
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : 2,
            backgroundColor: '#f8f9fa',
          },
        }}
      >
        {/* Dialog Header */}
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingBottom: 2,
            backgroundColor: '#003049',
            color: '#ffffff',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ShareIcon />
            <Typography variant="h6" component="span">
              Del økt via QR
            </Typography>
          </Box>
          <IconButton
            edge="end"
            color="inherit"
            onClick={onClose}
            aria-label="lukk"
            sx={{ color: '#ffffff' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        {/* Dialog Content */}
        <DialogContent
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            paddingTop: 3,
            paddingBottom: 3,
          }}
        >
          {sanitizedSessionName && (
            <Typography
              variant="h6"
              sx={{
                marginBottom: 2,
                textAlign: 'center',
                color: '#003049',
                fontWeight: 600,
              }}
            >
              {sanitizedSessionName}
            </Typography>
          )}

          <Typography
            variant="body2"
            sx={{
              marginBottom: 3,
              textAlign: 'center',
              color: 'rgba(0, 48, 73, 0.7)',
              maxWidth: '400px',
            }}
          >
            Skann QR-koden eller del øktkoden med andre for å invitere dem til økten
          </Typography>

          {/* QR Code Component */}
          <QRCodeGenerator
            sessionId={sessionId}
            sessionCode={sessionCode}
            size={qrSize}
          />

          {/* Action Buttons */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
              width: '100%',
              maxWidth: '400px',
              marginTop: 3,
            }}
          >
            <Button
              variant="contained"
              startIcon={<ContentCopyIcon />}
              onClick={handleCopyCode}
              sx={{
                backgroundColor: '#003049',
                '&:hover': {
                  backgroundColor: '#002033',
                },
                padding: '12px 24px',
                fontWeight: 600,
              }}
            >
              Kopier øktkode
            </Button>

            <Button
              variant="outlined"
              startIcon={<ContentCopyIcon />}
              onClick={handleCopyLink}
              sx={{
                borderColor: '#003049',
                color: '#003049',
                '&:hover': {
                  borderColor: '#002033',
                  backgroundColor: 'rgba(0, 48, 73, 0.05)',
                },
                padding: '12px 24px',
                fontWeight: 600,
              }}
            >
              Kopier lenke
            </Button>

            {canShare && (
              <Button
                variant="outlined"
                startIcon={<ShareIcon />}
                onClick={handleShare}
                sx={{
                  borderColor: '#003049',
                  color: '#003049',
                  '&:hover': {
                    borderColor: '#002033',
                    backgroundColor: 'rgba(0, 48, 73, 0.05)',
                  },
                  padding: '12px 24px',
                  fontWeight: 600,
                }}
              >
                Del
              </Button>
            )}
          </Box>
        </DialogContent>

        {/* Dialog Actions */}
        <DialogActions
          sx={{
            padding: 2,
            backgroundColor: '#f8f9fa',
          }}
        >
          <Button
            onClick={onClose}
            variant="text"
            sx={{
              color: '#003049',
              fontWeight: 600,
            }}
          >
            Lukk
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for copy notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity="success"
          sx={{
            width: '100%',
            backgroundColor: '#4caf50',
            color: '#ffffff',
          }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
}
