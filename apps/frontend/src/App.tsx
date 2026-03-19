/**
 * @filename App.tsx
 * @date 2026-03-16
 * @author Salman Nouman Abulqasim
 * @fileoverview Main application router with protected routes
 * @version 1.0.0
 */

import { Navigate, Outlet, Route, Routes } from 'react-router'
import { useShallow } from 'zustand/react/shallow'

import { AuthScreen } from './features/auth/AuthScreen'
import { useAuthStore } from './features/auth/store'

/**
 * Function: ProtectedRoute
 * Description: Protects routes that require authentication.
 * Params:
 * - None.
 * Returns:
 * - An Outlet component if the user is authenticated, otherwise redirects to the register page.
 */
const ProtectedRoute = () => {
  const { accessToken, hasHydrated, user } = useAuthStore(
    useShallow((state) => ({
      accessToken: state.accessToken,
      hasHydrated: state.hasHydrated,
      user: state.user,
    })),
  )

  if (!hasHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-slate-500">
        Loading your session...
      </div>
    )
  }

  if (!accessToken || !user) {
    return <Navigate replace to="/register" />
  }

  return <Outlet />
}

/**
 * Note: This is a placeholder component for the home page.
 * Replace this component when implementing the actual home page and
 * the corresponding route in the Routes component.
 */

/**
 * Function: AppHome
 * Description: Displays the home page for authenticated users.
 * Params:
 * - None.
 * Returns:
 * - A JSX element displaying the home page for authenticated users.
 */
const AppHome = () => {
  const { clearSession, user } = useAuthStore(
    useShallow((state) => ({
      clearSession: state.clearSession,
      user: state.user,
    })),
  )

  if (!user) {
    return <Navigate replace to="/register" />
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12 text-slate-900">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 rounded-4xl border border-slate-200 bg-white p-8 shadow-[0_30px_80px_rgba(15,23,42,0.08)]">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Protected Route</p>
          <h1 className="text-4xl font-semibold tracking-tight">Welcome back, {user.username}</h1>
          <p className="text-base text-slate-600">
            This page is protected and requires a valid session. You can sign out using the button below.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex rounded-full bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700">
            {user.email}
          </span>
          <button
            type="button"
            onClick={clearSession}
            className="rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
          >
            Sign Out
          </button>
        </div>
      </div>
    </main>
  )
}

/**
 * Function: App
 * Description: The main application component that defines the routing structure.
 * Params:
 * - None.
 * Returns:
 * - A JSX element defining the application's routing structure.
 */
function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate replace to="/register" />} />
      <Route path="/register" element={<AuthScreen mode="register" />} />
      <Route path="/login" element={<AuthScreen mode="login" />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/app" element={<AppHome />} />
      </Route>
      <Route path="*" element={<Navigate replace to="/register" />} />
    </Routes>
  )
}

export default App
