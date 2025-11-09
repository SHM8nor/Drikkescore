import React from 'react';
import { Box, Button, Typography, Container, Alert } from '@mui/material';
import { ErrorOutline as ErrorIcon } from '@mui/icons-material';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * Error Boundary Component
 *
 * Catches errors in child components, including:
 * - Lazy-loaded chunk failures (network errors, 404, corruption)
 * - Component rendering errors
 * - Lifecycle method errors
 *
 * Provides user-friendly error UI with recovery options.
 */
export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error details for debugging
    console.error('[ErrorBoundary] Caught error:', error);
    console.error('[ErrorBoundary] Error info:', errorInfo);

    // Update state with error details
    this.setState({ errorInfo });
  }

  handleReset = () => {
    // Reset error boundary state
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    // Full page reload for critical errors (e.g., chunk failures)
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const isChunkError = this.state.error?.message?.includes('Failed to fetch') ||
                          this.state.error?.message?.includes('404') ||
                          this.state.error?.message?.includes('dynamically');

      return (
        <Container maxWidth="sm">
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '100vh',
              py: 4,
            }}
          >
            <Box sx={{ mb: 3, textAlign: 'center' }}>
              <ErrorIcon
                sx={{
                  fontSize: 80,
                  color: 'error.main',
                  mb: 2,
                }}
              />
              <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
                Noe gikk galt
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                {isChunkError
                  ? 'Feil ved lasting av side. Prøv å oppdatere nettleseren.'
                  : 'En uventet feil oppstod. Vennligst prøv igjen.'}
              </Typography>
            </Box>

            {/* Show error details in development */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <Alert severity="error" sx={{ mb: 3, width: '100%' }}>
                <Typography variant="caption" component="div" sx={{ mb: 1, fontWeight: 'bold' }}>
                  {this.state.error.name}
                </Typography>
                <Typography variant="caption" component="div" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                  {this.state.error.message}
                </Typography>
                {this.state.errorInfo && (
                  <Typography variant="caption" component="div" sx={{ mt: 1, fontFamily: 'monospace', fontSize: '0.7rem' }}>
                    {this.state.errorInfo.componentStack}
                  </Typography>
                )}
              </Alert>
            )}

            {/* Action buttons */}
            <Box sx={{ display: 'flex', gap: 2, width: '100%' }}>
              {!isChunkError && (
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={this.handleReset}
                  sx={{ py: 1.5 }}
                >
                  Prøv igjen
                </Button>
              )}
              <Button
                variant="contained"
                fullWidth
                onClick={this.handleReload}
                sx={{ py: 1.5 }}
              >
                Oppdater side
              </Button>
            </Box>

            {/* Help text */}
            <Typography variant="caption" color="text.secondary" sx={{ mt: 3, textAlign: 'center' }}>
              Hvis problemet vedvarer, kontakt support.
            </Typography>
          </Box>
        </Container>
      );
    }

    return this.props.children;
  }
}
