/**
 * @filename meditations.controller.ts
 * @date 2026-04-15
 * @author Jasmine Kaur
 * @fileoverview Controller for meditation discovery endpoints
 * @version 1.0.0
 */

import type { Request, Response } from 'express';
import { getMeditationsQuerySchema } from 'shared';
import { getCachedValue, setCachedValue } from '../../lib/cache.js';
import { createSupabaseServerClient } from '../../lib/supabase.js';

const MEDITATION_FILTERS_CACHE_KEY = 'meditations:filters:v1';
const MEDITATION_FILTERS_TTL_MS = 5 * 60 * 1000;

interface NamedCount {
  count: number;
  name: string;
}

interface MeditationFiltersResponse {
  categories: NamedCount[];
  languages: NamedCount[];
}

function normalizeLanguage(language: string | null | undefined): string {
  const value = (language ?? '').trim();
  return value.length > 0 ? value : 'Unknown';
}

function applyTrackFilters<T extends { ilike: Function; in: Function }>(
  query: T,
  opts: { search?: string; languages: string[]; trackIdsForCategory: string[] | null },
): T {
  let scopedQuery = query;

  if (opts.search) {
    scopedQuery = scopedQuery.ilike('title', `%${opts.search}%`);
  }

  if (opts.languages.length > 0) {
    scopedQuery = scopedQuery.in('language', opts.languages);
  }

  if (opts.trackIdsForCategory) {
    scopedQuery = scopedQuery.in('id', opts.trackIdsForCategory);
  }

  return scopedQuery;
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

/**
 * Function: getMeditations
 * Description: Returns a paginated, optionally filtered list of tracks.
 * Params:
 * - req: Express request with optional query params
 * - res: Express response
 * Returns:
 * - 200 with { success: true, data: Track[], meta }
 * - 400 if query params fail Zod validation
 * - 500 on unexpected database error
 */
export const getMeditations = async (req: Request, res: Response) => {
  const parsed = getMeditationsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: 'Invalid query parameters',
      error: parsed.error.flatten(),
    });
  }

  const { search, category, language, page, limit } = parsed.data;
  const supabase = createSupabaseServerClient();

  const trackIdsForCategory = await resolveTrackIdsForCategory(category);
  if (trackIdsForCategory && trackIdsForCategory.length === 0) {
    return res.status(200).json({
      success: true,
      data: [],
      meta: { page, limit, totalCount: 0, totalPages: 0 },
    });
  }

  const filterOptions = {
    search,
    languages: language,
    trackIdsForCategory,
  };

  const countQuery = applyTrackFilters(
    supabase.from('tracks').select('id', { count: 'exact', head: true }),
    filterOptions,
  );

  const { count, error: countError } = await countQuery;
  if (countError) {
    console.error('[getMeditations] Supabase count error:', countError);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch meditations',
      detail: countError.message,
    });
  }

  const totalCount = count ?? 0;
  const totalPages = totalCount === 0 ? 0 : Math.ceil(totalCount / limit);

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const dataQuery = applyTrackFilters(
    supabase
      .from('tracks')
      .select(
        `
        id,
        title,
        duration_seconds,
        language,
        audio_path,
        schools ( name, logo_path ),
        track_categories ( categories ( name ) )
      `,
      )
      .order('created_at', { ascending: false })
      .range(from, to),
    filterOptions,
  );

  const { data, error } = await dataQuery;
  if (error) {
    console.error('[getMeditations] Supabase data error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch meditations',
      detail: error.message,
    });
  }

  const results = (data || []).map((row: any) => {
    const rawLogo = row.schools ? row.schools.logo_path : null;
    let universityLogo = undefined;

    if (rawLogo) {
      universityLogo = supabase.storage.from('schools').getPublicUrl(rawLogo).data.publicUrl;
    }

    const categoriesList = (row.track_categories || [])
      .map((tc: any) => tc.categories?.name)
      .filter(Boolean);

    return {
      id: row.id,
      title: row.title,
      duration: row.duration_seconds,
      language: row.language,
      audioUrl: row.audio_path,
      thumbnailUrl: universityLogo,
      university: row.schools?.name || '',
      categories: categoriesList,
    };
  });

  return res.status(200).json({
    success: true,
    data: results,
    meta: { page, limit, totalCount, totalPages },
  });
};

/**
 * Function: getMeditationFilters
 * Description: Returns all available categories and languages with counts.
 */
export const getMeditationFilters = async (_req: Request, res: Response) => {
  const cached = getCachedValue<MeditationFiltersResponse>(MEDITATION_FILTERS_CACHE_KEY);
  if (cached) {
    return res.status(200).json({ success: true, data: cached });
  }

  const supabase = createSupabaseServerClient();

  const [{ data: trackLanguages, error: trackError }, { data: trackCategories, error: categoryError }] =
    await Promise.all([
      supabase.from('tracks').select('language'),
      supabase.from('track_categories').select('track_id, categories ( name )'),
    ]);

  if (trackError || categoryError) {
    console.error('[getMeditationFilters] Supabase error:', trackError || categoryError);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch meditation filters',
      detail: (trackError || categoryError)?.message,
    });
  }

  const languageCountMap = new Map<string, number>();
  for (const row of trackLanguages || []) {
    const name = normalizeLanguage((row as { language: string }).language);
    languageCountMap.set(name, (languageCountMap.get(name) || 0) + 1);
  }

  const categoryCountMap = new Map<string, number>();
  for (const row of trackCategories || []) {
    const name = ((row as any).categories?.name ?? '').trim();
    if (!name) continue;
    categoryCountMap.set(name, (categoryCountMap.get(name) || 0) + 1);
  }

  const payload: MeditationFiltersResponse = {
    categories: [...categoryCountMap.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    languages: [...languageCountMap.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  };

  setCachedValue(MEDITATION_FILTERS_CACHE_KEY, payload, MEDITATION_FILTERS_TTL_MS);
  return res.status(200).json({ success: true, data: payload });
};

/**
 * Function: getMeditationById
 * Description: Returns the full details of a single track by its UUID.
 */
export const getMeditationById = async (req: Request, res: Response) => {
  const { id } = req.params;

  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from('tracks')
    .select(
      `
      id,
      title,
      duration_seconds,
      language,
      audio_path,
      schools ( name, logo_path ),
      track_categories ( categories ( name ) )
    `,
    )
    .eq('id', id)
    .single();

  if (error || !data) {
    return res.status(404).json({
      success: false,
      message: 'Meditation not found',
    });
  }

  const rawLogo = (data.schools as any)?.logo_path;
  let universityLogo = undefined;

  if (rawLogo) {
    universityLogo = supabase.storage.from('schools').getPublicUrl(rawLogo).data.publicUrl;
  }

  const categoriesList = ((data.track_categories as any) || [])
    .map((tc: any) => tc.categories?.name)
    .filter(Boolean);

  return res.status(200).json({
    success: true,
    data: {
      id: data.id,
      title: data.title,
      duration: data.duration_seconds,
      language: data.language,
      audioUrl: data.audio_path,
      thumbnailUrl: universityLogo,
      university: (data.schools as any)?.name || '',
      categories: categoriesList,
    },
  });
};
