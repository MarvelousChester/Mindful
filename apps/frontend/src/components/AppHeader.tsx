import { useState, useRef, useEffect } from 'react'
import { CircleUserRound, Leaf, LogOut, ChevronDown } from 'lucide-react'
import { useAuthStore } from '../features/auth/store'

/**
 * Function: AppHeader
 * Description: Top navigation bar showing the Mindful logo and a profile dropdown
 *   menu with the logged-in user's name and a sign-out option.
 * Returns: JSX header element
 */
export const AppHeader = () => {
  const user = useAuthStore((state) => state.user)
  const clearSession = useAuthStore((state) => state.clearSession)
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close the dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleSignOut() {
    clearSession()
    setOpen(false)
  }

  const displayName = user?.username ?? user?.email ?? 'Account'

  return (
    <header className="relative w-full bg-white/80 px-4 py-4 shadow-sm shadow-slate-200/50 backdrop-blur sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#a8e0d4] text-slate-800">
            <Leaf className="h-5 w-5" />
          </div>
          <span className="text-xl font-semibold tracking-tight">Mindful</span>
        </div>

        <p className="hidden text-xs font-semibold uppercase tracking-[0.45em] text-slate-600 md:block">
          Mindful Moments
        </p>

        {/* Profile dropdown */}
        <div className="relative flex items-center gap-4 text-sm leading-none text-slate-600" ref={menuRef}>
          <button
            id="profile-menu-btn"
            onClick={() => setOpen((prev) => !prev)}
            className="flex items-center gap-2 rounded-full px-3 py-1.5 hover:bg-slate-100 transition-colors"
            aria-haspopup="true"
            aria-expanded={open}
          >
            <CircleUserRound className="h-5 w-5 text-slate-500" />
            <span className="hidden sm:block max-w-[120px] truncate font-medium text-slate-700">
              {displayName}
            </span>
            <ChevronDown
              className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            />
          </button>

          {open && (
            <div
              id="profile-dropdown"
              className="absolute right-0 top-full mt-2 z-50 min-w-[180px] rounded-2xl bg-white shadow-lg shadow-slate-200/60 border border-slate-100 py-1 overflow-hidden"
              role="menu"
            >
              {/* User info row */}
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-xs text-slate-400">Signed in as</p>
                <p className="text-sm font-semibold text-slate-700 truncate">{displayName}</p>
              </div>

              {/* Sign out */}
              <button
                id="sign-out-btn"
                onClick={handleSignOut}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                role="menuitem"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
