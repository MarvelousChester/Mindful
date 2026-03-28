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
import { MediaPlayer } from './features/media/MediaPlayer'
import type { Track } from './features/media/types'

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

const breathingMeditation: Track = {
  id: "breathing-meditation",
  title: "Breathing Meditation",
  description: "",
  duration: 5 * 60 + 3, // harcoded for now, will be fetched from backend later
  audioUrl: "https://mcgill.ca/wellness-hub/files/wellness-hub/breathing_meditation_0.mp3",
  university: "McGill",
  category: ["Up To 10 Minutes"],
};
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
        <Route path="/app" element={<MediaPlayer track={breathingMeditation} />} />
      </Route>
      <Route path="*" element={<Navigate replace to="/register" />} />
    </Routes>
  )
}

export default App
