/**
 * @filename AuthScreen.tsx
 * @date 2026-03-19
 * @author Salman Nouman Abulqasim
 * @fileoverview Authentication screen component with registration and login forms
 * @version 1.0.0
 */

import { useState, type SubmitEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'
import { useShallow } from 'zustand/react/shallow'

import { AppHeader } from '../../components/AppHeader'
import { loginUser, registerUser } from './api'
import { useAuthStore } from './store'
import type { AuthFeedback, AuthMode, LoginPayload, RegisterPayload } from './types'

/**
 * Function: createInitialRegisterForm
 * Description: Creates an initial registration form with empty values.
 * Params: None
 * Returns:
 * - An object with empty username, email, and password values.
 */
const createInitialRegisterForm = (): RegisterPayload => ({
  username: '',
  email: '',
  password: '',
})

/**
 * Function: createInitialLoginForm
 * Description: Creates an initial login form with empty values.
 * Params: None
 * Returns:
 * - An object with empty email and password values.
 */
const createInitialLoginForm = (): LoginPayload => ({
  email: '',
  password: '',
})

/**
 * Constant: authCopy
 * Description: Contains the title and subtitle for each authentication mode.
 * Params: None
 * Returns:
 * - An object with title and subtitle for each authentication mode.
 */
const authCopy: Record<AuthMode, { title: string; subtitle: string }> = {
  register: {
    title: 'Begin Your Journey',
    subtitle: 'Create an account to start your practice.',
  },
  login: {
    title: 'Welcome Back',
    subtitle: 'Sign in to continue your mindful practice.',
  },
}

/**
 * Interface: AuthScreenProps
 * Description: Defines the props for the AuthScreen component.
 * Params:
 * - mode: The authentication mode (register or login).
 * Returns: None
 */
interface AuthScreenProps {
  mode: AuthMode
}


/**
 * Function: AuthScreen
 * Description: Authentication screen component with registration and login forms.
 * Params:
 * - mode: The authentication mode (register or login).
 * Returns: None
 */
export const AuthScreen = ({ mode }: AuthScreenProps) => {
  const navigate = useNavigate()
  const { accessToken, hasHydrated, setSession, user } = useAuthStore(
    useShallow((state) => ({
      accessToken: state.accessToken,
      hasHydrated: state.hasHydrated,
      setSession: state.setSession,
      user: state.user,
    })),
  )
  const [registerForm, setRegisterForm] = useState<RegisterPayload>(createInitialRegisterForm)
  const [loginForm, setLoginForm] = useState<LoginPayload>(createInitialLoginForm)
  const [feedback, setFeedback] = useState<AuthFeedback | null>(null)
  const [activeRequest, setActiveRequest] = useState<AuthMode | null>(null)

  if (!hasHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-slate-500">
        Loading your session...
      </div>
    )
  }

  if (accessToken && user) {
    return <Navigate replace to="/app" />
  }

  const content = authCopy[mode]
  const alternateRoute = mode === 'register' ? '/login' : '/register'
  const alternateLabel = mode === 'register' ? 'Log In' : 'Sign Up'
  const helperText =
    mode === 'register'
      ? 'Choose a username between 3 and 30 characters and a password with at least 6 characters.'
      : 'Use the same email and password you registered with.'

  /**
   * Function: handleRegisterChange
   * Description: Updates the registration form state when a field value changes.
   * Params:
   * - field: The field name to update.
   * - value: The new value for the field.
   * Returns: None
   */
  const handleRegisterChange = (field: keyof RegisterPayload, value: string) => {
    setRegisterForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  /**
   * Function: handleLoginChange
   * Description: Updates the login form state when a field value changes.
   * Params:
   * - field: The field name to update.
   * - value: The new value for the field.
   * Returns: None
   */
  const handleLoginChange = (field: keyof LoginPayload, value: string) => {
    setLoginForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  /**
   * Function: handleRegisterSubmit
   * Description: Handles the registration form submission.
   * Params:
   * - event: The form submission event.
   * Returns: None
   */
  const handleRegisterSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    setActiveRequest('register')
    setFeedback(null)

    try {
      const response = await registerUser(registerForm)

      if (response.data?.user) {
        setSession({
          accessToken: response.token,
          refreshToken: response.data.refreshToken,
          user: response.data.user,
        })
        navigate('/app', { replace: true })
      }

      setFeedback({
        tone: 'success',
        text:
          response.message ??
          'Your account has been created successfully. You can now continue to the app.',
      })
      setRegisterForm(createInitialRegisterForm())
    } catch (error) {
      setFeedback({
        tone: 'error',
        text: error instanceof Error ? error.message : 'Unable to create your account right now.',
      })
    } finally {
      setActiveRequest(null)
    }
  }

  /**
   * Function: handleLoginSubmit
   * Description: Handles the login form submission.
   * Params:
   * - event: The form submission event.
   * Returns: None
   */
  const handleLoginSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    setActiveRequest('login')
    setFeedback(null)

    try {
      const response = await loginUser(loginForm)

      if (response.data?.user) {
        setSession({
          accessToken: response.token,
          refreshToken: response.data.refreshToken,
          user: response.data.user,
        })
        navigate('/app', { replace: true })
      }

      setFeedback({
        tone: 'success',
        text: response.message ?? 'You have signed in successfully.',
      })
      setLoginForm(createInitialLoginForm())
    } catch (error) {
      setFeedback({
        tone: 'error',
        text: error instanceof Error ? error.message : 'Unable to sign you in right now.',
      })
    } finally {
      setActiveRequest(null)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f4f6f5] text-slate-900">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-24 h-80 w-80 rounded-full bg-white/70 blur-3xl" />
        <div className="absolute -bottom-24 -right-12 h-72 w-72 rounded-full bg-primary/30 blur-3xl" />
        <div className="absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <AppHeader />

      <div className="relative mx-auto flex min-h-[calc(100vh-73px)] max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">

        <main className="flex flex-1 items-center justify-center py-12">
          <section className="w-full max-w-md rounded-4xl border border-white/60 bg-white/80 p-8 shadow-[0_30px_80px_rgba(15,23,42,0.08)] backdrop-blur sm:p-10">
            <div className="mb-8 space-y-3 text-center">
              <h1 className="text-4xl font-semibold tracking-tight text-slate-900">{content.title}</h1>
              <p className="text-sm text-slate-500">{content.subtitle}</p>
            </div>

            <div className="mb-8 flex rounded-full bg-slate-100 p-1 text-sm font-medium text-slate-600">
              <Link
                to="/register"
                className={`flex-1 rounded-full px-4 py-2 text-center transition ${mode === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                  }`}
              >
                Register
              </Link>
              <Link
                to="/login"
                className={`flex-1 rounded-full px-4 py-2 text-center transition ${mode === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                  }`}
              >
                Login
              </Link>
            </div>

            {feedback ? (
              <div
                className={`mb-6 rounded-2xl border px-4 py-3 text-sm ${feedback.tone === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-rose-200 bg-rose-50 text-rose-700'
                  }`}
              >
                {feedback.text}
              </div>
            ) : null}

            {mode === 'register' ? (
              <form className="space-y-5" onSubmit={handleRegisterSubmit}>
                <label className="block space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-700">Username</span>
                  <input
                    required
                    minLength={3}
                    maxLength={30}
                    autoComplete="username"
                    value={registerForm.username}
                    onChange={(event) => handleRegisterChange('username', event.target.value)}
                    placeholder="Choose a username"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/20"
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-700">Email Address</span>
                  <input
                    required
                    type="email"
                    autoComplete="email"
                    value={registerForm.email}
                    onChange={(event) => handleRegisterChange('email', event.target.value)}
                    placeholder="name@example.com"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/20"
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-700">Password</span>
                  <input
                    required
                    type="password"
                    minLength={6}
                    maxLength={72}
                    autoComplete="new-password"
                    value={registerForm.password}
                    onChange={(event) => handleRegisterChange('password', event.target.value)}
                    placeholder="Create a strong password"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/20"
                  />
                </label>

                <p className="text-xs italic text-slate-400">{helperText}</p>

                <button
                  type="submit"
                  disabled={activeRequest === 'register'}
                  className="w-full rounded-2xl bg-primary px-4 py-4 text-base font-semibold text-white shadow-[0_18px_30px_rgba(159,216,203,0.35)] transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {activeRequest === 'register' ? 'Creating Account...' : 'Sign Up'}
                </button>
              </form>
            ) : (
              <form className="space-y-5" onSubmit={handleLoginSubmit}>
                <label className="block space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-700">Email Address</span>
                  <input
                    required
                    type="email"
                    autoComplete="email"
                    value={loginForm.email}
                    onChange={(event) => handleLoginChange('email', event.target.value)}
                    placeholder="name@example.com"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/20"
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-700">Password</span>
                  <input
                    required
                    type="password"
                    autoComplete="current-password"
                    value={loginForm.password}
                    onChange={(event) => handleLoginChange('password', event.target.value)}
                    placeholder="Enter your password"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/20"
                  />
                </label>

                <p className="text-xs italic text-slate-400">{helperText}</p>
                
                <button
                  type="submit"
                  disabled={activeRequest === 'login'}
                  className="w-full rounded-2xl bg-primary px-4 py-4 text-base font-semibold text-white shadow-[0_18px_30px_rgba(159,216,203,0.35)] transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {activeRequest === 'login' ? 'Signing In...' : 'Log In'}
                </button>

                {import.meta.env.DEV && (
                  <button
                    type="button"
                    onClick={() => {
                      setLoginForm({
                        email: import.meta.env.VITE_DEV_EMAIL,
                        password: import.meta.env.VITE_DEV_PASSWORD,
                      })
                    }}
                    className="w-full rounded-2xl border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-400 transition hover:border-slate-400 hover:text-slate-600"
                  >
                    Dev: Fill credentials
                  </button>
                )}
              </form>
            )}

            <p className="mt-6 text-center text-sm text-slate-500">
              {mode === 'register' ? 'Already have an account?' : 'Need an account?'}{' '}
              <Link to={alternateRoute} className="font-semibold text-[#8ccabd] transition hover:text-[#73b9aa]">
                {alternateLabel}
              </Link>
            </p>
          </section>
        </main>

        <footer className="space-y-6 pb-4 text-center text-slate-500">
          <div className="space-y-3">
            <p className="text-2xl italic text-slate-500">"Peace comes from within. Do not seek it without."</p>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Buddha</p>
          </div>
        </footer>
      </div>
    </div>
  )
}
