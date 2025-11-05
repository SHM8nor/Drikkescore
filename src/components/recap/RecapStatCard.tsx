/**
 * RecapStatCard Component
 *
 * A reusable stat card component for displaying session statistics
 * with glass-morphism effect, colored icons, and hover animations.
 *
 * Features:
 * - Glass-morphism background with backdrop blur
 * - Colored icon with shadow based on severity
 * - Large, bold value display
 * - Optional subtitle
 * - Smooth hover lift animation
 * - Responsive padding and sizing
 */

import { Box, Typography } from '@mui/material';

interface RecapStatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  subtitle?: string;
  color: string; // Accept any CSS color string
}

export default function RecapStatCard({
  icon,
  title,
  value,
  subtitle,
  color,
}: RecapStatCardProps) {
  return (
    <Box
      sx={{
        // Glass-morphism effect
        background: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(10px)',

        // Border and radius
        border: '1px solid rgba(0, 48, 73, 0.1)',
        borderRadius: 'var(--radius-lg)',

        // Shadow
        boxShadow: '0 8px 32px rgba(0, 48, 73, 0.1)',

        // Padding - responsive
        p: { xs: 2, sm: 2.5 },

        // Fill height
        height: '100%',

        // Smooth transitions
        transition: 'all 0.3s ease',

        // Hover effects - lift up 4px with increased shadow
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 12px 40px rgba(0, 48, 73, 0.15)',
        },
      }}
    >
      {/* Header row with title and icon */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          mb: 1.5,
        }}
      >
        {/* Title */}
        <Typography
          variant="body2"
          sx={{
            color: 'var(--color-text-secondary)',
            fontWeight: 600,
            fontSize: { xs: '0.75rem', sm: '0.8125rem' },
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          {title}
        </Typography>

        {/* Icon with colored background and shadow */}
        <Box
          sx={{
            width: { xs: 36, sm: 40 },
            height: { xs: 36, sm: 40 },
            borderRadius: 'var(--radius-md)',
            backgroundColor: color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            // Colored shadow based on the color prop
            boxShadow: `0 4px 12px ${color}40`,
          }}
        >
          {icon}
        </Box>
      </Box>

      {/* Value - large and bold */}
      <Typography
        variant="h4"
        sx={{
          fontWeight: 700,
          color: 'var(--color-text-primary)',
          mb: subtitle ? 0.5 : 0,
          fontSize: { xs: '1.5rem', sm: '1.75rem' },
        }}
      >
        {value}
      </Typography>

      {/* Optional subtitle - smaller and muted */}
      {subtitle && (
        <Typography
          variant="caption"
          sx={{
            color: 'var(--color-text-muted)',
            fontSize: { xs: '0.7rem', sm: '0.75rem' },
          }}
        >
          {subtitle}
        </Typography>
      )}
    </Box>
  );
}
