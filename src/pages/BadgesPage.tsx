/**
 * BadgesPage
 *
 * Main page for the badge system with tabbed interface.
 * Features:
 * - Gradient background matching design system
 * - Stats overview (total earned, total points, progress %)
 * - Glass-morphism tab container
 * - 3 tabs: All badges, Earned badges, In-progress badges
 * - Filter controls for category and tier
 * - Badge grid with detail dialog
 * - Loading skeletons and empty states
 * - Responsive mobile-first design
 */

import { useState, useMemo, useRef, type TouchEvent } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Badge as MuiBadge,
  CircularProgress,
  Alert,
  Fade,
  Grid,
  Paper,
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  TrendingUp as ProgressIcon,
  StarBorder as AllBadgesIcon,
} from '@mui/icons-material';
import { PageContainer } from '../components/layout/PageContainer';
import { BadgeGrid } from '../components/badges/BadgeGrid';
import { BadgeFilter } from '../components/badges/BadgeFilter';
import { BadgeDetailDialog } from '../components/badges/BadgeDetailDialog';
import {
  usePublicBadges,
  useUserBadges,
  useBadgeProgress,
  useUserBadgeStats,
} from '../hooks/useBadges';
import type { Badge, BadgeCategory, BadgeTier, BadgeWithProgress } from '../types/badges';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`badges-tabpanel-${index}`}
      aria-labelledby={`badges-tab-${index}`}
      style={{
        width: '100%',
      }}
    >
      {value === index && (
        <Fade in timeout={300}>
          <Box sx={{ py: { xs: 2, sm: 3 } }}>{children}</Box>
        </Fade>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `badges-tab-${index}`,
    'aria-controls': `badges-tabpanel-${index}`,
  };
}

export default function BadgesPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [filterCategory, setFilterCategory] = useState<BadgeCategory | null>(null);
  const [filterTier, setFilterTier] = useState<BadgeTier | null>(null);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  // Fetch data - using usePublicBadges instead of useActiveBadges to exclude special badges
  const { data: publicBadges, isLoading: badgesLoading } = usePublicBadges();
  const { data: userBadges, isLoading: userBadgesLoading } = useUserBadges();
  const { data: badgeProgress, isLoading: progressLoading } = useBadgeProgress();
  const { data: stats, isLoading: statsLoading } = useUserBadgeStats();

  const loading = badgesLoading || userBadgesLoading || progressLoading || statsLoading;

  // Combine badges with user progress
  const badgesWithProgress: BadgeWithProgress[] = useMemo(() => {
    if (!publicBadges) return [];

    return publicBadges.map((badge) => {
      const earned = userBadges?.find((ub) => ub.badge_id === badge.id);
      const progress = badgeProgress?.find((bp) => bp.badge_id === badge.id);

      return {
        ...badge,
        earned,
        progress,
        isLocked: !earned,
        progressPercentage: progress
          ? Math.min(100, Math.round((progress.current_value / progress.target_value) * 100))
          : 0,
      };
    });
  }, [publicBadges, userBadges, badgeProgress]);

  // Filter badges by tab
  const filteredBadges = useMemo(() => {
    let filtered = [...badgesWithProgress];

    // Tab filtering
    if (activeTab === 1) {
      // Earned badges only
      filtered = filtered.filter((b) => !b.isLocked);
    } else if (activeTab === 2) {
      // In-progress badges only (has progress but not earned)
      filtered = filtered.filter((b) => b.isLocked && b.progress);
      // Sort by progress percentage descending
      filtered.sort((a, b) => b.progressPercentage - a.progressPercentage);
    }

    // Category filter
    if (filterCategory) {
      filtered = filtered.filter((b) => b.category === filterCategory);
    }

    // Tier filter
    if (filterTier) {
      filtered = filtered.filter((b) => b.tier === filterTier);
    }

    return filtered;
  }, [badgesWithProgress, activeTab, filterCategory, filterTier]);

  // Count badges for tabs
  const earnedCount = badgesWithProgress.filter((b) => !b.isLocked).length;
  const inProgressCount = badgesWithProgress.filter((b) => b.isLocked && b.progress).length;

  // Calculate stats
  const totalBadges = publicBadges?.length || 0;
  const totalEarned = stats?.total_earned || 0;
  const totalPoints = stats?.total_points || 0;
  const progressPercentage =
    totalBadges > 0 ? Math.round((totalEarned / totalBadges) * 100) : 0;

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleBadgeClick = (badge: Badge) => {
    setSelectedBadge(badge);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    // Small delay before clearing selected badge to allow dialog to close smoothly
    setTimeout(() => setSelectedBadge(null), 200);
  };

  const handleClearFilters = () => {
    setFilterCategory(null);
    setFilterTier(null);
  };

  // Touch swipe handlers for mobile
  const handleTouchStart = (e: TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const swipeThreshold = 50;
    const diff = touchStartX.current - touchEndX.current;

    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0 && activeTab < 2) {
        // Swipe left - next tab
        setActiveTab(activeTab + 1);
      } else if (diff < 0 && activeTab > 0) {
        // Swipe right - previous tab
        setActiveTab(activeTab - 1);
      }
    }
  };

  // Get selected badge's user data for dialog
  const selectedUserBadge = selectedBadge
    ? userBadges?.find((ub) => ub.badge_id === selectedBadge.id)
    : undefined;
  const selectedProgress = selectedBadge
    ? badgeProgress?.find((bp) => bp.badge_id === selectedBadge.id)
    : undefined;

  if (loading && !publicBadges) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background:
            'linear-gradient(135deg, var(--vanilla) 0%, var(--vanilla-light) 50%, var(--xanthous-bg) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background:
          'linear-gradient(135deg, var(--vanilla) 0%, var(--vanilla-light) 50%, var(--xanthous-bg) 100%)',
        pb: 4,
      }}
    >
      <PageContainer>
        <Box sx={{ py: { xs: 2, sm: 4 } }}>
          {/* Header */}
          <Box sx={{ mb: { xs: 2, sm: 4 } }}>
            <Typography
              variant="h4"
              component="h1"
              gutterBottom
              sx={{
                fontWeight: 700,
                color: 'var(--prussian-blue)',
                fontSize: { xs: '1.75rem', sm: '2.125rem' },
              }}
            >
              Merker
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: 'var(--color-text-secondary)',
                fontSize: { xs: '0.875rem', sm: '1rem' },
              }}
            >
              Lås opp merker ved å oppnå ulike prestasjoner og samle poeng
            </Typography>
          </Box>

          {/* Stats Overview */}
          <Grid container spacing={2} sx={{ mb: { xs: 2, sm: 4 } }}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Paper
                sx={{
                  p: 2.5,
                  textAlign: 'center',
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid rgba(0, 48, 73, 0.1)',
                }}
              >
                <TrophyIcon
                  sx={{
                    fontSize: 40,
                    color: 'var(--xanthous)',
                    mb: 1,
                  }}
                />
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 700,
                    color: 'var(--prussian-blue)',
                    mb: 0.5,
                  }}
                >
                  {totalEarned}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'var(--color-text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  Merker oppnådd
                </Typography>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <Paper
                sx={{
                  p: 2.5,
                  textAlign: 'center',
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid rgba(0, 48, 73, 0.1)',
                }}
              >
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    backgroundColor: 'var(--orange-wheel-bg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto',
                    mb: 1,
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      color: 'var(--orange-wheel)',
                    }}
                  >
                    ★
                  </Typography>
                </Box>
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 700,
                    color: 'var(--prussian-blue)',
                    mb: 0.5,
                  }}
                >
                  {totalPoints.toLocaleString('nb-NO')}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'var(--color-text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  Totalt poeng
                </Typography>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <Paper
                sx={{
                  p: 2.5,
                  textAlign: 'center',
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid rgba(0, 48, 73, 0.1)',
                }}
              >
                <ProgressIcon
                  sx={{
                    fontSize: 40,
                    color: 'var(--prussian-blue)',
                    mb: 1,
                  }}
                />
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 700,
                    color: 'var(--prussian-blue)',
                    mb: 0.5,
                  }}
                >
                  {progressPercentage}%
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'var(--color-text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  Fullført
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* Glass-morphism Tabs Container */}
          <Box
            sx={{
              background: 'rgba(255, 255, 255, 0.7)',
              backdropFilter: 'blur(10px)',
              borderRadius: { xs: 2, sm: 3 },
              border: '1px solid rgba(255, 255, 255, 0.3)',
              boxShadow: '0 8px 32px rgba(0, 48, 73, 0.1)',
              overflow: 'hidden',
            }}
          >
            {/* Tabs Navigation with Glass Effect */}
            <Box
              sx={{
                background: 'rgba(255, 255, 255, 0.5)',
                backdropFilter: 'blur(20px)',
                borderBottom: '1px solid rgba(0, 48, 73, 0.1)',
              }}
            >
              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                variant="scrollable"
                scrollButtons="auto"
                allowScrollButtonsMobile
                sx={{
                  minHeight: { xs: 56, sm: 64 },
                  '& .MuiTab-root': {
                    minHeight: { xs: 56, sm: 64 },
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    fontWeight: 600,
                    color: 'var(--color-text-secondary)',
                    textTransform: 'none',
                    transition: 'all 0.3s ease',
                    px: { xs: 2, sm: 3 },
                    '&.Mui-selected': {
                      color: 'var(--prussian-blue)',
                      background:
                        'linear-gradient(180deg, rgba(0, 48, 73, 0.05) 0%, transparent 100%)',
                    },
                  },
                  '& .MuiTabs-indicator': {
                    height: 3,
                    borderRadius: '3px 3px 0 0',
                    background: 'linear-gradient(90deg, var(--prussian-blue) 0%, var(--orange-wheel) 100%)',
                  },
                }}
              >
                <Tab
                  icon={<AllBadgesIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />}
                  label="Alle merker"
                  iconPosition="start"
                  {...a11yProps(0)}
                />
                <Tab
                  icon={
                    <MuiBadge
                      badgeContent={earnedCount}
                      color="success"
                      sx={{
                        '& .MuiBadge-badge': {
                          right: -8,
                          top: 2,
                          fontSize: '0.65rem',
                        },
                      }}
                    >
                      <TrophyIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
                    </MuiBadge>
                  }
                  label="Oppnådd"
                  iconPosition="start"
                  {...a11yProps(1)}
                />
                <Tab
                  icon={
                    <MuiBadge
                      badgeContent={inProgressCount}
                      color="warning"
                      sx={{
                        '& .MuiBadge-badge': {
                          right: -8,
                          top: 2,
                          fontSize: '0.65rem',
                        },
                      }}
                    >
                      <ProgressIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
                    </MuiBadge>
                  }
                  label="Pågående"
                  iconPosition="start"
                  {...a11yProps(2)}
                />
              </Tabs>
            </Box>

            {/* Tab Panels with Swipe Support */}
            <Box
              sx={{ minHeight: { xs: 300, sm: 400 } }}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {/* Tab 0: All Badges */}
              <TabPanel value={activeTab} index={0}>
                <Box sx={{ px: { xs: 2, sm: 3 } }}>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{
                      mb: 2,
                      fontSize: { xs: '1rem', sm: '1.25rem' },
                      fontWeight: 600,
                      color: 'var(--prussian-blue)',
                    }}
                  >
                    Alle merker
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      mb: 3,
                      color: 'var(--color-text-muted)',
                      fontSize: { xs: '0.8rem', sm: '0.875rem' },
                    }}
                  >
                    Utforsk alle tilgjengelige merker og se din fremgang
                  </Typography>

                  <BadgeFilter
                    category={filterCategory}
                    tier={filterTier}
                    onCategoryChange={setFilterCategory}
                    onTierChange={setFilterTier}
                    onClearFilters={handleClearFilters}
                  />

                  {filteredBadges.length === 0 && !loading ? (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      Ingen merker matcher de valgte filtrene. Prøv å justere filtrene dine.
                    </Alert>
                  ) : (
                    <BadgeGrid
                      badges={filteredBadges}
                      onBadgeClick={handleBadgeClick}
                      loading={loading}
                    />
                  )}
                </Box>
              </TabPanel>

              {/* Tab 1: Earned Badges */}
              <TabPanel value={activeTab} index={1}>
                <Box sx={{ px: { xs: 2, sm: 3 } }}>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{
                      mb: 2,
                      fontSize: { xs: '1rem', sm: '1.25rem' },
                      fontWeight: 600,
                      color: 'var(--prussian-blue)',
                    }}
                  >
                    Oppnådde merker
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      mb: 3,
                      color: 'var(--color-text-muted)',
                      fontSize: { xs: '0.8rem', sm: '0.875rem' },
                    }}
                  >
                    Du har oppnådd {earnedCount} av {totalBadges}{' '}
                    {totalBadges === 1 ? 'merke' : 'merker'}
                  </Typography>

                  <BadgeFilter
                    category={filterCategory}
                    tier={filterTier}
                    onCategoryChange={setFilterCategory}
                    onTierChange={setFilterTier}
                    onClearFilters={handleClearFilters}
                  />

                  {filteredBadges.length === 0 && !loading ? (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      {earnedCount === 0
                        ? 'Du har ikke oppnådd noen merker ennå. Start å delta i økter for å låse opp merker!'
                        : 'Ingen oppnådde merker matcher de valgte filtrene. Prøv å justere filtrene dine.'}
                    </Alert>
                  ) : (
                    <BadgeGrid
                      badges={filteredBadges}
                      onBadgeClick={handleBadgeClick}
                      loading={loading}
                    />
                  )}
                </Box>
              </TabPanel>

              {/* Tab 2: In-Progress Badges */}
              <TabPanel value={activeTab} index={2}>
                <Box sx={{ px: { xs: 2, sm: 3 } }}>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{
                      mb: 2,
                      fontSize: { xs: '1rem', sm: '1.25rem' },
                      fontWeight: 600,
                      color: 'var(--prussian-blue)',
                    }}
                  >
                    Pågående merker
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      mb: 3,
                      color: 'var(--color-text-muted)',
                      fontSize: { xs: '0.8rem', sm: '0.875rem' },
                    }}
                  >
                    Du har fremgang på {inProgressCount}{' '}
                    {inProgressCount === 1 ? 'merke' : 'merker'}, sortert etter fullføringsprosent
                  </Typography>

                  <BadgeFilter
                    category={filterCategory}
                    tier={filterTier}
                    onCategoryChange={setFilterCategory}
                    onTierChange={setFilterTier}
                    onClearFilters={handleClearFilters}
                  />

                  {filteredBadges.length === 0 && !loading ? (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      {inProgressCount === 0
                        ? 'Du har ingen merker under arbeid for øyeblikket. Delta i økter og nå ulike milepæler for å starte fremgang!'
                        : 'Ingen pågående merker matcher de valgte filtrene. Prøv å justere filtrene dine.'}
                    </Alert>
                  ) : (
                    <BadgeGrid
                      badges={filteredBadges}
                      onBadgeClick={handleBadgeClick}
                      loading={loading}
                    />
                  )}
                </Box>
              </TabPanel>
            </Box>
          </Box>
        </Box>
      </PageContainer>

      {/* Badge Detail Dialog */}
      <BadgeDetailDialog
        badge={selectedBadge}
        userBadge={selectedUserBadge}
        progress={selectedProgress}
        open={dialogOpen}
        onClose={handleDialogClose}
      />
    </Box>
  );
}
