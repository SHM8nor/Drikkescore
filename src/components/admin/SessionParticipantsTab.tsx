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
  TableSortLabel,
  useMediaQuery,
  useTheme,
  Chip,
} from '@mui/material';
import { visuallyHidden } from '@mui/utils';
import type { SessionDetailParticipant } from '../../api/sessionDetails';

interface SessionParticipantsTabProps {
  participants: SessionDetailParticipant[];
}

type SortField = 'displayName' | 'fullName' | 'joinedAt' | 'drinks' | 'currentBAC' | 'peakBAC';
type SortOrder = 'asc' | 'desc';

/**
 * Session Participants Tab - Table of all participants with BAC data
 *
 * Features:
 * - Sortable columns
 * - Avatar display
 * - Shows both display_name and full_name for admin visibility
 * - Current and peak BAC
 * - Drink count
 * - Responsive (hides columns on mobile)
 */
export default function SessionParticipantsTab({
  participants,
}: SessionParticipantsTabProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [sortField, setSortField] = useState<SortField>('currentBAC');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Handle sort
  const handleSort = (field: SortField) => {
    const isAsc = sortField === field && sortOrder === 'asc';
    setSortOrder(isAsc ? 'desc' : 'asc');
    setSortField(field);
  };

  // Sort participants
  const sortedParticipants = useMemo(() => {
    const sorted = [...participants];
    sorted.sort((a, b) => {
      let aValue: number | string = 0;
      let bValue: number | string = 0;

      switch (sortField) {
        case 'displayName':
          aValue = a.profile.display_name.toLowerCase();
          bValue = b.profile.display_name.toLowerCase();
          break;
        case 'fullName':
          aValue = a.profile.full_name.toLowerCase();
          bValue = b.profile.full_name.toLowerCase();
          break;
        case 'joinedAt':
          aValue = new Date(a.joinedAt).getTime();
          bValue = new Date(b.joinedAt).getTime();
          break;
        case 'drinks':
          aValue = a.drinkCount;
          bValue = b.drinkCount;
          break;
        case 'currentBAC':
          aValue = a.currentBAC;
          bValue = b.currentBAC;
          break;
        case 'peakBAC':
          aValue = a.peakBAC;
          bValue = b.peakBAC;
          break;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return sortOrder === 'asc' ? (aValue as number) - (bValue as number) : (bValue as number) - (aValue as number);
    });

    return sorted;
  }, [participants, sortField, sortOrder]);

  // Format date
  const formatDateTime = (dateString: string) => {
    return new Intl.DateTimeFormat('nb-NO', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(dateString));
  };

  // Get BAC color
  const getBACColor = (bac: number): 'default' | 'warning' | 'error' => {
    if (bac >= 0.8) return 'error';
    if (bac >= 0.5) return 'warning';
    return 'default';
  };

  if (participants.length === 0) {
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
          Ingen deltakere i denne sesjonen
        </Typography>
      </Box>
    );
  }

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>
              <TableSortLabel
                active={sortField === 'displayName'}
                direction={sortField === 'displayName' ? sortOrder : 'asc'}
                onClick={() => handleSort('displayName')}
              >
                Visningsnavn
                {sortField === 'displayName' ? (
                  <Box component="span" sx={visuallyHidden}>
                    {sortOrder === 'desc' ? 'sortert synkende' : 'sortert stigende'}
                  </Box>
                ) : null}
              </TableSortLabel>
            </TableCell>

            {!isMobile && (
              <TableCell>
                <TableSortLabel
                  active={sortField === 'fullName'}
                  direction={sortField === 'fullName' ? sortOrder : 'asc'}
                  onClick={() => handleSort('fullName')}
                >
                  Fullt navn
                  {sortField === 'fullName' ? (
                    <Box component="span" sx={visuallyHidden}>
                      {sortOrder === 'desc' ? 'sortert synkende' : 'sortert stigende'}
                    </Box>
                  ) : null}
                </TableSortLabel>
              </TableCell>
            )}

            {!isMobile && (
              <TableCell>
                <TableSortLabel
                  active={sortField === 'joinedAt'}
                  direction={sortField === 'joinedAt' ? sortOrder : 'asc'}
                  onClick={() => handleSort('joinedAt')}
                >
                  Ble med
                  {sortField === 'joinedAt' ? (
                    <Box component="span" sx={visuallyHidden}>
                      {sortOrder === 'desc' ? 'sortert synkende' : 'sortert stigende'}
                    </Box>
                  ) : null}
                </TableSortLabel>
              </TableCell>
            )}

            <TableCell align="right">
              <TableSortLabel
                active={sortField === 'drinks'}
                direction={sortField === 'drinks' ? sortOrder : 'asc'}
                onClick={() => handleSort('drinks')}
              >
                Drinker
                {sortField === 'drinks' ? (
                  <Box component="span" sx={visuallyHidden}>
                    {sortOrder === 'desc' ? 'sortert synkende' : 'sortert stigende'}
                  </Box>
                ) : null}
              </TableSortLabel>
            </TableCell>

            <TableCell align="right">
              <TableSortLabel
                active={sortField === 'currentBAC'}
                direction={sortField === 'currentBAC' ? sortOrder : 'asc'}
                onClick={() => handleSort('currentBAC')}
              >
                Nåværende BAC
                {sortField === 'currentBAC' ? (
                  <Box component="span" sx={visuallyHidden}>
                    {sortOrder === 'desc' ? 'sortert synkende' : 'sortert stigende'}
                  </Box>
                ) : null}
              </TableSortLabel>
            </TableCell>

            {!isMobile && (
              <TableCell align="right">
                <TableSortLabel
                  active={sortField === 'peakBAC'}
                  direction={sortField === 'peakBAC' ? sortOrder : 'asc'}
                  onClick={() => handleSort('peakBAC')}
                >
                  Topp BAC
                  {sortField === 'peakBAC' ? (
                    <Box component="span" sx={visuallyHidden}>
                      {sortOrder === 'desc' ? 'sortert synkende' : 'sortert stigende'}
                    </Box>
                  ) : null}
                </TableSortLabel>
              </TableCell>
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedParticipants.map((participant) => (
            <TableRow
              key={participant.userId}
              hover
              sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
            >
              {/* Display name with avatar */}
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar
                    src={participant.profile.avatar_url}
                    alt={participant.profile.display_name}
                    sx={{ width: 32, height: 32 }}
                  >
                    {participant.profile.display_name.charAt(0).toUpperCase()}
                  </Avatar>
                  <Typography variant="body2">
                    {participant.profile.display_name}
                  </Typography>
                </Box>
              </TableCell>

              {/* Full name (hidden on mobile) */}
              {!isMobile && (
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {participant.profile.full_name}
                  </Typography>
                </TableCell>
              )}

              {/* Joined at (hidden on mobile) */}
              {!isMobile && (
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {formatDateTime(participant.joinedAt)}
                  </Typography>
                </TableCell>
              )}

              {/* Drink count */}
              <TableCell align="right">
                <Typography variant="body2" fontWeight="medium">
                  {participant.drinkCount}
                </Typography>
              </TableCell>

              {/* Current BAC */}
              <TableCell align="right">
                <Chip
                  label={`${participant.currentBAC.toFixed(2)}‰`}
                  color={getBACColor(participant.currentBAC)}
                  size="small"
                />
              </TableCell>

              {/* Peak BAC (hidden on mobile) */}
              {!isMobile && (
                <TableCell align="right">
                  <Chip
                    label={`${participant.peakBAC.toFixed(2)}‰`}
                    color={getBACColor(participant.peakBAC)}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
