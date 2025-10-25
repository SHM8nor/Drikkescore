// Database types matching the Supabase schema

export type Gender = 'male' | 'female';

export interface Profile {
  id: string;
  full_name: string;
  weight_kg: number;
  height_cm: number;
  gender: Gender;
  age: number;
  avatar_url?: string;
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
