/**
 * @filename api.ts
 * @date 2026-04-15
 * @author Jasmine Kaur
 * @fileoverview Fetch wrappers for calling the Mindful backend API.
 *   apiFetch  — unauthenticated requests
 *   authFetch — automatically attaches the logged-in user's Bearer token
 */

import { useAuthStore } from '../features/auth/store'

const BASE_URL = import.meta.env.VITE_API_URL as string;

/**
 * Function: apiFetch
 * Description: Wraps the native fetch API with the base URL and default headers.
 *   Throws an error if the response is not ok (4xx / 5xx).
 * Params:
 * - path: API path starting with /  e.g. '/api/meditations'
 * - options: Optional fetch RequestInit (method, body, headers, etc.)
 * Returns:
 * - Parsed JSON response body
 */
export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.message ?? `Request failed: ${res.status}`);
  }

  return json as T;
}

/**
 * Function: authFetch
 * Description: Wraps apiFetch by automatically injecting the logged-in user's
 *   JWT as an Authorization: Bearer header from the Zustand auth store.
 *   Use this for any endpoint that requires authentication (/api/history, etc.).
 * Params:
 * - path: API path starting with /  e.g. '/api/history'
 * - options: Optional fetch RequestInit (method, body, headers, etc.)
 * Returns:
 * - Parsed JSON response body
 */
export async function authFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = useAuthStore.getState().accessToken
  return apiFetch<T>(path, {
    ...options,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  })
}
