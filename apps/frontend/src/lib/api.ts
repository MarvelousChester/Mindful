/**
 * @filename api.ts
 * @date 2026-04-15
 * @author Jasmine Kaur
 * @fileoverview Thin fetch wrapper for calling the Mindful backend API
 */

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
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.message ?? `Request failed: ${res.status}`);
  }

  return json as T;
}
