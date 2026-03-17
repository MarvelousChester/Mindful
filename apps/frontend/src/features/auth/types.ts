/**
 * @filename types.ts
 * @date 2026-03-16
 * @author Salman Nouman Abulqasim
 * @fileoverview Authentication types for managing user session state
 * @version 1.0.0
 */

import { type RegisterInput, type LoginInput } from 'shared'

/**
 * Type: AuthMode
 * Description: The authentication mode (register or login).
 */
export type AuthMode = 'register' | 'login'

/**
 * Type: AppRoute
 * Description: The application route (register, login, or app).
 */
export type AppRoute = AuthMode | 'app'

/**
 * Interface: AuthFeedback
 * Description: The feedback for the authentication process.
 */
export interface AuthFeedback {
  tone: 'error' | 'success'
  text: string
}

/**
 * Interface: AuthUser
 * Description: The user object for the authentication process.
 */
export interface AuthUser {
  id: string
  username: string
  email: string
  createdAt: string
}

/**
 * Type: RegisterPayload
 * Description: The payload for the register request.
 */
export type RegisterPayload = RegisterInput

/**
 * Type: LoginPayload
 * Description: The payload for the login request.
 */
export type LoginPayload = LoginInput

/**
 * Interface: ValidationErrorPayload
 * Description: The payload for the validation error.
 */
export interface ValidationErrorPayload {
  type?: string
  details?: unknown
}

/**
 * Interface: AuthApiResponse
 * Description: The response for the authentication API.
 */
export interface AuthApiResponse<T> {
  success: boolean
  message?: string
  token?: string
  data?: T
  error?: ValidationErrorPayload
}

/**
 * Interface: RegisterResponseData
 * Description: The response data for the register request.
 */
export interface RegisterResponseData {
  user?: AuthUser
  refreshToken?: string
}

/**
 * Interface: LoginResponseData
 * Description: The response data for the login request.
 */
export interface LoginResponseData {
  user: AuthUser
  refreshToken: string
  expiresAt?: number
}
