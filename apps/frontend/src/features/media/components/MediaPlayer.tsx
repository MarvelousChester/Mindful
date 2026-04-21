import { useEffect, useRef, useState } from "react";
import type { Track } from "../types";
import { authFetch } from "../../../lib/api";

interface MediaPlayerProps {
  track: Track | null;
  autoPlayRequestId?: number;
  onHistoryRecorded?: () => void;
}

export function MediaPlayer({
  track,
  autoPlayRequestId,
  onHistoryRecorded,
}: MediaPlayerProps) {
  if (!track) return null;

  return (
    <MediaPlayerContent
      key={track.audioUrl ?? track.id}
      track={track}
      autoPlayRequestId={autoPlayRequestId}
      onHistoryRecorded={onHistoryRecorded}
    />
  );
}


/**
 * Function: postHistory
 * Description: Fires a fire-and-forget POST to /api/history with the track id
 *   and how many seconds the user listened.
 * Params:
 * - meditationId: UUID of the track that was played
 * - listenedDuration: Integer seconds the user actually listened
 * - onSuccess: Optional callback invoked after a successful write
 * Returns: void
 */
async function postHistory(
  meditationId: string,
  listenedDuration: number,
  onSuccess?: () => void,
) {
  try {
    await authFetch("/api/history", {
      method: "POST",
      body: JSON.stringify({ meditationId, listenedDuration }),
    });
    onSuccess?.();
  } catch (err) {
    console.warn("[MediaPlayer] Failed to record history:", err);
  }
}

interface MediaPlayerContentProps {
  track: Track;
  autoPlayRequestId?: number;
  onHistoryRecorded?: () => void;
}

function MediaPlayerContent({
  track,
  autoPlayRequestId,
  onHistoryRecorded,
}: MediaPlayerContentProps) {
  const SEEK_STEP_SECONDS = 10;
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.67);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const currentTimeRef = useRef(0);
  const historyPostedRef = useRef(false);

  useEffect(() => {
    const audio = new Audio(track.audioUrl);
    audioRef.current = audio;

    const onTimeUpdate = () => {
      currentTimeRef.current = audio.currentTime;
      setCurrentTime(audio.currentTime);
    };
    const onLoadedMetadata = () => setDuration(audio.duration);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    /**
     * onEnded fires when the track plays to completion.
     * Record the full listened duration and notify the parent.
     */
    const onEnded = () => {
      setIsPlaying(false);
      historyPostedRef.current = true;
      void postHistory(
        track.id,
        Math.floor(audio.duration || 0),
        onHistoryRecorded,
      );
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);

    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      const elapsed = Math.floor(currentTimeRef.current);
      if (elapsed >= 1 && !historyPostedRef.current) {
        void postHistory(track.id, elapsed, onHistoryRecorded);
      }

      audioRef.current = null;
    };
  }, [track.audioUrl, track.id, onHistoryRecorded]);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  useEffect(() => {
    if (!audioRef.current || autoPlayRequestId == null) return;

    void audioRef.current.play().catch((err) => {
      console.warn("[MediaPlayer] Failed to autoplay track:", err);
    });
  }, [autoPlayRequestId]);

  /**
   * Function: togglePlay
   * Description: Toggles audio playback between playing and paused states.
   * Params: none
   * Returns: void
   */
  function togglePlay() {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      void audioRef.current.play().catch((err) => {
        console.warn("[MediaPlayer] Failed to play track:", err);
      });
    }
  }

  /**
   * Function: handleVolumeBarClick
   * Description: Sets volume based on click position along the volume bar.
   * Params:
   * - e: React mouse event on the volume bar element
   * Returns: void
   */
  function handleVolumeBarClick(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const newVolume = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  }

  /**
   * Function: toggleMute
   * Description: Toggles mute state, restoring previous volume when unmuting.
   * Params: none
   * Returns: void
   */
  function toggleMute() {
    setIsMuted((prev) => !prev);
  }

  /**
   * Function: formatTime
   * Description: Formats a duration in seconds to m:ss string.
   * Params:
   * - seconds: number of seconds to format
   * Returns: Formatted time string (e.g. "3:07")
   */
  function formatTime(seconds: number): string {
    if (!isFinite(seconds)) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  /**
   * Function: handleSeek
   * Description: Seeks audio to position based on click location on the progress bar.
   * Params:
   * - e: React mouse event on the progress bar element
   * Returns: void
   */
  function handleSeek(e: React.MouseEvent<HTMLDivElement>) {
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const newTime = Math.max(0, Math.min(duration, ((e.clientX - rect.left) / rect.width) * duration));
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  }

  function handleSkip(offsetSeconds: number) {
    if (!audioRef.current) return;
    const maxTime = Number.isFinite(audioRef.current.duration) ? audioRef.current.duration : Infinity;
    const newTime = Math.max(
      0,
      Math.min(maxTime, audioRef.current.currentTime + offsetSeconds),
    );
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  }

  return (
    <div
      className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-6"
    >
      <div className="flex items-center gap-4 w-full md:w-1/3">
        <div
          className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center text-slate-700 overflow-hidden shrink-0"
        >
          {track.thumbnailUrl ? (
            <img src={track.thumbnailUrl} alt={track.title} className="w-full h-full object-cover" />
          ) : (
            <span className="material-icons">music_note</span>
          )}
        </div>
        <div>
          <h4 className="font-semibold text-sm leading-tight">
            {track.title}
          </h4>
          <p className="text-xs text-slate-400">{formatTime(currentTime)}</p>
        </div>
      </div>
      <div className="flex flex-col items-center gap-2 w-full md:w-1/3">
        <div className="flex items-center gap-8 pt-3">
          <button
            type="button"
            onClick={() => handleSkip(-SEEK_STEP_SECONDS)}
            aria-label="Back 10 seconds"
            className="text-slate-400 hover:text-primary transition-colors"
          >
            <span className="material-icons">replay_10</span>
          </button>
          <button
            onClick={togglePlay}
            className="w-12 h-12 bg-primary text-slate-800 rounded-full flex items-center justify-center shadow-lg shadow-primary/30 hover:scale-105 transition-transform"
          >
            <span className="material-icons text-3xl">{isPlaying ? "pause" : "play_arrow"}</span>
          </button>
          <button
            type="button"
            onClick={() => handleSkip(SEEK_STEP_SECONDS)}
            aria-label="Forward 10 seconds"
            className="text-slate-400 hover:text-primary transition-colors"
          >
            <span className="material-icons">forward_10</span>
          </button>
        </div>
        <div className="w-full max-w-sm flex items-center gap-2 text-xs text-slate-400">
          <span>{formatTime(currentTime)}</span>
          <div
            onClick={handleSeek}
            className="flex-1 h-1.5 bg-slate-100 rounded-full relative overflow-hidden cursor-pointer"
          >
            <div
              className="absolute left-0 top-0 h-full bg-primary transition-all"
              style={{ width: duration ? `${(currentTime / duration) * 100}%` : "0%" }}
            ></div>
          </div>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
      <div className="hidden md:flex items-center justify-end gap-6 w-1/3">
        <div className="flex items-center gap-3 text-slate-400">
          <span
            onClick={toggleMute}
            className="material-icons text-lg hover:text-primary transition-colors cursor-pointer"
          >
            {isMuted || volume === 0 ? "volume_off" : volume < 0.5 ? "volume_down" : "volume_up"}
          </span>
          <div
            onClick={handleVolumeBarClick}
            className="w-24 h-1 bg-slate-100 rounded-full overflow-hidden cursor-pointer"
          >
            <div
              className="h-full bg-primary/60 transition-all"
              style={{ width: `${isMuted ? 0 : volume * 100}%` }}
            ></div>
          </div>
        </div>
        <button className="text-slate-400 hover:text-primary transition-colors">
          <span className="material-icons">queue_music</span>
        </button>
      </div>
    </div>
  );
}
