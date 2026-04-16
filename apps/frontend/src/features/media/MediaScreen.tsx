import { useCallback, useEffect, useMemo, useState } from 'react'
import { AppHeader } from '../../components/AppHeader'
import { CategoryFilter } from './components/CategoryFilter'
import { MediaPlayer } from './components/MediaPlayer'
import { TrackCard } from './components/TrackCard'
import { apiFetch, authFetch } from '../../lib/api'
import type { Track } from './types'

type View = 'library' | 'history'

/** Shape returned by GET /api/meditations and GET /api/history */
interface MeditationApiItem {
  id: string
  title: string
  duration: number | null
  language: string
  audioUrl: string
  thumbnailUrl?: string
  university: string
  categories: string[]
}

/** Map the API response shape to the frontend Track type */
function mapToTrack(item: MeditationApiItem): Track {
  return {
    id: item.id,
    title: item.title,
    duration: item.duration,
    language: item.language,
    audioUrl: item.audioUrl,
    thumbnailUrl: item.thumbnailUrl,
    university: item.university,
    category: item.categories,
  }
}

export const MediaScreen = () => {
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [view, setView] = useState<View>('library')

  const [libraryTracks, setLibraryTracks] = useState<Track[]>([])
  const [libraryLoading, setLibraryLoading] = useState(true)
  const [libraryError, setLibraryError] = useState<string | null>(null)

  useEffect(() => {
    setLibraryLoading(true)
    setLibraryError(null)

    apiFetch<{ success: boolean; data: MeditationApiItem[] }>('/api/meditations?limit=50')
      .then((res) => setLibraryTracks(res.data.map(mapToTrack)))
      .catch((err: Error) => setLibraryError(err.message))
      .finally(() => setLibraryLoading(false))
  }, [])

  // History state
  const [historyTracks, setHistoryTracks] = useState<Track[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState<string | null>(null)
  const [historyVersion, setHistoryVersion] = useState(0)

  useEffect(() => {
    if (view !== 'history' && historyVersion === 0) return

    setHistoryLoading(true)
    setHistoryError(null)

    authFetch<{ success: boolean; data: MeditationApiItem[] }>('/api/history')
      .then((res) => setHistoryTracks(res.data.map(mapToTrack)))
      .catch((err: Error) => setHistoryError(err.message))
      .finally(() => setHistoryLoading(false))
  }, [view, historyVersion])

  /**
   * Function: handleHistoryRecorded
   * Description: Called by MediaPlayer after a successful POST to /api/history.
   * Returns: void
   */
  const handleHistoryRecorded = useCallback(() => {
    setHistoryVersion((v) => v + 1)
  }, [])

  // Filtering
  const rawTracks = view === 'library' ? libraryTracks : historyTracks

  const searchFiltered = useMemo(() => {
    if (!searchQuery.trim()) return rawTracks
    const q = searchQuery.toLowerCase()
    return rawTracks.filter((t) => t.title.toLowerCase().includes(q))
  }, [rawTracks, searchQuery])

  const tracks = useMemo(() => {
    if (selectedCategories.length === 0) return searchFiltered
    return searchFiltered.filter((t) =>
      selectedCategories.every((cat) => t.category.includes(cat)),
    )
  }, [searchFiltered, selectedCategories])

  const availableCategories = useMemo(
    () => [...new Set(rawTracks.flatMap((t) => t.category))].sort(),
    [rawTracks],
  )

  function handleViewChange(next: View) {
    setView(next)
    setSelectedCategories([])
    setSearchQuery('')
  }

  const isLoading =
    (view === 'library' && libraryLoading) ||
    (view === 'history' && historyLoading)

  const activeError = view === 'library' ? libraryError : historyError

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f4f6f5] text-slate-900">
      <AppHeader />
      <div className="grow max-w-5xl mx-auto w-full px-6 py-12 pb-40">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold mb-2 text-slate-800">Find your peace</h2>
          <p className="text-slate-500">Discover guided practices for every state of mind.</p>
        </div>

        <div className="flex justify-center mb-6">
          <div className="inline-flex bg-white rounded-2xl shadow-sm p-1 gap-1">
            <button
              onClick={() => handleViewChange('library')}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium transition-all ${view === 'library'
                ? 'bg-primary text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              <span className="material-icons text-base">library_music</span>
              Library
            </button>
            <button
              onClick={() => handleViewChange('history')}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium transition-all ${view === 'history'
                ? 'bg-primary text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              <span className="material-icons text-base">history</span>
              History
            </button>
          </div>
        </div>

        <div className="relative w-full mb-4">
          <span className="material-icons absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
          <input
            className="w-full pl-12 pr-4 py-4 bg-white border-none rounded-2xl shadow-sm focus:ring-2 focus:ring-primary transition-all outline-none text-slate-700"
            placeholder="Search for a practice..."
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Error banner */}
        {activeError && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">
            Failed to load tracks: {activeError}
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-4 items-start">
          <div className={`w-full grid grid-cols-1 gap-4 ${tracks.length > 0 ? 'md:w-[70%]' : ''}`}>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
                <span className="material-icons text-5xl animate-spin">sync</span>
                <p className="text-sm">Loading tracks...</p>
              </div>
            ) : tracks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
                <span className="material-icons text-5xl">{view === 'history' ? 'history' : 'library_music'}</span>
                <p className="text-sm">
                  {view === 'history' ? 'Your listening history will appear here.' : 'No tracks found.'}
                </p>
              </div>
            ) : (
              tracks.map((track) => (
                <TrackCard key={track.id} track={track} onSelect={setSelectedTrack} />
              ))
            )}
          </div>

          {tracks.length > 0 && (
            <div className="w-full md:w-[30%]">
              <CategoryFilter
                categories={availableCategories}
                selected={selectedCategories}
                onChange={setSelectedCategories}
              />
            </div>
          )}
        </div>
      </div>

      <footer className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-xl border-t border-primary/20 px-6 py-4 z-50">
        <MediaPlayer track={selectedTrack} onHistoryRecorded={handleHistoryRecorded} />
      </footer>
    </div>
  )
}
