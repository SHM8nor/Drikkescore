/**
 * FriendsExample Component
 *
 * Comprehensive example showing how to use the friend system API.
 * This demonstrates:
 * - Displaying friends list
 * - Managing friend requests
 * - Real-time updates
 * - Active session presence
 *
 * This is a reference implementation - adapt to your UI needs.
 */

import React, { useEffect, useState, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  IconButton,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Check as CheckIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
  Circle as CircleIcon,
} from '@mui/icons-material';

import {
  getFriends,
  getPendingRequests,
  getSentRequests,
  acceptFriendRequest,
  declineFriendRequest,
  cancelFriendRequest,
  removeFriend,
  subscribeFriendships,
  getActiveFriendsSessions,
  subscribeActiveFriendsSessions,
  FriendshipError,
} from '../../api';

import type {
  Friend,
  FriendRequest,
  SentFriendRequest,
  ActiveFriendSession,
} from '../../types/database';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div hidden={value !== index} role="tabpanel">
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

export default function FriendsExample() {
  // Tab state
  const [activeTab, setActiveTab] = useState(0);

  // Data state
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<SentFriendRequest[]>([]);
  const [activeFriends, setActiveFriends] = useState<ActiveFriendSession[]>([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Refs for cleanup functions
  const unsubscribeFriendshipsRef = useRef<(() => void) | null>(null);
  const unsubscribeActiveSessionsRef = useRef<(() => void) | null>(null);

  // Load initial data
  useEffect(() => {
    loadAllData();
  }, []);

  // Subscribe to real-time updates
  useEffect(() => {
    // Setup subscriptions
    subscribeFriendships(() => {
      loadFriendData();
    }).then((unsubscribe) => {
      unsubscribeFriendshipsRef.current = unsubscribe;
    }).catch((err) => {
      console.error('Error subscribing to friendships:', err);
    });

    subscribeActiveFriendsSessions(() => {
      loadActiveFriends();
    }).then((unsubscribe) => {
      unsubscribeActiveSessionsRef.current = unsubscribe;
    }).catch((err) => {
      console.error('Error subscribing to active sessions:', err);
    });

    return () => {
      if (unsubscribeFriendshipsRef.current) {
        unsubscribeFriendshipsRef.current();
      }
      if (unsubscribeActiveSessionsRef.current) {
        unsubscribeActiveSessionsRef.current();
      }
    };
  }, []);

  // Load all data
  const loadAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([loadFriendData(), loadActiveFriends()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunne ikke laste data');
    } finally {
      setLoading(false);
    }
  };

  // Load friend-related data
  const loadFriendData = async () => {
    try {
      const [friendsData, pendingData, sentData] = await Promise.all([
        getFriends(),
        getPendingRequests(),
        getSentRequests(),
      ]);
      setFriends(friendsData);
      setPendingRequests(pendingData);
      setSentRequests(sentData);
    } catch (err) {
      console.error('Error loading friend data:', err);
      throw err;
    }
  };

  // Load active friends
  const loadActiveFriends = async () => {
    try {
      const data = await getActiveFriendsSessions();
      setActiveFriends(data);
    } catch (err) {
      console.error('Error loading active friends:', err);
    }
  };

  // Handle accepting friend request
  const handleAcceptRequest = async (friendshipId: string) => {
    setProcessingId(friendshipId);
    setError(null);
    try {
      await acceptFriendRequest(friendshipId);
      await loadFriendData();
    } catch (err) {
      setError(err instanceof FriendshipError ? err.message : 'Kunne ikke akseptere forespørsel');
    } finally {
      setProcessingId(null);
    }
  };

  // Handle declining friend request
  const handleDeclineRequest = async (friendshipId: string) => {
    setProcessingId(friendshipId);
    setError(null);
    try {
      await declineFriendRequest(friendshipId);
      await loadFriendData();
    } catch (err) {
      setError(err instanceof FriendshipError ? err.message : 'Kunne ikke avslå forespørsel');
    } finally {
      setProcessingId(null);
    }
  };

  // Handle canceling sent request
  const handleCancelRequest = async (friendshipId: string) => {
    setProcessingId(friendshipId);
    setError(null);
    try {
      await cancelFriendRequest(friendshipId);
      await loadFriendData();
    } catch (err) {
      setError(err instanceof FriendshipError ? err.message : 'Kunne ikke kansellere forespørsel');
    } finally {
      setProcessingId(null);
    }
  };

  // Handle removing friend
  const handleRemoveFriend = async (friendId: string) => {
    if (!window.confirm('Er du sikker på at du vil fjerne denne vennen?')) {
      return;
    }

    setProcessingId(friendId);
    setError(null);
    try {
      await removeFriend(friendId);
      await loadFriendData();
    } catch (err) {
      setError(err instanceof FriendshipError ? err.message : 'Kunne ikke fjerne venn');
    } finally {
      setProcessingId(null);
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'idle':
        return 'warning';
      case 'offline':
      default:
        return 'default';
    }
  };

  // Get status text
  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Aktiv';
      case 'idle':
        return 'Inaktiv';
      case 'offline':
      default:
        return 'Offline';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Venner
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Tabs value={activeTab} onChange={(_, value) => setActiveTab(value)} sx={{ mb: 2 }}>
          <Tab label={`Mine venner (${friends.length})`} />
          <Tab
            label={`Forespørsler (${pendingRequests.length})`}
            icon={pendingRequests.length > 0 ? <Chip size="small" label={pendingRequests.length} color="primary" /> : undefined}
          />
          <Tab label={`Sendt (${sentRequests.length})`} />
          <Tab
            label={`Drikker seg dritings (${activeFriends.length})`}
            icon={activeFriends.length > 0 ? <CircleIcon color="success" sx={{ fontSize: 12 }} /> : undefined}
          />
        </Tabs>

        {/* Tab 0: Friends List */}
        <TabPanel value={activeTab} index={0}>
          {friends.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Typography color="text.secondary">
                Du har ingen venner ennå. Send en venneforespørsel for å komme i gang!
              </Typography>
            </Box>
          ) : (
            <List>
              {friends.map((friend) => (
                <ListItem
                  key={friend.friend_id}
                  secondaryAction={
                    <IconButton
                      edge="end"
                      onClick={() => handleRemoveFriend(friend.friend_id)}
                      disabled={processingId === friend.friend_id}
                    >
                      {processingId === friend.friend_id ? <CircularProgress size={24} /> : <DeleteIcon />}
                    </IconButton>
                  }
                >
                  <ListItemAvatar>
                    <Avatar src={friend.avatar_url || undefined}>{friend.full_name[0]}</Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={friend.full_name}
                    secondary={`Venner siden ${new Date(friend.created_at).toLocaleDateString('nb-NO')}`}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </TabPanel>

        {/* Tab 1: Pending Requests */}
        <TabPanel value={activeTab} index={1}>
          {pendingRequests.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Typography color="text.secondary">Ingen ventende forespørsler</Typography>
            </Box>
          ) : (
            <List>
              {pendingRequests.map((request) => (
                <ListItem
                  key={request.friendship_id}
                  secondaryAction={
                    <Box display="flex" gap={1}>
                      <IconButton
                        color="success"
                        onClick={() => handleAcceptRequest(request.friendship_id)}
                        disabled={processingId === request.friendship_id}
                      >
                        {processingId === request.friendship_id ? <CircularProgress size={24} /> : <CheckIcon />}
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleDeclineRequest(request.friendship_id)}
                        disabled={processingId === request.friendship_id}
                      >
                        <CloseIcon />
                      </IconButton>
                    </Box>
                  }
                >
                  <ListItemAvatar>
                    <Avatar src={request.avatar_url || undefined}>{request.full_name[0]}</Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={request.full_name}
                    secondary={`Sendt ${new Date(request.created_at).toLocaleDateString('nb-NO')}`}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </TabPanel>

        {/* Tab 2: Sent Requests */}
        <TabPanel value={activeTab} index={2}>
          {sentRequests.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Typography color="text.secondary">Ingen sendte forespørsler</Typography>
            </Box>
          ) : (
            <List>
              {sentRequests.map((request) => (
                <ListItem
                  key={request.friendship_id}
                  secondaryAction={
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      onClick={() => handleCancelRequest(request.friendship_id)}
                      disabled={processingId === request.friendship_id}
                    >
                      {processingId === request.friendship_id ? <CircularProgress size={20} /> : 'Kanseller'}
                    </Button>
                  }
                >
                  <ListItemAvatar>
                    <Avatar src={request.avatar_url || undefined}>{request.full_name[0]}</Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={request.full_name}
                    secondary={
                      <>
                        Venter på svar
                        <Chip label="Venter" size="small" sx={{ ml: 1 }} />
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </TabPanel>

        {/* Tab 3: Active Friends */}
        <TabPanel value={activeTab} index={3}>
          {activeFriends.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Typography color="text.secondary">Ingen venner drikker seg dritings akkurat nå</Typography>
            </Box>
          ) : (
            <List>
              {activeFriends.map((friend) => (
                <ListItem
                  key={`${friend.friend_id}-${friend.session_id}`}
                  secondaryAction={
                    <Button variant="contained" size="small" href={`/session/${friend.session_id}`}>
                      Bli med
                    </Button>
                  }
                >
                  <ListItemAvatar>
                    <Avatar src={friend.friend_avatar_url || undefined}>{friend.friend_name[0]}</Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={friend.friend_name}
                    secondary={
                      <Box display="flex" flexDirection="column" gap={0.5}>
                        <Typography variant="body2">
                          <strong>{friend.session_name}</strong> ({friend.session_code})
                        </Typography>
                        <Box display="flex" gap={1} alignItems="center">
                          <Chip
                            label={getStatusText(friend.status)}
                            color={getStatusColor(friend.status)}
                            size="small"
                            icon={<CircleIcon />}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {friend.participant_count} deltakere
                          </Typography>
                        </Box>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </TabPanel>
      </CardContent>
    </Card>
  );
}
