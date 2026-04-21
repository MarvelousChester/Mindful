/**
 * @filename history.controller.ts
 * @date 2026-04-16
 * @author Jasmine Kaur
 * @fileoverview Controller for listening history endpoints
 * @version 1.0.0
 */

import type { Request, Response } from 'express';
import { getHistoryQuerySchema, recordHistorySchema } from 'shared';
import { deleteCachedPrefix, getCachedValue, setCachedValue } from '../../lib/cache.js';
import { createSupabaseServerClient } from '../../lib/supabase.js';

const HISTORY_FILTERS_CACHE_PREFIX = 'history:filters:';
const HISTORY_FILTERS_TTL_MS = 60 * 1000;

interface NamedCount {
  count: number;
  name: string;
}

interface HistoryFiltersResponse {
  categories: NamedCount[];
  languages: NamedCount[];
}

/**
 * Function: extractToken
 * Description: Pulls the Bearer JWT out of the Authorization header.
 */
function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  return header.slice(7);
}

function normalizeLanguage(language: string | null | undefined): string {
  const value = (language ?? '').trim();
  return value.length > 0 ? value : 'Unknown';
}

async function resolveTrackIdsForCategory(
  category: string | undefined,
): Promise<string[] | null> {
  if (!category) return null;

  const supabase = createSupabaseServerClient();

  const { data: categoryData } = await supabase
    .from('categories')
    .select('id')
    .ilike('name', category)
    .single();

  if (!categoryData) return [];

  const { data: trackCategoriesData } = await supabase
    .from('track_categories')
    .select('track_id')
    .eq('category_id', categoryData.id);

  return trackCategoriesData?.map((row: { track_id: string }) => row.track_id) || [];
}

async function resolveFilteredTrackIds(
  opts: { category?: string; languages: string[]; search?: string },
): Promise<string[] | null> {
  const hasTrackFilter = Boolean(opts.category || opts.search || opts.languages.length > 0);
  if (!hasTrackFilter) return null;

  const supabase = createSupabaseServerClient();
  const categoryTrackIds = await resolveTrackIdsForCategory(opts.category);

  if (categoryTrackIds && categoryTrackIds.length === 0) return [];

  let query = supabase.from('tracks').select('id');

  if (opts.search) {
    query = query.ilike('title', `%${opts.search}%`);
  }

  if (opts.languages.length > 0) {
    query = query.in('language', opts.languages);
  }

  if (categoryTrackIds) {
    query = query.in('id', categoryTrackIds);
  }

  const { data, error } = await query;
  if (error) {
    throw error;
  }

  return (data || []).map((row: { id: string }) => row.id);
}

/**
 * Function: getHistory
 * Description: Returns the authenticated user's listening history joined with
 *   track and school data, ordered by listened_at descending (most recent first).
 */
export const getHistory = async (req: Request, res: Response) => {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const parsed = getHistoryQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: 'Invalid query parameters',
      error: parsed.error.flatten(),
    });
  }

  const { search, category, language, page, limit } = parsed.data;
  const supabase = createSupabaseServerClient(token);

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }

  let filteredTrackIds: string[] | null = null;
  try {
    filteredTrackIds = await resolveFilteredTrackIds({
      category,
      languages: language,
      search,
    });
  } catch (error: any) {
    console.error('[getHistory] Track filter error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch history',
      detail: error?.message ?? 'Unexpected error',
    });
  }

  if (filteredTrackIds && filteredTrackIds.length === 0) {
    return res.status(200).json({
      success: true,
      data: [],
      meta: { page, limit, totalCount: 0, totalPages: 0 },
    });
  }

  let countQuery = supabase
    .from('listening_history')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id);

  if (filteredTrackIds) {
    countQuery = countQuery.in('track_id', filteredTrackIds);
  }

  const { count, error: countError } = await countQuery;
  if (countError) {
    console.error('[getHistory] Supabase count error:', countError);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch history',
      detail: countError.message,
    });
  }

  const totalCount = count ?? 0;
  const totalPages = totalCount === 0 ? 0 : Math.ceil(totalCount / limit);
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let dataQuery = supabase
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
    .range(from, to);

  if (filteredTrackIds) {
    dataQuery = dataQuery.in('track_id', filteredTrackIds);
  }

  const { data, error } = await dataQuery;

  if (error) {
    console.error('[getHistory] Supabase data error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch history',
      detail: error.message,
    });
  }

  const results = (data || [])
    .map((row: any) => {
      const track = row.tracks;
      if (!track) return null;

      const rawLogo = track.schools ? track.schools.logo_path : null;
      let universityLogo = undefined;

      if (rawLogo) {
        universityLogo = supabase.storage.from('schools').getPublicUrl(rawLogo).data.publicUrl;
      }

      const categoriesList = (track.track_categories || [])
        .map((tc: any) => tc.categories?.name)
        .filter(Boolean);

      return {
        id: track.id,
        title: track.title,
        duration: track.duration_seconds,
        language: track.language,
        audioUrl: track.audio_path,
        thumbnailUrl: universityLogo,
        university: track.schools?.name || '',
        categories: categoriesList,
        listenedAt: row.listened_at,
      };
    })
    .filter(Boolean);

  return res.status(200).json({
    success: true,
    data: results,
    meta: { page, limit, totalCount, totalPages },
  });
};

/**
 * Function: getHistoryFilters
 * Description: Returns category/language filter options derived only from
 *   the authenticated user's history tracks.
 */
export const getHistoryFilters = async (req: Request, res: Response) => {
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

  const cacheKey = `${HISTORY_FILTERS_CACHE_PREFIX}${user.id}:v1`;
  const cached = getCachedValue<HistoryFiltersResponse>(cacheKey);
  if (cached) {
    return res.status(200).json({ success: true, data: cached });
  }

  const { data: historyRows, error: historyError } = await supabase
    .from('listening_history')
    .select('track_id')
    .eq('user_id', user.id);

  if (historyError) {
    console.error('[getHistoryFilters] Supabase history error:', historyError);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch history filters',
      detail: historyError.message,
    });
  }

  const trackIds = [...new Set((historyRows || []).map((row: { track_id: string }) => row.track_id))];
  if (trackIds.length === 0) {
    const emptyPayload = { categories: [], languages: [] };
    setCachedValue(cacheKey, emptyPayload, HISTORY_FILTERS_TTL_MS);
    return res.status(200).json({ success: true, data: emptyPayload });
  }

  const [{ data: tracks, error: tracksError }, { data: trackCategories, error: categoryError }] =
    await Promise.all([
      supabase.from('tracks').select('id, language').in('id', trackIds),
      supabase.from('track_categories').select('track_id, categories ( name )').in('track_id', trackIds),
    ]);

  if (tracksError || categoryError) {
    console.error('[getHistoryFilters] Supabase join error:', tracksError || categoryError);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch history filters',
      detail: (tracksError || categoryError)?.message,
    });
  }

  const languageCountMap = new Map<string, number>();
  for (const row of tracks || []) {
    const name = normalizeLanguage((row as { language: string }).language);
    languageCountMap.set(name, (languageCountMap.get(name) || 0) + 1);
  }

  const categoryCountMap = new Map<string, number>();
  for (const row of trackCategories || []) {
    const name = ((row as any).categories?.name ?? '').trim();
    if (!name) continue;
    categoryCountMap.set(name, (categoryCountMap.get(name) || 0) + 1);
  }

  const payload: HistoryFiltersResponse = {
    categories: [...categoryCountMap.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    languages: [...languageCountMap.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  };

  setCachedValue(cacheKey, payload, HISTORY_FILTERS_TTL_MS);
  return res.status(200).json({ success: true, data: payload });
};

/**
 * Function: recordHistory
 * Description: Inserts a new listening history entry for the authenticated user.
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

  deleteCachedPrefix(`${HISTORY_FILTERS_CACHE_PREFIX}${user.id}:`);
  return res.status(201).json({ success: true, message: 'History recorded' });
};
