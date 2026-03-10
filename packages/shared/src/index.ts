/**
 * @filename index.ts
 * @date 2026-03-08
 * @author Salman Nouman Abulqasim
 * @fileoverview Shared types and interfaces for the meditation app
 * @version 1.0.0
 */

/**
 * Interface: UserIdentity
 * Description: Shared identity fields reused by app-level and database-level user types.
 * Properties:
 * - id: Unique identifier for the user.
 * - username: Display name or handle chosen for the user.
 * - email: Primary email address used for authentication and contact.
 */
interface UserIdentity {
  id: string;
  username: string;
  email: string;
}

/**
 * Interface: User
 * Description: App-level user shape returned by backend endpoints after database fields are mapped to camelCase.
 * Properties:
 * - id: Unique identifier for the user.
 * - username: Display name used by the application UI.
 * - email: Email address associated with the user account.
 * - createdAt: ISO timestamp for when the user account was created.
 */
export interface User extends UserIdentity {
  createdAt: string;
}

/**
 * Interface: UserProfileRow
 * Description: Database row shape for the `public.users` table returned by Supabase queries.
 * Properties:
 * - id: UUID linked directly to `auth.users.id`.
 * - username: Username stored in the application profile table.
 * - email: Email copied into the profile table for app queries.
 * - created_at: ISO timestamp for when the profile row was created.
 * - updated_at: ISO timestamp for the most recent profile update.
 */
export interface UserProfileRow extends UserIdentity {
  created_at: string;
  updated_at: string;
}

/**
 * Type: UserProfileInsert
 * Description: Payload used when inserting or syncing a `public.users` profile record.
 * Properties:
 * - id: UUID linked to the authenticated Supabase user.
 * - username: Username to persist in the profile table.
 * - email: Email to persist in the profile table.
 */
export type UserProfileInsert = UserIdentity;

/**
 * Type: UserProfileUpdate
 * Description: Partial update payload for modifying selected fields in the `public.users` table.
 * Properties:
 * - username: Optional updated username.
 * - email: Optional updated email address.
 * - updated_at: Optional timestamp override for controlled profile updates.
 */
export type UserProfileUpdate = Partial<Pick<UserIdentity, 'username' | 'email'>> & {
  updated_at?: string;
};

/**
 * Interface: Database
 * Description: Shared Supabase database type map for strongly typed access to public tables.
 * Properties:
 * - public: Container for tables exposed in the public schema.
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
 * Interface: Meditation
 * Description: Represents a meditation item that can be listed, searched, and played in the application.
 * Properties:
 * - id: Unique identifier for the meditation.
 * - title: Display title of the meditation.
 * - category: Category used for grouping and filtering meditations.
 * - duration: Total duration of the meditation in seconds.
 * - audioUrl: URL pointing to the meditation audio source.
 * - description: Optional summary shown in discovery or detail views.
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
 * Interface: HistoryRecord
 * Description: Represents a single listening history entry recorded for a user.
 * Properties:
 * - id: Unique identifier for the history record.
 * - userId: Identifier of the user who listened to the meditation.
 * - meditationId: Identifier of the meditation that was played.
 * - listenedDuration: Number of seconds listened during the recorded session.
 * - playedAt: ISO timestamp of when the playback event was recorded.
 */
export interface HistoryRecord {
  id: string;
  userId: string;
  meditationId: string;
  listenedDuration: number;
  playedAt: string;
}

/**
 * Interface: ApiResponse
 * Description: Generic wrapper used to keep backend API responses consistent across endpoints.
 * Properties:
 * - success: Indicates whether the request completed successfully.
 * - message: Optional human-readable status or error message.
 * - data: Optional typed payload returned by the endpoint.
 * - token: Optional access token returned by authentication endpoints.
 */
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  token?: string;
}
