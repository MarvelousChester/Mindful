/**
 * @filename auth.controller.ts
 * @date 2026-03-15
 * @author Salman Nouman Abulqasim
 * @fileoverview Authentication controller for handling user registration and login
 * @version 1.0.0
 */

import type { Request, Response } from 'express';
import type { AuthError, User as SupabaseAuthUser } from '@supabase/supabase-js';
import { z } from 'zod';
import { loginSchema, registerSchema } from 'shared';

import { createSupabaseServerClient } from '../../lib/supabase.js';

/**
 * Function: mapUser
 * Description: Maps a Supabase authentication user object to the app-level response shape returned by the backend.
 * Params:
 * - user: The Supabase authentication user object.
 * Returns:
 * - An object containing the user's ID, username, email, and creation date.
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
 * - error: The Supabase authentication error object.
 * - fallbackStatus: The default HTTP status code to return if the error message doesn't match any known cases.
 * Returns:
 * - An HTTP status code that best represents the error.
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
 * - error: The Zod validation error object.
 * Returns:
 * - A treeified error object that can be sent in the API response.
 */
const formatValidationError = (error: z.ZodError) => z.treeifyError(error);

/**
 * Function: sendValidationError
 * Description: Sends a consistent validation error response for request bodies that fail Zod parsing.
 * Params:
 * - res: The Express response object.
 * - message: A human-readable error message.
 * - error: The Zod validation error object.
 * Returns:
 * - A JSON response with the validation error details.
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
 * - req: The Express request object containing the registration data.
 * - res: The Express response object to send the registration result.
 * Returns:
 * - A JSON response indicating success or failure.
 */
export const registerUser = async (req: Request, res: Response) => {
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
    message: 'User registered successfully',
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
 * - req: The Express request object containing the login data.
 * - res: The Express response object to send the login result.
 * Returns:
 * - A JSON response indicating success or failure.
 */
export const loginUser = async (req: Request, res: Response) => {
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
