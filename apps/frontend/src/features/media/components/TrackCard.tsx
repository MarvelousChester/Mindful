import type { Track } from '../types'

interface TrackCardProps {
  track: Track
  onSelect: (track: Track) => void
}

/**
 * Function: formatDuration
 * Description: Formats a duration in seconds to a human-readable string.
 * Params:
 * - seconds: total seconds to format
 * Returns: Formatted string (e.g. "10 min")
 */
function formatDuration(seconds: number): string {
  const m = Math.round(seconds / 60)
  return `${m} min`
}

/**
 * Function: TrackCard
 * Description: Displays a single meditation track with thumbnail, metadata, and play-on-hover overlay.
 * Params:
 * - track: the Track object to display
 * - onSelect: callback fired when the card is clicked
 * Returns: A JSX card element
 */
export function TrackCard({ track, onSelect }: TrackCardProps) {
  return (
    <div
      onClick={() => onSelect(track)}
      className="group bg-white dark:bg-slate-900/50 p-4 rounded-2xl border border-transparent hover:border-primary/40 transition-all flex items-center gap-5 cursor-pointer shadow-sm hover:shadow-md"
    >
      <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
        {track.thumbnailUrl ? (
          <img
            src={track.thumbnailUrl}
            alt={track.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-primary/20 flex items-center justify-center">
            <span className="material-icons text-slate-500">music_note</span>
          </div>
        )}
        <div className="absolute inset-0 bg-primary/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="material-icons text-slate-800">play_arrow</span>
        </div>
      </div>

      <div className="flex-grow min-w-0">
        <div className="flex items-center gap-3 mb-1">
          {track.category.map((cat) => (
            <span
              key={cat}
              className="px-2 py-0.5 bg-primary/20 text-slate-700 dark:text-primary text-[10px] font-bold uppercase tracking-wider rounded"
            >
              {cat}
            </span>
          ))}
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <span className="material-icons text-xs">schedule</span>
            {formatDuration(track.duration)}
          </span>
        </div>
        <h3 className="text-lg font-semibold truncate group-hover:text-slate-900 dark:group-hover:text-primary transition-colors">
          {track.title}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1">
          {track.description}
        </p>
      </div>
    </div>
  )
}
