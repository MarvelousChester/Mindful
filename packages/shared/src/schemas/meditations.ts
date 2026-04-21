/**
 * @filename meditations.ts
 * @date 2026-04-15
 * @author Jasmine Kaur
 * @fileoverview Shared Zod schemas for meditation discovery and history endpoints
 */

import { z } from 'zod';

/**
 * constant: getMeditationsQuerySchema
 * Description: Validates optional query parameters for GET /api/meditations.
 * All fields are optional — omitting them returns the full unfiltered list.
 * Params: None
 * Returns: None
 */
export const getMeditationsQuerySchema = z.object({
  category: z.string().trim().min(1).optional(),
  search: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

/**
 * constant: recordHistorySchema
 * Description: Validates the request body for POST /api/history.
 * Requires a valid meditation UUID and a non-negative duration in seconds.
 * Params: None
 * Returns: None
 */
export const recordHistorySchema = z.object({
  meditationId: z.string().uuid('meditationId must be a valid UUID'),
  listenedDuration: z.number().int().nonnegative('listenedDuration must be 0 or more seconds'),
});

/**
 * Type: GetMeditationsQuery
 * Inferred from `getMeditationsQuerySchema` for validated query params.
 */
export type GetMeditationsQuery = z.infer<typeof getMeditationsQuerySchema>;

/**
 * Type: RecordHistoryInput
 * Inferred from `recordHistorySchema` for validated history payloads.
 */
export type RecordHistoryInput = z.infer<typeof recordHistorySchema>;
