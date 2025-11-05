// Database types matching the Supabase schema

export type Gender = 'male' | 'female';
export type UserRole = 'user' | 'admin';
export type FriendshipStatus = 'pending' | 'accepted' | 'declined' | 'blocked';
export type SessionStatus = 'active' | 'idle' | 'offline';

export interface Profile {
  id: string;
  full_name: string;
  weight_kg: number;
  height_cm: number;
  gender: Gender;
  age: number;
  role: UserRole;
  avatar_url?: string;
  has_accepted_terms: boolean;
  terms_accepted_at: string | null;
  privacy_policy_version: number;
  last_session_recap_viewed: string | null;
  last_recap_dismissed_at: string | null;
  session_recaps_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  session_code: string;
  session_name: string;
  created_by: string;
  start_time: string;
  end_time: string;
  created_at: string;
  updated_at: string;
}

export interface SessionParticipant {
  id: string;
  session_id: string;
  user_id: string;
  joined_at: string;
}

export interface DrinkEntry {
  id: string;
  session_id: string;
  user_id: string;
  volume_ml: number;
  alcohol_percentage: number;
  consumed_at: string;
  created_at: string;
  food_consumed?: boolean; // Optional: true if user was eating when drinking
  rapid_consumption?: boolean; // Optional: true if drink was chugged/shotgunned
}

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  full_name: string;
  bac: number;
}

export interface SessionWithParticipants extends Session {
  participants: Profile[];
}

// =============================================================================
// Friend System Types
// =============================================================================

export interface Friendship {
  id: string;
  user_id: string;
  friend_id: string;
  status: FriendshipStatus;
  created_at: string;
  updated_at: string;
}

export interface Friend {
  friend_id: string;
  full_name: string;
  avatar_url: string | null;
  created_at: string;
}

export interface FriendRequest {
  friendship_id: string;
  requester_id: string;
  full_name: string;
  avatar_url: string | null;
  created_at: string;
}

export interface SentFriendRequest {
  friendship_id: string;
  recipient_id: string;
  full_name: string;
  avatar_url: string | null;
  created_at: string;
}

export interface ActiveSession {
  id: string;
  user_id: string;
  session_id: string;
  status: SessionStatus;
  last_seen: string;
  created_at: string;
  updated_at: string;
}

export interface ActiveFriendSession {
  friend_id: string;
  friend_name: string;
  friend_avatar_url: string | null;
  session_id: string;
  session_name: string;
  session_code: string;
  status: SessionStatus;
  last_seen: string;
  participant_count: number;
}

export interface SessionActiveUser {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  status: SessionStatus;
  last_seen: string;
}

// =============================================================================
// Form Data Types
// =============================================================================

export interface RegisterFormData {
  email: string;
  password: string;
  full_name: string;
  weight_kg: number;
  height_cm: number;
  gender: Gender;
  age: number;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface CreateSessionFormData {
  session_name: string;
  start_time: string;
  end_time: string;
}

export interface JoinSessionFormData {
  session_code: string;
}

export interface AddDrinkFormData {
  volume_ml: number;
  alcohol_percentage: number;
}

export interface UpdateProfileFormData {
  full_name?: string;
  weight_kg?: number;
  height_cm?: number;
  gender?: Gender;
  age?: number;
  avatar_url?: string;
}
