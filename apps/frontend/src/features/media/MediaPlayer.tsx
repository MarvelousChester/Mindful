import type { Track } from "./types";

interface MediaPlayerProps {
  track: Track | null;
}

export function MediaPlayer({ track }: MediaPlayerProps) {
  if (!track) return null;

  return (
    <div>
      <p>{track.title}</p>
    </div>
  );
}
