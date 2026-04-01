import { useMemo, useState } from 'react'
import { AppHeader } from '../../components/AppHeader'
import { CategoryFilter } from './components/CategoryFilter'
import { MediaPlayer } from './components/MediaPlayer'
import { TrackCard } from './components/TrackCard'
import type { Track } from './types'

type View = 'library' | 'history'

// Placeholder data — will be replaced with real fetched data
const LIBRARY_TRACKS: Track[] = [
  {
    id: '1',
    title: 'Morning Clarity',
    duration: 10 * 60,
    language: 'English',
    category: ['Focus', 'Energy'],
    audioUrl: 'https://example.com/audio/morning-clarity.mp3',
    thumbnailUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDn5mVOeriKqmhufhGqrSAnWoVlCsh_DLGNOa4GOjkqG0iOKrZEt3vwE0NHntF7F4EJh-o3f8CPFsNBtdYhTPhxVdePv5bXVduG3F_wJwaDf1-W-he7XxBJWjaxoH0BLzjlVdjJf3wca1yZKpzvD2_WQIrX09jbhcR0JiGnoq4iPmaICy4DWZrXks5gRg9A23u_MYLsxQmBlM7LfPcG1n2qg7RhWQD7WnDYKtTcZtbt8PbcuSTxehbv-2rJlD_PzeLF90TuQfF1dA',
    university: 'Mindful University',
  },
]

const HISTORY_TRACKS: Track[] = []

export const MediaScreen = () => {
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [view, setView] = useState<View>('library')

  const tracks = view === 'library' ? LIBRARY_TRACKS : HISTORY_TRACKS

  const availableCategories = useMemo(
    () => [...new Set(tracks.flatMap((t) => t.category))].sort(),
    [tracks],
  )

  function handleViewChange(next: View) {
    setView(next)
    setSelectedCategories([])
  }

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
          <input className="w-full pl-12 pr-4 py-4 bg-white border-none rounded-2xl shadow-sm focus:ring-2 focus:ring-primary transition-all outline-none text-slate-700" placeholder="Search for a practice..." type="text" />
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-start">
          <div className={`w-full grid grid-cols-1 gap-4 ${tracks.length > 0 ? 'md:w-[70%]' : ''}`}>
            {tracks.length === 0 ? (
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
        <MediaPlayer track={selectedTrack} />
      </footer>
    </div>
  )
}