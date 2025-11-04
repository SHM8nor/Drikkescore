/**
 * API Index
 *
 * Central export point for all API modules.
 * Makes imports cleaner: import { sendFriendRequest } from '@/api'
 */

// Friendship API
export {
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  cancelFriendRequest,
  getFriends,
  getPendingRequests,
  getSentRequests,
  removeFriend,
  blockUser,
  unblockUser,
  areFriends,
  getFriendshipStatus,
  subscribeFriendships,
  FriendshipError,
} from './friendships';

// Active Sessions API
export {
  updateSessionPresence,
  markSessionOffline,
  markAllSessionsOffline,
  getActiveFriendsSessions,
  getSessionActiveUsers,
  getCurrentActiveSession,
  startPresenceHeartbeat,
  handleVisibilityChange,
  setupPresenceTracking,
  subscribeActiveFriendsSessions,
  subscribeSessionActiveUsers,
  cleanupStaleSessions,
  ActiveSessionError,
} from './activeSessions';

// Users API
export {
  searchUsers,
  getUserProfile,
  UserSearchError,
} from './users';

export type { UserSearchResult } from './users';
