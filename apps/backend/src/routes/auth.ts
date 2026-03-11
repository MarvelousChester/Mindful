/**
 * @filename auth.ts
 * @date 2026-03-10
 * @author Salman Nouman Abulqasim
 * @fileoverview Authentication routes for user registration and login using Supabase Auth
 * @version 1.0.0
 */

import { Router, type Request, type Response, type Router as ExpressRouter } from 'express';
import type { AuthError, User as SupabaseAuthUser } from '@supabase/supabase-js';
import { z } from 'zod';

import { createSupabaseServerClient } from '../lib/supabase.js';
import { loginSchema, registerSchema } from '../schemas/auth.js';

const authRouter: ExpressRouter = Router();

/**
 * Function: mapUser
 * Description: Maps a Supabase Auth user object to the app-level response shape returned by the backend.
 * Params:
 * - user: The Supabase Auth user that was created or authenticated.
 * Returns:
 * - A normalized user object with camelCase fields used by the frontend.
 */
const mapUser = (user: SupabaseAuthUser) => ({
  id: user.id,
  username:
    typeof user.user_metadata.username === 'string' && user.user_metadata.username.length > 0
      ? user.user_metadata.username
      : user.email?.split('@')[0] ?? '',
  email: user.email ?? '',
  createdAt: user.created_at,
});

/**
 * Function: getErrorStatus
 * Description: Maps a Supabase authentication error to the most appropriate HTTP status code.
 * Params:
 * - error: The Supabase Auth error returned from a failed authentication request.
 * - fallbackStatus: The default HTTP status to use when the error does not map to a more specific status.
 * Returns:
 * - The HTTP status code that should be sent in the API response.
 */
const getErrorStatus = (error: AuthError, fallbackStatus: number): number => {
  const message = error.message.toLowerCase();

  if (message.includes('already registered') || message.includes('already been registered')) {
    return 409;
  }

  if (message.includes('invalid login credentials')) {
    return 401;
  }

  return typeof error.status === 'number' && error.status >= 400 && error.status < 500
    ? error.status
    : fallbackStatus;
};

/**
 * Function: formatValidationError
 * Description: Converts a Zod validation error into a structured tree format suitable for API responses.
 * Params:
 * - error: The Zod validation error produced by `safeParse`.
 * Returns:
 * - A treeified validation error object produced by the Zod v4 top-level formatter.
 */
const formatValidationError = (error: z.ZodError) => z.treeifyError(error);

/**
 * Function: sendValidationError
 * Description: Sends a consistent validation error response for request bodies that fail Zod parsing.
 * Params:
 * - res: The Express response used to send the validation error payload.
 * - message: A human-readable message describing which request payload failed validation.
 * - error: The Zod validation error produced by `safeParse`.
 * Returns:
 * - An Express JSON response with a 400 status and treeified Zod validation details.
 */
const sendValidationError = (res: Response, message: string, error: z.ZodError) => {
  return res.status(400).json({
    success: false,
    message,
    error: {
      type: 'validation_error',
      details: formatValidationError(error),
    },
  });
};

/**
 * Function: registerUser
 * Description: Validates the registration payload and creates a new Supabase Auth user account.
 * Params:
 * - req: The Express request containing username, email, and password in the request body.
 * - res: The Express response used to send the registration result back to the client.
 * Returns:
 * - A JSON response containing the registration status, message, and optional session data.
 */
const registerUser = async (req: Request, res: Response) => {
  const parsedBody = registerSchema.safeParse(req.body);

  if (!parsedBody.success) {
    return sendValidationError(res, 'Invalid registration payload', parsedBody.error);
  }

  const supabase = createSupabaseServerClient();
  const { email, password, username } = parsedBody.data;
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
      },
    },
  });

  if (error) {
    return res.status(getErrorStatus(error, 400)).json({
      success: false,
      message: error.message,
    });
  }

  return res.status(201).json({
    success: true,
    message: data.session
      ? 'User registered successfully'
      : 'Registration successful. Please check your email to confirm your account.',
    token: data.session?.access_token,
    data: data.user
      ? {
          user: mapUser(data.user),
          refreshToken: data.session?.refresh_token,
        }
      : undefined,
  });
};

/**
 * Function: loginUser
 * Description: Validates login credentials and creates a Supabase Auth session for an existing user.
 * Params:
 * - req: The Express request containing email and password in the request body.
 * - res: The Express response used to send the login result back to the client.
 * Returns:
 * - A JSON response containing the login status, access token, refresh token, and user data.
 */
const loginUser = async (req: Request, res: Response) => {
  const parsedBody = loginSchema.safeParse(req.body);

  if (!parsedBody.success) {
    return sendValidationError(res, 'Invalid login payload', parsedBody.error);
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsedBody.data);

  if (error) {
    return res.status(getErrorStatus(error, 401)).json({
      success: false,
      message: error.message,
    });
  }

  if (!data.session || !data.user) {
    return res.status(401).json({
      success: false,
      message: 'Unable to create an authenticated session',
    });
  }

  return res.status(200).json({
    success: true,
    token: data.session.access_token,
    data: {
      user: mapUser(data.user),
      refreshToken: data.session.refresh_token,
      expiresAt: data.session.expires_at,
    },
  });
};

authRouter.post('/register', registerUser);
authRouter.post('/login', loginUser);

export default authRouter;
