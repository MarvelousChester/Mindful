import { useEffect, useRef, useState } from "react";
import type { Track } from "./types";



interface MediaPlayerProps {
  track: Track | null;
}

export function MediaPlayer({ track }: MediaPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.67);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    audioRef.current = new Audio(track?.audioUrl);
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, [track?.audioUrl]);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

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
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
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

  if (!track) return null;

  return (
    <div
        className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-6"
      >
        <div className="flex items-center gap-4 w-full md:w-1/3">
          <div
            className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center text-slate-700 dark:text-primary"
          >
            <span className="material-icons">music_note</span>
          </div>
          <div>
            <h4 className="font-semibold text-sm leading-tight">
              Select Meditation to Begin
            </h4>
            <p className="text-xs text-slate-400">Library • 0:00</p>
          </div>
        </div>
        <div className="flex flex-col items-center gap-2 w-full md:w-1/3">
          <div className="flex items-center gap-8">
            <button className="text-slate-400 hover:text-primary transition-colors">
              <span className="material-icons">replay_10</span>
            </button>
            <button
              onClick={togglePlay}
              className="w-12 h-12 bg-primary text-slate-800 rounded-full flex items-center justify-center shadow-lg shadow-primary/30 hover:scale-105 transition-transform"
            >
              <span className="material-icons text-3xl">{isPlaying ? "pause" : "play_arrow"}</span>
            </button>
            <button className="text-slate-400 hover:text-primary transition-colors">
              <span className="material-icons">forward_10</span>
            </button>
          </div>
          <div
            className="w-full max-w-sm h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full relative overflow-hidden group cursor-pointer"
          >
            <div
              className="absolute left-0 top-0 h-full bg-primary w-0 group-hover:w-1/3 transition-all"
            ></div>
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
              className="w-24 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden cursor-pointer"
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
