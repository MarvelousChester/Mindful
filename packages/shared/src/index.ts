export interface User {
  id: string;
  username: string;
  email: string;
  createdAt: string;
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
