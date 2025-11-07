import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Tabs,
  Tab,
  useMediaQuery,
  useTheme,
  Alert,
  CircularProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useSessionDetail } from '../../hooks/useSessionDetail';
import { useSessionBACData } from '../../hooks/useSessionBACData';
import SessionOverviewTab from './SessionOverviewTab';
import SessionParticipantsTab from './SessionParticipantsTab';
import SessionDrinkLogTab from './SessionDrinkLogTab';
import SessionBACChartTab from './SessionBACChartTab';

interface SessionDetailDialogProps {
  sessionId: string | null;
  open: boolean;
  onClose: () => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index, ...other }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`session-tabpanel-${index}`}
      aria-labelledby={`session-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `session-tab-${index}`,
    'aria-controls': `session-tabpanel-${index}`,
  };
}

/**
 * Session Detail Dialog - Admin Deep Dive UI
 *
 * Full-screen dialog (on mobile) with tabbed interface for viewing:
 * - Session overview with stats
 * - Participant list with BAC data
 * - Complete drink log timeline
 * - BAC chart over time
 *
 * Features real-time updates via hooks and responsive design.
 */
export default function SessionDetailDialog({
  sessionId,
  open,
  onClose,
}: SessionDetailDialogProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [currentTab, setCurrentTab] = useState(0);

  const {
    session,
    participants,
    drinks,
    leaderboard,
    loading,
    error,
  } = useSessionDetail(sessionId || '');

  const {
    bacData,
    loading: bacLoading,
    error: bacError,
  } = useSessionBACData(sessionId || '');

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleClose = () => {
    setCurrentTab(0); // Reset to first tab
    onClose();
  };

  if (!sessionId) return null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="lg"
      fullScreen={fullScreen}
      aria-labelledby="session-detail-dialog-title"
    >
      <DialogTitle
        id="session-detail-dialog-title"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 0,
        }}
      >
        <Box>
          {loading ? 'Laster...' : session?.session_name || 'Sesjonsdetaljer'}
        </Box>
        <IconButton
          edge="end"
          color="inherit"
          onClick={handleClose}
          aria-label="lukk"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          aria-label="sesjonsdetaljer tabs"
          variant={fullScreen ? 'scrollable' : 'standard'}
          scrollButtons={fullScreen ? 'auto' : false}
        >
          <Tab label="Oversikt" {...a11yProps(0)} />
          <Tab label="Deltakere" {...a11yProps(1)} />
          <Tab label="Drikkelog" {...a11yProps(2)} />
          <Tab label="BAC-graf" {...a11yProps(3)} />
        </Tabs>
      </Box>

      <DialogContent>
        {/* Loading state */}
        {loading && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: 300,
            }}
          >
            <CircularProgress />
          </Box>
        )}

        {/* Error state */}
        {!loading && error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            Kunne ikke laste sesjonsdetaljer: {error}
          </Alert>
        )}

        {/* Tabs content */}
        {!loading && !error && session && (
          <>
            <TabPanel value={currentTab} index={0}>
              <SessionOverviewTab
                session={session}
                participants={participants}
                drinks={drinks}
                leaderboard={leaderboard}
              />
            </TabPanel>

            <TabPanel value={currentTab} index={1}>
              <SessionParticipantsTab participants={participants} />
            </TabPanel>

            <TabPanel value={currentTab} index={2}>
              <SessionDrinkLogTab drinks={drinks} />
            </TabPanel>

            <TabPanel value={currentTab} index={3}>
              {bacError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  Kunne ikke laste BAC-data: {bacError}
                </Alert>
              )}
              <SessionBACChartTab
                bacData={bacData}
                loading={bacLoading}
                session={session}
              />
            </TabPanel>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
