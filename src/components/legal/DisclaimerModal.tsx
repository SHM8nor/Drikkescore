import { useState, useEffect, useRef, useCallback } from 'react';
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

  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);

  // Check if user has scrolled to bottom
  const handleScroll = useCallback(() => {
    const element = contentRef.current;
    if (!element) return;

    const scrollPosition = element.scrollTop + element.clientHeight;
    const scrollHeight = element.scrollHeight;

    // Consider "bottom" reached if within 50px of actual bottom
    const isAtBottom = scrollHeight - scrollPosition <= 50;

    if (isAtBottom) {
      setHasScrolledToBottom(true);
    }
  }, []);

  // Reset scroll state when modal opens/closes
  useEffect(() => {
    if (!open) {
      setHasScrolledToBottom(false);
    }
  }, [open]);

  // Attach scroll listener
  useEffect(() => {
    const element = contentRef.current;
    if (!element) return;

    element.addEventListener('scroll', handleScroll);

    // Check initial scroll position (in case content is short enough)
    handleScroll();

    // Re-check on window resize (handles orientation changes)
    const handleResize = () => {
      handleScroll();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      element.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [handleScroll]);

  const handleAccept = () => {
    if (!loading && hasScrolledToBottom) {
      onAccept();
    }
  };

  const isAcceptDisabled = !hasScrolledToBottom || loading;

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

        {/* Scroll hint for users who haven't scrolled */}
        {!hasScrolledToBottom && (
          <Box
            sx={{
              marginTop: 3,
              padding: 2,
              backgroundColor: 'rgba(0, 48, 73, 0.1)',
              borderRadius: 1,
              border: '1px solid rgba(0, 48, 73, 0.2)',
            }}
          >
            <Typography
              variant="body2"
              sx={{
                textAlign: 'center',
                color: 'var(--prussian-blue)',
                fontWeight: 500,
              }}
            >
              Vennligst rull ned for å lese hele avtalen
            </Typography>
          </Box>
        )}
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
