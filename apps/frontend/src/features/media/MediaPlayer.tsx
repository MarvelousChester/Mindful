import type { Track } from "./types";

interface MediaPlayerProps {
  track: Track | null;
}

export function MediaPlayer({ track }: MediaPlayerProps) {
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
              className="w-12 h-12 bg-primary text-slate-800 rounded-full flex items-center justify-center shadow-lg shadow-primary/30 hover:scale-105 transition-transform"
            >
              <span className="material-icons text-3xl">play_arrow</span>
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
              className="material-icons text-lg hover:text-primary transition-colors cursor-pointer"
              >volume_up
            </span>
            <div
              className="w-24 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden"
            >
              <div className="w-2/3 h-full bg-primary/60"></div>
            </div>
          </div>
          <button className="text-slate-400 hover:text-primary transition-colors">
            <span className="material-icons">queue_music</span>
          </button>
        </div>
      </div>
  );
}
