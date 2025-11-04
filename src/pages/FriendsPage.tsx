/**
 * FriendsPage
 *
 * Main page for the friend system with tabbed interface.
 * Integrates friend list, pending requests, sent requests, add friend, and active friends.
 */

import { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Badge,
  Alert,
  Paper,
  Fade,
} from '@mui/material';
import {
  People as PeopleIcon,
  PersonAdd as PersonAddIcon,
  Send as SendIcon,
  SportsEsports as ActiveIcon,
  PersonSearch as PersonSearchIcon,
} from '@mui/icons-material';
import { useFriends } from '../hooks/useFriends';
import PendingRequests from '../components/friends/PendingRequests';
import SentRequests from '../components/friends/SentRequests';
import FriendsExample from '../components/friends/FriendsExample';
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
    >
      {value === index && (
        <Fade in timeout={300}>
          <Box sx={{ py: 3 }}>{children}</Box>
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
  const { pendingCount, sentCount, friendCount, error, clearError, loading } = useFriends();

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          sx={{
            fontWeight: 700,
            background: 'linear-gradient(45deg, #003049 30%, #004d73 90%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Venner
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Administrer venner, se forespørsler og finn hvem som drikker seg dritings
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

      {/* Tabs Navigation */}
      <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            backgroundColor: 'background.paper',
            '& .MuiTab-root': {
              minHeight: 72,
              fontSize: '0.95rem',
              fontWeight: 500,
            },
          }}
        >
          <Tab
            icon={<PeopleIcon />}
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
                  },
                }}
              >
                <PersonAddIcon />
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
                  },
                }}
              >
                <SendIcon />
              </Badge>
            }
            label="Sendt"
            iconPosition="start"
            {...a11yProps(2)}
          />
          <Tab
            icon={<PersonSearchIcon />}
            label="Legg til"
            iconPosition="start"
            {...a11yProps(3)}
          />
          <Tab
            icon={<ActiveIcon />}
            label="Drikker seg dritings"
            iconPosition="start"
            {...a11yProps(4)}
          />
        </Tabs>

        {/* Tab Panels */}
        <Box sx={{ minHeight: 400 }}>
          {/* Tab 0: All Friends (Using existing FriendsExample component) */}
          <TabPanel value={activeTab} index={0}>
            <FriendsExample />
          </TabPanel>

          {/* Tab 1: Pending Requests */}
          <TabPanel value={activeTab} index={1}>
            <Box sx={{ px: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                Ventende forespørsler
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Du har {pendingCount} {pendingCount === 1 ? 'forespørsel' : 'forespørsler'} som venter på svar
              </Typography>
              <PendingRequests isLoading={loading} />
            </Box>
          </TabPanel>

          {/* Tab 2: Sent Requests */}
          <TabPanel value={activeTab} index={2}>
            <Box sx={{ px: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                Sendte forespørsler
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Du har sendt {sentCount} {sentCount === 1 ? 'forespørsel' : 'forespørsler'} som venter på svar
              </Typography>
              <SentRequests isLoading={loading} />
            </Box>
          </TabPanel>

          {/* Tab 3: Add Friend - Search Users */}
          <TabPanel value={activeTab} index={3}>
            <Box sx={{ px: 2 }}>
              <AddFriend />
            </Box>
          </TabPanel>

          {/* Tab 4: Active Friends - Reuse FriendsExample which has this tab */}
          <TabPanel value={activeTab} index={4}>
            <Box sx={{ px: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                Venner som drikker seg dritings
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Se hvilke venner som er aktive i økter akkurat nå
              </Typography>
              {/* This will be handled by the FriendsExample component's active tab */}
              <Alert severity="info">
                Aktive venner vises i "Mine venner" fanen. Denne funksjonaliteten er tilgjengelig der.
              </Alert>
            </Box>
          </TabPanel>
        </Box>
      </Paper>
    </Container>
  );
}
