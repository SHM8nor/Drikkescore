/**
 * ThemeSelector Component
 *
 * Allows users to switch between session themes (standard/julebord).
 * Displays current theme and provides visual preview of colors.
 */

import { Box, Button, Typography, Paper } from '@mui/material';
import { useTheme } from '../../context/ThemeContext';
import type { SessionType } from '../../context/ThemeContext';

interface ThemeSelectorProps {
  /** Show color preview chips */
  showPreview?: boolean;
}

function ThemeSelector({ showPreview = true }: ThemeSelectorProps) {
  const { sessionType, setSessionType } = useTheme();

  const handleThemeChange = (type: SessionType) => {
    setSessionType(type);
  };

  return (
    <Paper
      elevation={2}
      sx={{
        p: 2,
        borderRadius: 2,
      }}
    >
      <Typography variant="h6" gutterBottom>
        Temamodus
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Button
          variant={sessionType === 'standard' ? 'contained' : 'outlined'}
          onClick={() => handleThemeChange('standard')}
          fullWidth
          sx={{
            backgroundColor:
              sessionType === 'standard'
                ? 'var(--color-primary)'
                : 'transparent',
            color:
              sessionType === 'standard'
                ? 'var(--color-text-inverse)'
                : 'var(--color-primary)',
            borderColor: 'var(--color-primary)',
            '&:hover': {
              backgroundColor: 'var(--color-primary-dark)',
              borderColor: 'var(--color-primary-dark)',
            },
          }}
        >
          Standard
        </Button>

        <Button
          variant={sessionType === 'julebord' ? 'contained' : 'outlined'}
          onClick={() => handleThemeChange('julebord')}
          fullWidth
          sx={{
            backgroundColor:
              sessionType === 'julebord'
                ? 'var(--christmas-red)'
                : 'transparent',
            color:
              sessionType === 'julebord'
                ? 'var(--color-text-inverse)'
                : 'var(--christmas-red)',
            borderColor: 'var(--christmas-red)',
            '&:hover': {
              backgroundColor: 'var(--christmas-cranberry)',
              borderColor: 'var(--christmas-cranberry)',
            },
          }}
        >
          🎄 Julebord
        </Button>
      </Box>

      {showPreview && (
        <Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Fargepalett:
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                backgroundColor: 'var(--color-primary)',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'var(--color-border)',
                transition: 'all 0.3s ease',
              }}
              title="Primærfarge"
            />
            <Box
              sx={{
                width: 48,
                height: 48,
                backgroundColor: 'var(--color-secondary)',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'var(--color-border)',
                transition: 'all 0.3s ease',
              }}
              title="Sekundærfarge"
            />
            <Box
              sx={{
                width: 48,
                height: 48,
                backgroundColor: 'var(--color-accent)',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'var(--color-border)',
                transition: 'all 0.3s ease',
              }}
              title="Aksentfarge"
            />
            <Box
              sx={{
                width: 48,
                height: 48,
                backgroundColor: 'var(--color-danger)',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'var(--color-border)',
                transition: 'all 0.3s ease',
              }}
              title="Farefarge"
            />
          </Box>
        </Box>
      )}
    </Paper>
  );
}

export default ThemeSelector;
