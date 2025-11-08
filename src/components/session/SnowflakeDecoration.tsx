import { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import { useTheme } from '../../context/ThemeContext';

interface Snowflake {
  id: number;
  left: number;
  animationDuration: number;
  animationDelay: number;
  fontSize: number;
  opacity: number;
}

interface SnowflakeDecorationProps {
  enabled?: boolean;
  snowflakeCount?: number;
}

export function SnowflakeDecoration({
  enabled = true,
  snowflakeCount = 20
}: SnowflakeDecorationProps) {
  const { sessionType } = useTheme();
  const [snowflakes, setSnowflakes] = useState<Snowflake[]>([]);

  // Only show snowflakes for julebord theme
  const shouldShow = enabled && sessionType === 'julebord';

  useEffect(() => {
    if (!shouldShow) {
      setSnowflakes([]);
      return;
    }

    // Generate random snowflakes
    const flakes: Snowflake[] = Array.from({ length: snowflakeCount }, (_, i) => ({
      id: i,
      left: Math.random() * 100, // Random position (0-100%)
      animationDuration: 10 + Math.random() * 20, // 10-30 seconds
      animationDelay: Math.random() * 5, // 0-5 seconds delay
      fontSize: 10 + Math.random() * 20, // 10-30px
      opacity: 0.3 + Math.random() * 0.7, // 0.3-1.0
    }));

    setSnowflakes(flakes);
  }, [shouldShow, snowflakeCount]);

  if (!shouldShow) {
    return null;
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1,
        overflow: 'hidden',
      }}
    >
      {snowflakes.map((flake) => (
        <Box
          key={flake.id}
          sx={{
            position: 'absolute',
            top: '-10px',
            left: `${flake.left}%`,
            fontSize: `${flake.fontSize}px`,
            opacity: flake.opacity,
            animation: `fall ${flake.animationDuration}s linear infinite`,
            animationDelay: `${flake.animationDelay}s`,
            userSelect: 'none',
            '@keyframes fall': {
              '0%': {
                transform: 'translateY(-10px) rotate(0deg)',
              },
              '100%': {
                transform: `translateY(100vh) rotate(360deg)`,
              },
            },
          }}
        >
          ❄️
        </Box>
      ))}
    </Box>
  );
}
