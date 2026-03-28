export interface Track {
  id: string;
  title: string;
  description: string;
  duration: number; // seconds
  audioUrl: string;
  thumbnailUrl?: string;
  university: string;
  category: string[];
}

export interface PlaybackState {
  trackId: string | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
}

export type PlaybackStatus = "idle" | "loading" | "playing" | "paused" | "error";
