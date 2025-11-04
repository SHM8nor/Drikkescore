import { QRCodeSVG } from 'qrcode.react';
import { Box, Typography } from '@mui/material';
import { useMemo } from 'react';

interface QRCodeGeneratorProps {
  sessionId?: string; // Optional for backward compatibility
  sessionCode: string;
  size?: number;
}

export function QRCodeGenerator({
  sessionCode,
  size = 256
}: QRCodeGeneratorProps) {
  // SECURITY FIX #1: Validate sessionCode format at component entry
  const isValidSessionCode = useMemo(() => {
    // Session codes must be exactly 6 alphanumeric characters (uppercase)
    const sessionCodeRegex = /^[A-Z0-9]{6}$/;
    return sessionCodeRegex.test(sessionCode);
  }, [sessionCode]);

  // Return error state if sessionCode is invalid
  if (!isValidSessionCode) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
          padding: 3,
          backgroundColor: '#ffebee',
          borderRadius: 2,
          border: '1px solid #ef5350',
        }}
      >
        <Typography
          variant="body1"
          sx={{
            color: '#c62828',
            fontWeight: 500,
            textAlign: 'center',
          }}
        >
          Ugyldig øktkode. Øktkoder må være 6 tegn lange og inneholde kun store bokstaver og tall.
        </Typography>
      </Box>
    );
  }

  // SECURITY FIX #1: Encode sessionCode in URL construction to prevent XSS
  const joinUrl = `${window.location.origin}/join/${encodeURIComponent(sessionCode)}`;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        padding: 3,
        backgroundColor: '#ffffff',
        borderRadius: 2,
      }}
    >
      {/* QR Code */}
      <Box
        sx={{
          padding: 2,
          backgroundColor: '#ffffff',
          borderRadius: 1,
          border: '1px solid rgba(0, 48, 73, 0.1)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <QRCodeSVG
          value={joinUrl}
          size={size}
          level="M"
          includeMargin={false}
          bgColor="#ffffff"
          fgColor="#003049"
        />
      </Box>

      {/* Session Code Display */}
      <Box
        sx={{
          textAlign: 'center',
          padding: 2,
          backgroundColor: 'rgba(0, 48, 73, 0.05)',
          borderRadius: 1,
          width: '100%',
        }}
      >
        <Typography
          variant="body2"
          sx={{
            color: 'rgba(0, 48, 73, 0.7)',
            fontSize: '14px',
            fontWeight: 500,
            marginBottom: 0.5,
          }}
        >
          Øktkode
        </Typography>
        <Typography
          variant="h4"
          sx={{
            color: '#003049',
            fontWeight: 700,
            letterSpacing: '0.15em',
            fontFamily: 'monospace',
          }}
        >
          {sessionCode}
        </Typography>
      </Box>
    </Box>
  );
}
