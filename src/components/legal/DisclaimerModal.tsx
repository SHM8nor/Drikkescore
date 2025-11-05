import { useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Divider,
  CircularProgress,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import DisclaimerText from './DisclaimerText';
import PrivacyPolicyText from './PrivacyPolicyText';

interface DisclaimerModalProps {
  open: boolean;
  onAccept: () => void;
  loading?: boolean;
}

/**
 * DisclaimerModal Component
 *
 * Full-screen blocking modal that users MUST accept before using the app.
 *
 * Features:
 * - Cannot be dismissed without accepting
 * - Requires scrolling to bottom before accept button is enabled
 * - Shows loading state during acceptance
 * - Responsive: fullscreen on mobile, dialog on desktop
 * - Matches app color scheme (Prussian Blue, Vanilla)
 *
 * Props:
 * - open: Controls modal visibility
 * - onAccept: Callback when user accepts terms
 * - loading: Optional loading state during acceptance process
 */
export default function DisclaimerModal({
  open,
  onAccept,
  loading = false,
}: DisclaimerModalProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const contentRef = useRef<HTMLDivElement>(null);

  const handleAccept = () => {
    if (!loading) {
      onAccept();
    }
  };

  const isAcceptDisabled = loading;

  return (
    <Dialog
      open={open}
      fullScreen={isMobile}
      maxWidth="md"
      fullWidth
      disableEscapeKeyDown
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 2,
          backgroundColor: 'var(--vanilla)',
        },
      }}
      // Prevent closing by clicking backdrop
      onClose={(_event, reason) => {
        if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') {
          return;
        }
      }}
    >
      {/* Dialog Header */}
      <DialogTitle
        sx={{
          backgroundColor: 'var(--prussian-blue)',
          color: 'var(--vanilla)',
          paddingY: 2.5,
        }}
      >
        <Typography
          variant="h5"
          component="h1"
          sx={{
            fontWeight: 700,
            textAlign: 'center',
            color: 'inherit',
          }}
        >
          Viktig informasjon før du fortsetter
        </Typography>
      </DialogTitle>

      {/* Scrollable Content */}
      <DialogContent
        ref={contentRef}
        sx={{
          paddingY: 3,
          paddingX: isMobile ? 2 : 3,
          backgroundColor: 'var(--vanilla)',
          color: 'var(--color-text-secondary)',
          overflowY: 'auto',
          maxHeight: isMobile ? 'none' : '60vh',
          // Custom scrollbar styling for better visibility
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'var(--vanilla-dark)',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'var(--prussian-blue)',
            borderRadius: '4px',
            '&:hover': {
              backgroundColor: 'var(--prussian-blue-dark)',
            },
          },
        }}
      >
        {/* Disclaimer Section */}
        <DisclaimerText variant="full" />

        {/* Divider between sections */}
        <Divider
          sx={{
            marginY: 3,
            backgroundColor: 'var(--prussian-blue)',
            opacity: 0.2,
          }}
        />

        {/* Privacy Policy Section */}
        <PrivacyPolicyText variant="full" />
      </DialogContent>

      {/* Dialog Actions */}
      <DialogActions
        sx={{
          paddingX: 3,
          paddingY: 2,
          backgroundColor: 'var(--vanilla)',
          borderTop: '1px solid var(--prussian-blue-bg)',
        }}
      >
        <Button
          onClick={handleAccept}
          disabled={isAcceptDisabled}
          variant="contained"
          fullWidth={isMobile}
          size="large"
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
          sx={{
            backgroundColor: 'var(--prussian-blue)',
            color: 'var(--vanilla)',
            fontWeight: 600,
            paddingY: 1.5,
            paddingX: 4,
            '&:hover': {
              backgroundColor: 'var(--prussian-blue-dark)',
            },
            '&:disabled': {
              backgroundColor: 'var(--prussian-blue-bg)',
              color: 'var(--color-text-disabled)',
            },
          }}
        >
          {loading ? 'Behandler...' : 'Jeg godtar vilkårene'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
