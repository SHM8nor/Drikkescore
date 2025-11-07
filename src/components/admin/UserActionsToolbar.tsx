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
  AdminPanelSettings as AdminPanelSettingsIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import type { AdminUser } from '../../api/adminUsers';

interface UserActionsToolbarProps {
  selectedUsers: AdminUser[];
  onBulkRoleChange: () => void;
  onSearch: (query: string) => void;
  onRoleFilter: (role: 'all' | 'admin' | 'user') => void;
  onRefresh: () => void;
}

/**
 * Toolbar component for admin user management
 * Features:
 * - Search by name or email
 * - Filter by role (all/admin/user)
 * - Bulk role change operation
 * - Refresh button
 * - Selection count display
 */
export default function UserActionsToolbar({
  selectedUsers,
  onBulkRoleChange,
  onSearch,
  onRoleFilter,
  onRefresh,
}: UserActionsToolbarProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all');

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    setSearchQuery(query);
    onSearch(query);
  };

  const handleRoleFilterChange = (event: SelectChangeEvent) => {
    const role = event.target.value as 'all' | 'admin' | 'user';
    setRoleFilter(role);
    onRoleFilter(role);
  };

  const hasSelection = selectedUsers.length > 0;

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
          placeholder="Søk etter navn eller e-post..."
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

        {/* Role Filter */}
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel id="role-filter-label">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <FilterListIcon fontSize="small" />
              Rolle
            </Box>
          </InputLabel>
          <Select
            labelId="role-filter-label"
            value={roleFilter}
            label="Rolle"
            onChange={handleRoleFilterChange}
          >
            <MenuItem value="all">Alle</MenuItem>
            <MenuItem value="admin">Administrator</MenuItem>
            <MenuItem value="user">Bruker</MenuItem>
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
            variant="contained"
            startIcon={<AdminPanelSettingsIcon />}
            onClick={onBulkRoleChange}
            disabled={!hasSelection}
          >
            Endre rolle
          </Button>
        </Stack>
      </Stack>

      {/* Selection Info */}
      {hasSelection && (
        <Typography variant="body2" color="primary" sx={{ mt: 1 }}>
          {selectedUsers.length} bruker(e) valgt
        </Typography>
      )}
    </Box>
  );
}
