/**
 * @filename history.controller.ts
 * @date 2026-04-16
 * @author Jasmine Kaur
 * @fileoverview Controller for listening history endpoints
 * @version 1.0.0
 */

import type { Request, Response } from 'express';
import { recordHistorySchema } from 'shared';
import { createSupabaseServerClient } from '../../lib/supabase.js';


/**
 * Function: extractToken
 * Description: Pulls the Bearer JWT out of the Authorization header.
 * Params:
 * - req: Express request
 * Returns:
 * - The raw token string, or null if the header is absent / malformed.
 */
function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  return header.slice(7);
}


interface TrackJoinRow {
  id: string;
  title: string;
  duration_seconds: number | null;
  language: string;
  audio_path: string;
  schools: { name: string; logo_path: string } | null;
  track_categories: { categories: { name: string } | null }[];
}


/**
 * Function: getHistory
 * Description: Returns the authenticated user's listening history joined with
 *   track and school data, ordered by listened_at descending (most recent first).
 * Params:
 * - req: Express request — must include Authorization: Bearer <token>
 * - res: Express response
 * Returns:
 * - 200 with { success: true, data: HistoryTrack[] }
 * - 401 if the token is missing or invalid
 * - 500 on unexpected database error
 */
export const getHistory = async (req: Request, res: Response) => {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const supabase = createSupabaseServerClient(token);

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }

  const { data, error } = await supabase
    .from('listening_history')
    .select(
      `
      id,
      listened_at,
      progress_seconds,
      tracks (
        id, title, duration_seconds, language, audio_path,
        schools ( name, logo_path ),
        track_categories ( categories ( name ) )
      )
    `,
    )
    .eq('user_id', user.id)
    .order('listened_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('[getHistory] Supabase error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch history',
      detail: error.message,
    });
  }

  const results = (data ?? [])
    .map((row) => {
      const track = row.tracks as unknown as TrackJoinRow | null;
      if (!track) return null;

      return {
        id: track.id,
        title: track.title,
        duration: track.duration_seconds,
        language: track.language,
        audioUrl: track.audio_path,
        thumbnailUrl: undefined,
        university: track.schools?.name ?? '',
        categories: (track.track_categories ?? [])
          .map((tc) => tc.categories?.name)
          .filter(Boolean) as string[],
        listenedAt: row.listened_at as string,
      };
    })
    .filter(Boolean);

  return res.status(200).json({ success: true, data: results });
};

/**
 * Function: recordHistory
 * Description: Inserts a new listening history entry for the authenticated user.
 * Params:
 * - req: Express request — Authorization header + body { meditationId, listenedDuration }
 * - res: Express response
 * Returns:
 * - 201 with { success: true, message: 'History recorded' }
 * - 400 if the request body fails Zod validation
 * - 401 if the token is missing or invalid
 * - 500 on unexpected database error
 */
export const recordHistory = async (req: Request, res: Response) => {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const parsed = recordHistorySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: 'Invalid request body',
      error: parsed.error.flatten(),
    });
  }

  const { meditationId, listenedDuration } = parsed.data;

  const supabase = createSupabaseServerClient(token);

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }

  const { data: existingRecords } = await supabase
    .from('listening_history')
    .select('id')
    .eq('user_id', user.id)
    .eq('track_id', meditationId)
    .order('listened_at', { ascending: false })
    .limit(1);

  const existing = existingRecords && existingRecords.length > 0 ? existingRecords[0] : null;

  let error;

  if (existing) {
    const { error: updateError } = await supabase
      .from('listening_history')
      .update({
        progress_seconds: listenedDuration,
        listened_at: new Date().toISOString(),
      })
      .eq('id', existing.id);
    error = updateError;
  } else {
    const { error: insertError } = await supabase
      .from('listening_history')
      .insert({
        user_id: user.id,
        track_id: meditationId,
        progress_seconds: listenedDuration,
      });
    error = insertError;
  }

  if (error) {
    console.error('[recordHistory] Supabase error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to record history',
      detail: error.message,
    });
  }

  return res.status(201).json({ success: true, message: 'History recorded' });
};
