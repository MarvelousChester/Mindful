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
export const createSupabaseServerClient = () => {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
};
