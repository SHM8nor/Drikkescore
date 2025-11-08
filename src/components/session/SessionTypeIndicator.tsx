import { Box, Chip } from '@mui/material';
import { useTheme } from '../../context/ThemeContext';
import type { SessionType } from '../../types/database';

interface SessionTypeIndicatorProps {
  sessionType: SessionType;
  size?: 'small' | 'medium';
}

export function SessionTypeIndicator({ sessionType, size = 'medium' }: SessionTypeIndicatorProps) {
  const { themeColors } = useTheme();

  if (sessionType === 'standard') {
    return null; // Don't show indicator for standard sessions
  }

  const getSessionTypeConfig = () => {
    switch (sessionType) {
      case 'julebord':
        return {
          label: '🎄 Julebord',
          color: themeColors.secondary,
          backgroundColor: 'rgba(196, 30, 58, 0.1)',
        };
      default:
        return null;
    }
  };

  const config = getSessionTypeConfig();
  if (!config) return null;

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 1,
      }}
    >
      <Chip
        label={config.label}
        size={size}
        sx={{
          backgroundColor: config.backgroundColor,
          color: config.color,
          fontWeight: 600,
          fontSize: size === 'small' ? '0.75rem' : '0.875rem',
          borderRadius: '8px',
          border: `2px solid ${config.color}`,
          animation: 'pulse 2s ease-in-out infinite',
          '@keyframes pulse': {
            '0%, 100%': {
              boxShadow: `0 0 0 0 ${config.color}40`,
            },
            '50%': {
              boxShadow: `0 0 0 8px ${config.color}00`,
            },
          },
        }}
      />
    </Box>
  );
}
