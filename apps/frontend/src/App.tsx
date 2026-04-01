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
import { MediaScreen } from './features/media/MediaScreen'

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
      <Route path="/register" element={<AuthScreen mode="register" />} />
      <Route path="/login" element={<AuthScreen mode="login" />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<MediaScreen />} />
      </Route>
      <Route path="*" element={<Navigate replace to="/" />} />
    </Routes>
  )
}

export default App
