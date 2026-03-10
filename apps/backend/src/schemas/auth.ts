/**
 * @filename auth.ts
 * @date 2026-03-09
 * @author Salman Nouman Abulqasim
 * @fileoverview Validation schemas and inferred types for authentication requests
 * @version 1.0.0
 */

import { z } from 'zod';

/**
 * Constant: registerSchema
 * Description: Validates the request body used when a new user signs up through the backend auth endpoint.
 * Properties:
 * - username: Required username with a minimum length of 3 and maximum length of 30.
 * - email: Required email address in a valid email format.
 * - password: Required password with a minimum length of 6 and maximum length of 72.
 */
export const registerSchema = z.object({
  username: z.string().trim().min(3).max(30),
  email: z.string().trim().pipe(z.email()),
  password: z.string().min(6).max(72),
});

/**
 * Constant: loginSchema
 * Description: Validates the request body used when an existing user signs in through the backend auth endpoint.
 * Properties:
 * - email: Required email address in a valid email format.
 * - password: Required password value provided by the user.
 */
export const loginSchema = z.object({
  email: z.string().trim().pipe(z.email()),
  password: z.string().min(1),
});

/**
 * Type: RegisterInput
 * Description: TypeScript type inferred from `registerSchema` for validated registration payloads.
 */
export type RegisterInput = z.infer<typeof registerSchema>;

/**
 * Type: LoginInput
 * Description: TypeScript type inferred from `loginSchema` for validated login payloads.
 */
export type LoginInput = z.infer<typeof loginSchema>;
