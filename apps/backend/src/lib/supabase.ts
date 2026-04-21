/**
 * @filename supabase.ts
 * @date 2026-03-10
 * @author Salman Nouman Abulqasim
 * @fileoverview Supabase client factory for backend authentication requests
 * @version 1.0.0

 */

import { createClient } from '@supabase/supabase-js';

import { env } from '../config/env.js';

/**
 * Function: createSupabaseServerClient
 * Description: Creates a backend Supabase client configured for stateless server-side authentication calls.
 * Params:
 * - None.
 * Returns:
 * - A Supabase client instance configured with the project URL and anonymous key.
 */
/**
 * Function: createSupabaseServerClient
 * Description: Creates a backend Supabase client. When userToken is supplied the
 *   JWT is forwarded as the global Authorization header so RLS policies that
 *   rely on auth.uid() work correctly without a service-role key.
 * Params:
 * - userToken: Optional Supabase access token from the requesting user.
 * Returns:
 * - A Supabase client instance configured for the given auth context.
 */
export const createSupabaseServerClient = (userToken?: string) => {
  return createClient(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
    ...(userToken && {
      global: {
        headers: { Authorization: `Bearer ${userToken}` },
      },
    }),
  });
};
