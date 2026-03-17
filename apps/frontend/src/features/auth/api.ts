/**
 * @filename api.ts
 * @date 2026-03-16
 * @author Salman Nouman Abulqasim
 * @fileoverview Authentication API functions for user registration and login
 * @version 1.0.0
 */

import type {
  AuthApiResponse,
  LoginPayload,
  LoginResponseData,
  RegisterPayload,
  RegisterResponseData,
} from './types'

/**
 * Function: parseErrorMessage
 * Description: Parses the error message from a failed API response.
 * Params:
 * - response: The Response object from the fetch call.
 * Returns:
 * - A string containing the error message.
 */
const parseErrorMessage = async (response: Response) => {
  try {
    const payload = (await response.json()) as AuthApiResponse<unknown>

    return payload.message ?? 'Something went wrong. Please try again.'
  } catch {
    return 'Something went wrong. Please try again.'
  }
}

/**
 * Function: createJsonRequest
 * Description: Creates a JSON request object for fetch calls.
 * Params:
 * - method: The HTTP method for the request.
 * - body: The request body as a JSON object.
 * Returns:
 * - A request object with the specified method and body.
 */
const createJsonRequest = <TBody>(method: 'POST', body: TBody) => ({
  method,
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(body),
})

/**
 * Function: registerUser
 * Description: Registers a new user with the backend.
 * Params:
 * - payload: The registration payload containing user details.
 * Returns:
 * - A promise that resolves to the registration response data.
 */
export const registerUser = async (payload: RegisterPayload) => {
  const response = await fetch('/api/auth/register', createJsonRequest('POST', payload))

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response))
  }

  return (await response.json()) as AuthApiResponse<RegisterResponseData>
}

/**
 * Function: loginUser
 * Description: Logs in an existing user with the backend.
 * Params:
 * - payload: The login payload containing user credentials.
 * Returns:
 * - A promise that resolves to the login response data.
 */
export const loginUser = async (payload: LoginPayload) => {
  const response = await fetch('/api/auth/login', createJsonRequest('POST', payload))

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response))
  }

  return (await response.json()) as AuthApiResponse<LoginResponseData>
}
