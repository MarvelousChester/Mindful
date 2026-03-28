import { CircleUserRound, Leaf } from 'lucide-react'

export const AppHeader = () => {
  return (
    <header className="relative w-full bg-white/80 px-4 py-4 shadow-sm shadow-slate-200/50 backdrop-blur sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#a8e0d4] text-slate-800">
            <Leaf className="h-5 w-5" />
          </div>
          <span className="text-xl font-semibold tracking-tight">Mindful</span>
        </div>

        <p className="hidden text-xs font-semibold uppercase tracking-[0.45em] text-slate-600 md:block">
          Mindful Moments
        </p>

        <div className="flex items-center gap-4 text-sm leading-none text-slate-600">
          <button type="button" className="inline-flex items-center transition hover:text-slate-900">
            About
          </button>
          <span className="inline-flex items-center justify-center">
            <CircleUserRound className="h-5 w-5" />
          </span>
        </div>
      </div>
    </header>
  )
}
