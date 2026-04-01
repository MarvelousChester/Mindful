import { AppHeader } from '../../components/AppHeader'
import { TrackCard } from './TrackCard'

export const MediaScreen = () => {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f4f6f5] text-slate-900">
      <AppHeader />
      <div className="grow max-w-5xl mx-auto w-full px-6 py-12 pb-40">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2 text-slate-800 dark:text-white">Find your peace</h2>
          <p className="text-slate-500 dark:text-slate-400">Discover guided practices for every state of mind.</p>
        </div>
        <div className="relative w-full mb-4">
          <span className="material-icons absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
          <input className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border-none rounded-2xl shadow-sm focus:ring-2 focus:ring-primary transition-all outline-none text-slate-700 dark:text-slate-200" placeholder="Search for a practice..." type="text"/>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-start">
          <div className="w-full md:w-[70%] grid grid-cols-1 gap-4">
            <TrackCard track={{
              id: '1',
              title: 'Morning Clarity',
              description: 'Start your day with a clear mind and focused energy.',
              duration: 10 * 60,
              language: 'English',
              category: ['Focus', 'Energy'],
              audioUrl: 'https://example.com/audio/morning-clarity.mp3',
              thumbnailUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDn5mVOeriKqmhufhGqrSAnWoVlCsh_DLGNOa4GOjkqG0iOKrZEt3vwE0NHntF7F4EJh-o3f8CPFsNBtdYhTPhxVdePv5bXVduG3F_wJwaDf1-W-he7XxBJWjaxoH0BLzjlVdjJf3wca1yZKpzvD2_WQIrX09jbhcR0JiGnoq4iPmaICy4DWZrXks5gRg9A23u_MYLsxQmBlM7LfPcG1n2qg7RhWQD7WnDYKtTcZtbt8PbcuSTxehbv-2rJlD_PzeLF90TuQfF1dA',
              university: 'Mindful University',
            }} onSelect={(track) => console.log('Selected track:', track)} />
          </div>

          <div className="w-full md:w-[30%] bg-white dark:bg-slate-900 rounded-2xl shadow-sm px-4 py-3 flex flex-col gap-3">
            {['Sleep', 'Focus', 'Anxiety', 'Gratitude'].map((tag) => (
              <label key={tag} className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" value={tag.toLowerCase()} className="accent-primary w-4 h-4 cursor-pointer" />
                <span className="text-sm text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{tag}</span>
              </label>
            ))}
          </div>
          
        </div>
      </div>
    </div>
  )
}