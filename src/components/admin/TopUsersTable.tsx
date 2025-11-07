import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Alert,
  CircularProgress,
  Chip,
  Tooltip,
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import type { TopUser } from '../../api/systemAnalytics';
import { formatBAC } from '../../utils/bacCalculator';

interface TopUsersTableProps {
  topUsers: TopUser[] | undefined;
  loading?: boolean;
  error?: Error | null;
}

/**
 * Get medal color based on rank
 */
function getMedalColor(rank: number): string {
  switch (rank) {
    case 1:
      return '#FFD700'; // Gold
    case 2:
      return '#C0C0C0'; // Silver
    case 3:
      return '#CD7F32'; // Bronze
    default:
      return 'transparent';
  }
}

/**
 * TopUsersTable Component
 *
 * Displays top users in a table format.
 * Features:
 * - Ranking with medal icons for top 3
 * - User avatar with fallback
 * - Both display_name and full_name for admin visibility
 * - Total sessions
 * - Total drinks
 * - Peak BAC
 * - Responsive (hides some columns on mobile)
 */
export default function TopUsersTable({
  topUsers,
  loading = false,
  error,
}: TopUsersTableProps) {
  // Loading state
  if (loading) {
    return (
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
          <CircularProgress size={60} />
        </Box>
      </Paper>
    );
  }

  // Error state
  if (error) {
    return (
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Alert severity="error">
          <Typography variant="h6" gutterBottom>
            Feil ved lasting av toppliste
          </Typography>
          <Typography>{error.message}</Typography>
        </Alert>
      </Paper>
    );
  }

  // Empty state
  if (!topUsers || topUsers.length === 0) {
    return (
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Alert severity="info">
          <Typography>Ingen brukere funnet</Typography>
        </Alert>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3, borderRadius: 2 }}>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
        Toppliste
      </Typography>

      <TableContainer>
        <Table sx={{ minWidth: { xs: 300, sm: 650 } }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Rang</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Visningsnavn</TableCell>
              <TableCell sx={{ fontWeight: 600, display: { xs: 'none', lg: 'table-cell' } }}>
                Fullt navn
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, display: { xs: 'none', md: 'table-cell' } }}>
                Økter
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>
                Enheter
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, display: { xs: 'none', sm: 'table-cell' } }}>
                Topp-promille
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {topUsers.map((user, index) => {
              const rank = index + 1;
              const medalColor = getMedalColor(rank);
              const showMedal = rank <= 3;

              return (
                <TableRow
                  key={user.user_id}
                  sx={{
                    '&:last-child td, &:last-child th': { border: 0 },
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                  }}
                >
                  {/* Rank */}
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {showMedal && (
                        <EmojiEventsIcon
                          sx={{
                            color: medalColor,
                            fontSize: '24px',
                          }}
                        />
                      )}
                      <Typography
                        sx={{
                          fontWeight: showMedal ? 700 : 500,
                          fontSize: showMedal ? '18px' : '16px',
                        }}
                      >
                        #{rank}
                      </Typography>
                    </Box>
                  </TableCell>

                  {/* Display Name (Avatar + Display Name) */}
                  <TableCell>
                    <Tooltip
                      title={
                        <Box>
                          <Typography variant="body2">
                            Visningsnavn: {user.display_name}
                          </Typography>
                          <Typography variant="body2">
                            Fullt navn: {user.full_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {user.total_friends} {user.total_friends === 1 ? 'venn' : 'venner'}
                          </Typography>
                        </Box>
                      }
                      arrow
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar
                          src={user.avatar_url || undefined}
                          alt={user.display_name}
                          sx={{
                            width: 40,
                            height: 40,
                            bgcolor: 'var(--prussian-blue)',
                          }}
                        >
                          {user.display_name.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography sx={{ fontWeight: 600 }}>
                            {user.display_name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {user.total_friends} {user.total_friends === 1 ? 'venn' : 'venner'}
                          </Typography>
                        </Box>
                      </Box>
                    </Tooltip>
                  </TableCell>

                  {/* Full Name (hidden on mobile/tablet) */}
                  <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                    <Typography variant="body2" color="text.secondary">
                      {user.full_name}
                    </Typography>
                  </TableCell>

                  {/* Sessions (hidden on mobile) */}
                  <TableCell align="right" sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                    <Chip
                      label={user.total_sessions}
                      size="small"
                      sx={{
                        backgroundColor: 'var(--orange-wheel)',
                        color: 'white',
                        fontWeight: 600,
                      }}
                    />
                  </TableCell>

                  {/* Drinks */}
                  <TableCell align="right">
                    <Chip
                      label={user.total_drinks}
                      size="small"
                      sx={{
                        backgroundColor: 'var(--xanthous-dark)',
                        color: 'white',
                        fontWeight: 600,
                      }}
                    />
                  </TableCell>

                  {/* Peak BAC (hidden on mobile) */}
                  <TableCell align="right" sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                    <Typography
                      sx={{
                        fontWeight: 600,
                        color: user.peak_bac >= 0.08 ? 'var(--fire-engine-red)' : 'text.primary',
                      }}
                    >
                      {formatBAC(user.peak_bac)}
                    </Typography>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Summary */}
      <Box
        sx={{
          mt: 2,
          pt: 2,
          borderTop: '1px solid',
          borderColor: 'divider',
          textAlign: 'center',
        }}
      >
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          Viser topp {topUsers.length} brukere
        </Typography>
      </Box>
    </Paper>
  );
}
