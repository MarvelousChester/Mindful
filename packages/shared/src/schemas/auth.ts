/**
 * @filename auth.ts
 * @date 2026-03-13
 * @author Salman Nouman Abulqasim
 * @fileoverview Shared Zod schemas for E2E type-safe authentication
 */

import { z } from 'zod';

/**
 * constant: RegisterSchema
 * Description: Defines the schema for registration input.
 * Params: None
 * Returns: None
 */
export const registerSchema = z.object({
  username: z.string().trim().min(3).max(30),
  email: z.string().trim().email('Invalid email format'),
  password: z.string().min(6).max(72),
});

/**
 * constant: LoginSchema
 * Description: Defines the schema for login input.
 * Params: None
 * Returns: None
 */
export const loginSchema = z.object({
  email: z.string().trim().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

/**
 * Type: RegisterInput
 * Inferred from `registerSchema` for validated registration payloads.
 */
export type RegisterInput = z.infer<typeof registerSchema>;

/**
 * Type: LoginInput
 * Inferred from `loginSchema` for validated login payloads.
 */
export type LoginInput = z.infer<typeof loginSchema>;
