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

// Session Details API
export {
  getSessionDetail,
  getSessionDrinks,
  getSessionLeaderboard,
  SessionDetailsError,
} from './sessionDetails';

export type {
  SessionDetailParticipant,
  SessionDrinkWithUser,
  SessionDetailData,
} from './sessionDetails';

// Admin Users API
export {
  getAllUsers,
  updateUserRole,
  AdminUsersError,
} from './adminUsers';

export type {
  AdminUser,
} from './adminUsers';

// System Analytics API
export {
  getSystemStats,
  getGrowthData,
  getActivityHeatmap,
  getTopUsers,
  getAllDrinksAndProfiles,
  SystemAnalyticsError,
} from './systemAnalytics';

export type {
  SystemStats,
  GrowthData,
  ActivityHeatmap,
  TopUser,
} from './systemAnalytics';
