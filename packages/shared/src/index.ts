interface UserIdentity {
  id: string;
  username: string;
  email: string;
}

// App-level user shape used after database fields are mapped
export interface User extends UserIdentity {
  createdAt: string;
}

// Database row shape for the public.users table and Supabase responses.
export interface UserProfileRow extends UserIdentity {
  created_at: string;
  updated_at: string;
}

// Database insert payload for creating or syncing a public.users record.
export type UserProfileInsert = UserIdentity;

// Database update payload for partial updates to the public.users record.
export type UserProfileUpdate = Partial<Pick<UserIdentity, 'username' | 'email'>> & {
  updated_at?: string;
};

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

export interface Meditation {
  id: string;
  title: string;
  category: string;
  duration: number; // in seconds
  audioUrl: string;
  description?: string;
}

export interface HistoryRecord {
  id: string;
  userId: string;
  meditationId: string;
  listenedDuration: number;
  playedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  token?: string;
}
