/**
 * @filename store.ts
 * @date 2026-03-16
 * @author Salman Nouman Abulqasim
 * @fileoverview Authentication store for managing user session state
 * @version 1.0.0
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { AuthUser } from './types'

/**
 * Interface: AuthState
 * Description: Defines the state for the authentication store.
 * Params:
 * - accessToken: The access token for the user.
 * - refreshToken: The refresh token for the user.
 * - user: The user object.
 * - hasHydrated: Whether the store has been hydrated.
 * Returns: None
 */
interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  user: AuthUser | null
  hasHydrated: boolean
  setSession: (payload: {
    accessToken?: string
    refreshToken?: string
    user?: AuthUser
  }) => void
  clearSession: () => void
  setHasHydrated: (value: boolean) => void
}

/**
 * Function: useAuthStore
 * Description: Defines the state for the authentication store.
 * Params:
 * - accessToken: The access token for the user.
 * - refreshToken: The refresh token for the user.
 * - user: The user object.
 * - hasHydrated: Whether the store has been hydrated.
 * Functions:
 * - setSession: Function to set the session.
 * - clearSession: Function to clear the session.
 * - setHasHydrated: Function to set the hydration status.
 * Returns: None
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      hasHydrated: false,
      setSession: ({ accessToken, refreshToken, user }) => {
        set((state) => ({
          accessToken: accessToken ?? state.accessToken,
          refreshToken: refreshToken ?? state.refreshToken,
          user: user ?? state.user,
        }))
      },
      clearSession: () => {
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
        })
      },
      setHasHydrated: (value) => {
        set({
          hasHydrated: value,
        })
      },
    }),
    {
      name: 'mindful-auth',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    },
  ),
)
