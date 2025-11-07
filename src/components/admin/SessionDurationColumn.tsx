import { Box, Typography } from '@mui/material';

interface SessionDurationColumnProps {
  startTime: string;
  endTime: string;
}

/**
 * SessionDurationColumn Component
 *
 * Displays session duration in a compact format
 * Format: "2t 30m" or "45m"
 * Color coded: green (active), gray (ended)
 */
export default function SessionDurationColumn({ startTime, endTime }: SessionDurationColumnProps) {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const now = new Date();

  const isActive = end > now;
  const durationMs = end.getTime() - start.getTime();
  const durationMinutes = Math.floor(durationMs / (1000 * 60));

  // Format duration
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;

  let formattedDuration: string;
  if (hours > 0) {
    formattedDuration = minutes > 0 ? `${hours}t ${minutes}m` : `${hours}t`;
  } else {
    formattedDuration = `${minutes}m`;
  }

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 1,
      }}
    >
      <Box
        sx={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: isActive ? 'success.main' : 'grey.400',
        }}
      />
      <Typography
        variant="body2"
        sx={{
          fontWeight: 500,
          color: isActive ? 'success.main' : 'text.secondary',
        }}
      >
        {formattedDuration}
      </Typography>
    </Box>
  );
}
