/**
 * @filename types.ts
 * @date 2026-03-29
 * @author Karandeep Sandhu
 * @fileoverview Type definitions for meditation tracks and playback state
 * @version 1.0.0
 */

export interface Track {
  id: string;
  title: string;
  duration: number | null; // seconds, nullable in DB
  language: string;
  audioUrl: string;       // derived from tracks.audio_path
  thumbnailUrl?: string;  // derived from schools.logo_path (Storage public URL)
  university: string;     // derived from schools.name
  category: string[];     // derived from track_categories → categories
}

export interface PlaybackState {
  trackId: string | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
}

export type PlaybackStatus = "idle" | "loading" | "playing" | "paused" | "error";
