/**
 * @filename meditations.controller.ts
 * @date 2026-04-15
 * @author Jasmine Kaur
 * @fileoverview Controller for meditation discovery endpoints
 * @version 1.0.0
 */

import type { Request, Response } from 'express';
import { getMeditationsQuerySchema } from 'shared';
import { createSupabaseServerClient } from '../../lib/supabase.js';

/**
 * Function: getMeditations
 * Description: Returns a paginated, optionally filtered list of tracks.
 *   - ?search=  filters by title (case-insensitive)
 *   - ?category= filters by category name
 *   - ?page= and ?limit= control pagination
 * Params:
 * - req: Express request with optional query params
 * - res: Express response
 * Returns:
 * - 200 with { success: true, data: Track[] }
 * - 400 if query params fail Zod validation
 * - 500 on unexpected database error
 */
export const getMeditations = async (req: Request, res: Response) => {
  //Validate query params with the shared Zod schema
  const parsed = getMeditationsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: 'Invalid query parameters',
      error: parsed.error.flatten(),
    });
  }

  const { search, category, page, limit } = parsed.data;

  //Build the Supabase query — join schools and categories
  const supabase = createSupabaseServerClient();

  let query = supabase
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
    .order('created_at', { ascending: false });

  // Apply optional filters
  if (search) {
    query = query.ilike('title', `%${search}%`);
  }

  // Apply category filter at database level before pagination
  let trackIdsForCategory: string[] | null = null;
  if (category) {
    const { data: categoryData } = await supabase
      .from('categories')
      .select('id')
      .ilike('name', category)
      .single();

    if (categoryData) {
      const { data: trackCategoriesData } = await supabase
        .from('track_categories')
        .select('track_id')
        .eq('category_id', categoryData.id);

      trackIdsForCategory = trackCategoriesData?.map((tc: any) => tc.track_id) || [];
    }

    if (trackIdsForCategory && trackIdsForCategory.length > 0) {
      query = query.in('id', trackIdsForCategory);
    } else {
      // No tracks match the category, return empty results
      return res.status(200).json({
        success: true,
        data: [],
      });
    }
  }

  // Apply pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data, error } = await query;

  if (error) {
    console.error('[getMeditations] Supabase error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch meditations',
      detail: error.message,
    });
  }

  let results = (data || []).map((row: any) => {
    let rawLogo = row.schools ? row.schools.logo_path : null;
    let universityLogo = undefined;
    
    if (rawLogo) {
      universityLogo = supabase.storage.from('schools').getPublicUrl(rawLogo).data.publicUrl;
    }

    let trackCategories = row.track_categories || [];
    let categoriesList = trackCategories.map((tc: any) => tc.categories?.name).filter(Boolean);

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
  });
};

/**
 * Function: getMeditationById
 * Description: Returns the full details of a single track by its UUID.
 * Params:
 * - req: Express request with :id route param
 * - res: Express response
 * Returns:
 * - 200 with { success: true, data: Track }
 * - 404 if no track matches the given id
 * - 500 on unexpected database error
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

  let rawLogo = (data.schools as any)?.logo_path;
  let universityLogo = undefined;
  
  if (rawLogo) {
    universityLogo = supabase.storage.from('schools').getPublicUrl(rawLogo).data.publicUrl;
  }

  let dataCategories = (data.track_categories as any) || [];
  let categoriesList = dataCategories.map((tc: any) => tc.categories?.name).filter(Boolean);

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
