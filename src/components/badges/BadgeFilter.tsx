/**
 * BadgeFilter Component
 *
 * Filter controls for filtering badges by category and tier.
 * Features:
 * - Category dropdown (session, global, social, milestone, special)
 * - Tier dropdown (bronze, silver, gold, platinum, legendary)
 * - Active filter chips with individual clear buttons
 * - Clear all filters button
 * - Norwegian labels throughout
 */

import { Box, FormControl, InputLabel, Select, MenuItem, Button, Chip } from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';
import type { BadgeCategory, BadgeTier } from '../../types/badges';

interface BadgeFilterProps {
  category: BadgeCategory | null;
  tier: BadgeTier | null;
  onCategoryChange: (category: BadgeCategory | null) => void;
  onTierChange: (tier: BadgeTier | null) => void;
  onClearFilters: () => void;
}

// Norwegian labels for categories
const CATEGORY_LABELS: Record<BadgeCategory, string> = {
  session: 'Økt',
  global: 'Global',
  social: 'Sosial',
  milestone: 'Milepæl',
  special: 'Spesiell',
};

// Norwegian labels for tiers
const TIER_LABELS: Record<BadgeTier, string> = {
  bronze: 'Bronse',
  silver: 'Sølv',
  gold: 'Gull',
  platinum: 'Platina',
  legendary: 'Legendarisk',
};

export function BadgeFilter({
  category,
  tier,
  onCategoryChange,
  onTierChange,
  onClearFilters,
}: BadgeFilterProps) {
  const hasActiveFilters = category !== null || tier !== null;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        gap: 2,
        alignItems: { xs: 'stretch', sm: 'center' },
        mb: 3,
        p: 2,
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
        backdropFilter: 'blur(10px)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid rgba(0, 48, 73, 0.1)',
      }}
    >
      {/* Filter Icon */}
      <Box
        sx={{
          display: { xs: 'none', sm: 'flex' },
          alignItems: 'center',
          color: 'var(--prussian-blue)',
        }}
      >
        <FilterListIcon />
      </Box>

      {/* Category Filter */}
      <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 180 } }}>
        <InputLabel id="badge-category-filter-label">Kategori</InputLabel>
        <Select
          labelId="badge-category-filter-label"
          id="badge-category-filter"
          value={category || ''}
          label="Kategori"
          onChange={(e) => onCategoryChange((e.target.value as BadgeCategory) || null)}
          sx={{
            backgroundColor: 'white',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: 'rgba(0, 48, 73, 0.2)',
            },
          }}
        >
          <MenuItem value="">
            <em>Alle kategorier</em>
          </MenuItem>
          {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
            <MenuItem key={value} value={value}>
              {label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Tier Filter */}
      <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 180 } }}>
        <InputLabel id="badge-tier-filter-label">Nivå</InputLabel>
        <Select
          labelId="badge-tier-filter-label"
          id="badge-tier-filter"
          value={tier || ''}
          label="Nivå"
          onChange={(e) => onTierChange((e.target.value as BadgeTier) || null)}
          sx={{
            backgroundColor: 'white',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: 'rgba(0, 48, 73, 0.2)',
            },
          }}
        >
          <MenuItem value="">
            <em>Alle nivåer</em>
          </MenuItem>
          {Object.entries(TIER_LABELS).map(([value, label]) => (
            <MenuItem key={value} value={value}>
              {label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <Box
          sx={{
            display: 'flex',
            gap: 1,
            alignItems: 'center',
            flexWrap: 'wrap',
            flex: 1,
          }}
        >
          {category && (
            <Chip
              label={`Kategori: ${CATEGORY_LABELS[category]}`}
              onDelete={() => onCategoryChange(null)}
              size="small"
              sx={{
                backgroundColor: 'var(--prussian-blue-bg)',
                color: 'var(--prussian-blue)',
                '& .MuiChip-deleteIcon': {
                  color: 'var(--prussian-blue)',
                  '&:hover': {
                    color: 'var(--prussian-blue-dark)',
                  },
                },
              }}
            />
          )}
          {tier && (
            <Chip
              label={`Nivå: ${TIER_LABELS[tier]}`}
              onDelete={() => onTierChange(null)}
              size="small"
              sx={{
                backgroundColor: 'var(--orange-wheel-bg)',
                color: 'var(--orange-wheel)',
                '& .MuiChip-deleteIcon': {
                  color: 'var(--orange-wheel)',
                  '&:hover': {
                    color: 'var(--orange-wheel-dark)',
                  },
                },
              }}
            />
          )}
        </Box>
      )}

      {/* Clear All Button */}
      {hasActiveFilters && (
        <Button
          variant="outlined"
          size="small"
          startIcon={<ClearIcon />}
          onClick={onClearFilters}
          sx={{
            minWidth: { xs: '100%', sm: 'auto' },
            borderColor: 'var(--color-border)',
            color: 'var(--color-text-secondary)',
            '&:hover': {
              borderColor: 'var(--prussian-blue)',
              backgroundColor: 'var(--prussian-blue-bg)',
              color: 'var(--prussian-blue)',
            },
          }}
        >
          Nullstill filter
        </Button>
      )}
    </Box>
  );
}
