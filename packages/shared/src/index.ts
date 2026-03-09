/**
 * @filename index.ts
 * @date 2026-03-08
 * @author Salman Nouman Abulqasim
 * @fileoverview Shared types and interfaces for the meditation app
 * @version 1.0.0
 */

/**
 * User identity interface for user identification.
 */
interface UserIdentity {
  id: string;
  username: string;
  email: string;
}

/**
 * App-level user shape used after database fields are mapped
 */
export interface User extends UserIdentity {
  createdAt: string;
}

/**
 * Database row shape for the public.users table and Supabase responses.
 */
export interface UserProfileRow extends UserIdentity {
  created_at: string;
  updated_at: string;
}

/**
 * Database insert payload for creating or syncing a public.users record.
 */
export type UserProfileInsert = UserIdentity;

/**
 * Database update payload for partial updates to the public.users record.
 */
export type UserProfileUpdate = Partial<Pick<UserIdentity, 'username' | 'email'>> & {
  updated_at?: string;
};

/**
 * Database schema interface for the public schema.
 */
export interface Database {
  public: {
    Tables: {
      users: {
        Row: UserProfileRow;
        Insert: UserProfileInsert;
        Update: UserProfileUpdate;
      };
    };
  };
}

/**
 * Meditation interface for meditation data.
 */
export interface Meditation {
  id: string;
  title: string;
  category: string;
  duration: number; // in seconds
  audioUrl: string;
  description?: string;
}

/**
 * History record interface for tracking user meditation history.
 */
export interface HistoryRecord {
  id: string;
  userId: string;
  meditationId: string;
  listenedDuration: number;
  playedAt: string;
}

/**
 * API response interface for consistent API responses.
 */
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  token?: string;
}
