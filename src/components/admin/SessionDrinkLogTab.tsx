import { useMemo, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Box,
  Typography,
  Chip,
  TablePagination,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Fastfood, Speed } from '@mui/icons-material';
import type { SessionDrinkWithUser } from '../../api/sessionDetails';
import { inferDrinkType } from '../../utils/bacCalculator';

interface SessionDrinkLogTabProps {
  drinks: SessionDrinkWithUser[];
}

/**
 * Session Drink Log Tab - Timeline of all drinks
 *
 * Features:
 * - Chronological drink list (newest first)
 * - User info with avatar
 * - Drink details (volume, alcohol %, type)
 * - Rapid consumption and food flags
 * - Pagination for 100+ drinks
 * - Responsive (hides columns on mobile)
 */
export default function SessionDrinkLogTab({ drinks }: SessionDrinkLogTabProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // Format date/time
  const formatTime = (dateString: string) => {
    return new Intl.DateTimeFormat('nb-NO', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(new Date(dateString));
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('nb-NO', {
      dateStyle: 'short',
    }).format(new Date(dateString));
  };

  // Get drink type label
  const getDrinkTypeLabel = (alcoholPercentage: number): string => {
    const type = inferDrinkType(alcoholPercentage);
    switch (type) {
      case 'beer':
        return 'Øl';
      case 'wine':
        return 'Vin';
      case 'spirits':
        return 'Brennevin';
      default:
        return 'Annet';
    }
  };

  // Get drink type color
  const getDrinkTypeColor = (
    alcoholPercentage: number
  ): 'default' | 'primary' | 'secondary' | 'error' => {
    const type = inferDrinkType(alcoholPercentage);
    switch (type) {
      case 'beer':
        return 'primary';
      case 'wine':
        return 'secondary';
      case 'spirits':
        return 'error';
      default:
        return 'default';
    }
  };

  // Pagination handlers
  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Paginated drinks
  const paginatedDrinks = useMemo(() => {
    const start = page * rowsPerPage;
    const end = start + rowsPerPage;
    return drinks.slice(start, end);
  }, [drinks, page, rowsPerPage]);

  if (drinks.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 200,
        }}
      >
        <Typography variant="body1" color="text.secondary">
          Ingen drinker registrert i denne sesjonen
        </Typography>
      </Box>
    );
  }

  return (
    <Paper>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Tid</TableCell>
              <TableCell>Bruker</TableCell>
              {!isMobile && <TableCell>Type</TableCell>}
              <TableCell align="right">Volum</TableCell>
              {!isMobile && <TableCell align="right">Alkohol %</TableCell>}
              <TableCell align="center">Flagg</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedDrinks.map((drink) => (
              <TableRow
                key={drink.id}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
                {/* Time */}
                <TableCell>
                  <Box>
                    <Typography variant="body2" fontWeight="medium">
                      {formatTime(drink.consumed_at)}
                    </Typography>
                    {!isMobile && (
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(drink.consumed_at)}
                      </Typography>
                    )}
                  </Box>
                </TableCell>

                {/* User */}
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar
                      src={drink.user.avatar_url}
                      alt={drink.user.full_name}
                      sx={{ width: 28, height: 28 }}
                    >
                      {drink.user.full_name.charAt(0).toUpperCase()}
                    </Avatar>
                    {!isMobile && (
                      <Typography variant="body2">
                        {drink.user.full_name}
                      </Typography>
                    )}
                  </Box>
                </TableCell>

                {/* Drink type (hidden on mobile) */}
                {!isMobile && (
                  <TableCell>
                    <Chip
                      label={getDrinkTypeLabel(drink.alcohol_percentage)}
                      color={getDrinkTypeColor(drink.alcohol_percentage)}
                      size="small"
                    />
                  </TableCell>
                )}

                {/* Volume */}
                <TableCell align="right">
                  <Typography variant="body2" fontWeight="medium">
                    {drink.volume_ml} ml
                  </Typography>
                </TableCell>

                {/* Alcohol % (hidden on mobile) */}
                {!isMobile && (
                  <TableCell align="right">
                    <Typography variant="body2">
                      {drink.alcohol_percentage.toFixed(1)}%
                    </Typography>
                  </TableCell>
                )}

                {/* Flags */}
                <TableCell align="center">
                  <Box
                    sx={{
                      display: 'flex',
                      gap: 0.5,
                      justifyContent: 'center',
                      flexWrap: 'wrap',
                    }}
                  >
                    {drink.rapid_consumption && (
                      <Chip
                        icon={<Speed />}
                        label={isMobile ? '' : 'Rask'}
                        size="small"
                        color="warning"
                        variant="outlined"
                        title="Rask konsumering"
                      />
                    )}
                    {drink.food_consumed && (
                      <Chip
                        icon={<Fastfood />}
                        label={isMobile ? '' : 'Mat'}
                        size="small"
                        color="success"
                        variant="outlined"
                        title="Med mat"
                      />
                    )}
                    {!drink.rapid_consumption && !drink.food_consumed && (
                      <Typography variant="body2" color="text.secondary">
                        -
                      </Typography>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <TablePagination
        component="div"
        count={drinks.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[10, 25, 50, 100]}
        labelRowsPerPage="Rader per side:"
        labelDisplayedRows={({ from, to, count }) =>
          `${from}-${to} av ${count !== -1 ? count : `mer enn ${to}`}`
        }
      />
    </Paper>
  );
}
