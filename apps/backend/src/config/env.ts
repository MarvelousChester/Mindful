/**
 * @filename env.ts
 * @date 2026-03-09
 * @author Salman Nouman Abulqasim
 * @fileoverview Environment configuration schema using Zod
 * @version 1.0.0
 */

import { z } from 'zod';

/**
 * Constant: envSchema
 * Description: Zod schema used to validate all required backend environment variables at startup.
 * Properties:
 * - NODE_ENV: Optional runtime mode for the backend process.
 * - PORT: Optional port used by the Express server in local development.
 * - SUPABASE_URL: Base URL of the Supabase project used for authentication requests.
 * - SUPABASE_ANON_KEY: Public anonymous key used by the backend to call Supabase Auth endpoints.
 */
const envSchema = z.object({
  // Environment
  NODE_ENV: z.enum(['development', 'test', 'production']).optional(),
  // Server
  PORT: z.coerce.number().int().positive().optional(),
  // Supabase
  SUPABASE_URL: z.url(),
  SUPABASE_ANON_KEY: z.string().min(1),
});

/**
 * Constant: env
 * Description: Parsed and validated environment configuration available to the backend modules.
 * Returns:
 * - A strongly typed object containing the validated environment variables.
 */
export const env = envSchema.parse(process.env);
