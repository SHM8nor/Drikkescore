import { useState } from 'react';
import {
  Box,
  Stack,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  InputAdornment,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  FileDownload as FileDownloadIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import type { AdminSession } from '../../hooks/useAdminSessions';

interface AdminActionsToolbarProps {
  selectedSessions: AdminSession[];
  onBulkDelete: () => void;
  onBulkEdit: () => void;
  onSearch: (query: string) => void;
  onStatusFilter: (status: 'all' | 'active' | 'ended') => void;
  onExport: () => void;
  onRefresh: () => void;
}

/**
 * Toolbar component for admin session management
 * Features:
 * - Search by session name or code
 * - Filter by status (all/active/ended)
 * - Bulk operations (delete, edit)
 * - Export to CSV
 */
export default function AdminActionsToolbar({
  selectedSessions,
  onBulkDelete,
  onBulkEdit,
  onSearch,
  onStatusFilter,
  onExport,
  onRefresh,
}: AdminActionsToolbarProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'ended'>('all');

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    setSearchQuery(query);
    onSearch(query);
  };

  const handleStatusFilterChange = (event: SelectChangeEvent) => {
    const status = event.target.value as 'all' | 'active' | 'ended';
    setStatusFilter(status);
    onStatusFilter(status);
  };

  const hasSelection = selectedSessions.length > 0;

  return (
    <Box sx={{ mb: 3 }}>
      <Stack
        direction={isMobile ? 'column' : 'row'}
        spacing={2}
        sx={{
          alignItems: isMobile ? 'stretch' : 'center',
          mb: 2,
        }}
      >
        {/* Search Field */}
        <TextField
          size="small"
          placeholder="Søk etter sesjonsnavn eller kode..."
          value={searchQuery}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
          sx={{ flexGrow: 1, minWidth: isMobile ? 'auto' : 300 }}
        />

        {/* Status Filter */}
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel id="status-filter-label">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <FilterListIcon fontSize="small" />
              Status
            </Box>
          </InputLabel>
          <Select
            labelId="status-filter-label"
            value={statusFilter}
            label="Status"
            onChange={handleStatusFilterChange}
          >
            <MenuItem value="all">Alle</MenuItem>
            <MenuItem value="active">Aktive</MenuItem>
            <MenuItem value="ended">Avsluttede</MenuItem>
          </Select>
        </FormControl>

        {/* Action Buttons */}
        <Stack
          direction={isMobile ? 'column' : 'row'}
          spacing={1}
          sx={{ ml: isMobile ? 0 : 'auto' }}
        >
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={onRefresh}
          >
            Oppdater
          </Button>

          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={onBulkEdit}
            disabled={!hasSelection}
          >
            Rediger
          </Button>

          <Button
            variant="outlined"
            startIcon={<DeleteIcon />}
            onClick={onBulkDelete}
            disabled={!hasSelection}
            color="error"
            sx={{
              '&.Mui-disabled': {
                borderColor: 'rgba(0, 0, 0, 0.12)',
              },
            }}
          >
            Slett
          </Button>

          <Button
            variant="contained"
            startIcon={<FileDownloadIcon />}
            onClick={onExport}
            disabled={!hasSelection}
          >
            Eksporter
          </Button>
        </Stack>
      </Stack>

      {/* Selection Info */}
      {hasSelection && (
        <Typography variant="body2" color="primary" sx={{ mt: 1 }}>
          {selectedSessions.length} sesjon(er) valgt
        </Typography>
      )}
    </Box>
  );
}
