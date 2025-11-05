/**
 * FriendsPage
 *
 * Main page for the friend system with tabbed interface.
 * Features gradient background, glass-morphism tabs, and mobile-optimized UX.
 */

import { useState, useRef, type TouchEvent } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Badge,
  Alert,
  Fade,
} from '@mui/material';
import {
  People as PeopleIcon,
  PersonAdd as PersonAddIcon,
  Send as SendIcon,
  PersonSearch as PersonSearchIcon,
} from '@mui/icons-material';
import { PageContainer } from '../components/layout/PageContainer';
import { useFriends } from '../hooks/useFriends';
import PendingRequests from '../components/friends/PendingRequests';
import SentRequests from '../components/friends/SentRequests';
import { FriendsList } from '../components/friends/FriendsList';
import { AddFriend } from '../components/friends/AddFriend';

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
      id={`friends-tabpanel-${index}`}
      aria-labelledby={`friends-tab-${index}`}
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
    id: `friends-tab-${index}`,
    'aria-controls': `friends-tabpanel-${index}`,
  };
}

export default function FriendsPage() {
  const [activeTab, setActiveTab] = useState(0);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  const {
    friends,
    pendingRequests,
    sentRequests,
    pendingCount,
    sentCount,
    friendCount,
    error,
    clearError,
    loading,
    unfriend,
  } = useFriends();

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
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
      if (diff > 0 && activeTab < 3) {
        // Swipe left - next tab
        setActiveTab(activeTab + 1);
      } else if (diff < 0 && activeTab > 0) {
        // Swipe right - previous tab
        setActiveTab(activeTab - 1);
      }
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    await unfriend(friendId);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, var(--vanilla) 0%, var(--vanilla-light) 50%, var(--xanthous-bg) 100%)',
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
                background: 'linear-gradient(135deg, var(--prussian-blue) 0%, var(--prussian-blue-light) 50%, var(--orange-wheel) 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontSize: { xs: '1.75rem', sm: '2.125rem' },
              }}
            >
              Venner
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: 'var(--color-text-secondary)',
                fontSize: { xs: '0.875rem', sm: '1rem' },
              }}
            >
              Administrer venner, se forespørsler og legg til nye venner
            </Typography>
          </Box>

          {/* Error Alert */}
          {error && (
            <Alert
              severity="error"
              onClose={clearError}
              sx={{ mb: 3 }}
            >
              {error}
            </Alert>
          )}

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
                      background: 'linear-gradient(180deg, rgba(0, 48, 73, 0.05) 0%, transparent 100%)',
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
                  icon={<PeopleIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />}
                  label={`Mine venner (${friendCount})`}
                  iconPosition="start"
                  {...a11yProps(0)}
                />
                <Tab
                  icon={
                    <Badge
                      badgeContent={pendingCount}
                      color="error"
                      sx={{
                        '& .MuiBadge-badge': {
                          right: -8,
                          top: 2,
                          fontSize: '0.65rem',
                        },
                      }}
                    >
                      <PersonAddIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
                    </Badge>
                  }
                  label="Forespørsler"
                  iconPosition="start"
                  {...a11yProps(1)}
                />
                <Tab
                  icon={
                    <Badge
                      badgeContent={sentCount}
                      color="warning"
                      sx={{
                        '& .MuiBadge-badge': {
                          right: -8,
                          top: 2,
                          fontSize: '0.65rem',
                        },
                      }}
                    >
                      <SendIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
                    </Badge>
                  }
                  label="Sendt"
                  iconPosition="start"
                  {...a11yProps(2)}
                />
                <Tab
                  icon={<PersonSearchIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />}
                  label="Legg til"
                  iconPosition="start"
                  {...a11yProps(3)}
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
              {/* Tab 0: Friends List */}
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
                    Mine venner
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      mb: 3,
                      color: 'var(--color-text-muted)',
                      fontSize: { xs: '0.8rem', sm: '0.875rem' },
                    }}
                  >
                    Du har {friendCount} {friendCount === 1 ? 'venn' : 'venner'}
                  </Typography>
                  <FriendsList
                    friends={friends}
                    loading={loading}
                    onRemoveFriend={handleRemoveFriend}
                  />
                </Box>
              </TabPanel>

              {/* Tab 1: Pending Requests */}
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
                    Ventende forespørsler
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      mb: 3,
                      color: 'var(--color-text-muted)',
                      fontSize: { xs: '0.8rem', sm: '0.875rem' },
                    }}
                  >
                    Du har {pendingCount} {pendingCount === 1 ? 'forespørsel' : 'forespørsler'} som venter på svar
                  </Typography>
                  <PendingRequests
                    requests={pendingRequests}
                    isLoading={loading}
                  />
                </Box>
              </TabPanel>

              {/* Tab 2: Sent Requests */}
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
                    Sendte forespørsler
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      mb: 3,
                      color: 'var(--color-text-muted)',
                      fontSize: { xs: '0.8rem', sm: '0.875rem' },
                    }}
                  >
                    Du har sendt {sentCount} {sentCount === 1 ? 'forespørsel' : 'forespørsler'} som venter på svar
                  </Typography>
                  <SentRequests
                    requests={sentRequests}
                    isLoading={loading}
                  />
                </Box>
              </TabPanel>

              {/* Tab 3: Add Friend - Search Users */}
              <TabPanel value={activeTab} index={3}>
                <Box sx={{ px: { xs: 2, sm: 3 } }}>
                  <AddFriend />
                </Box>
              </TabPanel>
            </Box>
          </Box>
        </Box>
      </PageContainer>
    </Box>
  );
}
