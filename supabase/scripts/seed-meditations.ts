import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '../..');

dotenv.config({ path: path.resolve(__dirname, '.env') });

// =====================
// Types
// =====================

interface Meditation {
  title: string;
  url: string;
  language: string;
  category: string[];
  duration_seconds: number | null;
}

interface MeditationSource {
  guided_meditations: Meditation[];
}

interface TaggedMeditation extends Meditation {
  schoolName: string;
}

// =====================
// Bootstrap
// =====================

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    '[seed] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n' +
    '       Copy supabase/scripts/.env.example to supabase/scripts/.env and fill in the values.\n' +
    '       For local dev, run: pnpm supabase status'
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// =====================
// Load source data
// =====================

const uclaData: MeditationSource = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'ucla-guided-meditations.json'), 'utf-8')
);
const mcgillData: MeditationSource = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'mcgill-guided-meditations.json'), 'utf-8')
);

const UCLA_SCHOOL_NAME = 'UCLA Mindful';
const MCGILL_SCHOOL_NAME = 'McGill Wellness Hub';

const UCLA_LOGO_PATH = 'universities/ucla.jpg';
const MCGILL_LOGO_PATH = 'universities/mcgill.png';

// =====================
// Helpers
// =====================

/**
 * Function: assertNoError
 * Description: Throws a fatal error and exits the process if a Supabase error is present.
 * Params:
 * - error: Supabase error object or null.
 * - context: Human-readable label for the operation that failed.
 * Returns: void — exits process on error, otherwise a no-op.
 */
function assertNoError(error: { message: string } | null, context: string): void {
  if (error) {
    console.error(`[seed] Failed at ${context}: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Function: chunk
 * Description: Splits an array into sub-arrays of at most `size` elements.
 * Params:
 * - arr: The array to split.
 * - size: Maximum number of elements per chunk.
 * Returns: Array of arrays, each with at most `size` elements.
 */
function chunk<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

// =====================
// Main
// =====================

async function main(): Promise<void> {
  console.log('[seed] Starting meditation data seed...\n');

  // --------------------------------------------------
  // Phase 1 — Upload school logos to Storage
  // --------------------------------------------------
  console.log('[seed] Phase 1: Uploading school logos...');

  const uclaLogo = fs.readFileSync(path.join(ROOT, 'UCLA_Icon.jpg'));
  const { error: uclaUploadError } = await supabase.storage
    .from('schools')
    .upload(UCLA_LOGO_PATH, uclaLogo, {
      contentType: 'image/jpeg',
      upsert: true,
    });
  assertNoError(uclaUploadError, `upload UCLA logo to ${UCLA_LOGO_PATH}`);
  console.log(`  ✓ Uploaded UCLA_Icon.jpg → ${UCLA_LOGO_PATH}`);

  const mcgillLogo = fs.readFileSync(path.join(ROOT, 'McGill_Icon.png'));
  const { error: mcgillUploadError } = await supabase.storage
    .from('schools')
    .upload(MCGILL_LOGO_PATH, mcgillLogo, {
      contentType: 'image/png',
      upsert: true,
    });
  assertNoError(mcgillUploadError, `upload McGill logo to ${MCGILL_LOGO_PATH}`);
  console.log(`  ✓ Uploaded McGill_Icon.png → ${MCGILL_LOGO_PATH}\n`);

  // --------------------------------------------------
  // Phase 2 — Insert schools
  // --------------------------------------------------
  console.log('[seed] Phase 2: Inserting schools...');

  const { data: schools, error: schoolsError } = await supabase
    .from('schools')
    .upsert(
      [
        { name: UCLA_SCHOOL_NAME, logo_path: UCLA_LOGO_PATH },
        { name: MCGILL_SCHOOL_NAME, logo_path: MCGILL_LOGO_PATH },
      ],
      { onConflict: 'name' }
    )
    .select('id, name');
  assertNoError(schoolsError, 'upsert schools');

  const schoolIdByName = new Map<string, string>(
    (schools ?? []).map((s) => [s.name as string, s.id as string])
  );
  console.log(`  ✓ ${schools?.length ?? 0} schools upserted`);
  console.log(`    - ${UCLA_SCHOOL_NAME}: ${schoolIdByName.get(UCLA_SCHOOL_NAME)}`);
  console.log(`    - ${MCGILL_SCHOOL_NAME}: ${schoolIdByName.get(MCGILL_SCHOOL_NAME)}\n`);

  // --------------------------------------------------
  // Phase 3 — Collect and deduplicate categories
  // --------------------------------------------------
  console.log('[seed] Phase 3: Inserting categories...');

  const allTracks: TaggedMeditation[] = [
    ...uclaData.guided_meditations.map((t) => ({ ...t, schoolName: UCLA_SCHOOL_NAME })),
    ...mcgillData.guided_meditations.map((t) => ({ ...t, schoolName: MCGILL_SCHOOL_NAME })),
  ];

  const categoryNames = [
    ...new Set(allTracks.flatMap((t) => t.category ?? [])),
  ].filter((name) => name.length > 0);

  const { data: categories, error: categoriesError } = await supabase
    .from('categories')
    .upsert(
      categoryNames.map((name) => ({ name })),
      { onConflict: 'name' }
    )
    .select('id, name');
  assertNoError(categoriesError, 'upsert categories');

  const categoryIdByName = new Map<string, string>(
    (categories ?? []).map((c) => [c.name as string, c.id as string])
  );
  console.log(`  ✓ ${categories?.length ?? 0} categories upserted: ${categoryNames.join(', ')}\n`);

  // --------------------------------------------------
  // Phase 4 — Insert tracks (batches of 50)
  // --------------------------------------------------
  console.log('[seed] Phase 4: Inserting tracks...');

  const uclaSchoolId = schoolIdByName.get(UCLA_SCHOOL_NAME);
  const mcgillSchoolId = schoolIdByName.get(MCGILL_SCHOOL_NAME);

  if (!uclaSchoolId || !mcgillSchoolId) {
    console.error('[seed] Could not resolve school IDs — aborting');
    process.exit(1);
  }

  const trackRows = allTracks.map((t) => ({
    title: t.title,
    duration_seconds: t.duration_seconds ?? null,
    language: t.language,
    audio_path: t.url,
    thumbnail_path: null,
    school_id: t.schoolName === UCLA_SCHOOL_NAME ? uclaSchoolId : mcgillSchoolId,
  }));

  const insertedTracks: Array<{ id: string; title: string; language: string; school_id: string }> = [];

  for (const batch of chunk(trackRows, 50)) {
    const { data: batchResult, error: tracksError } = await supabase
      .from('tracks')
      .upsert(batch, { onConflict: 'title,language,school_id' })
      .select('id, title, language, school_id');
    assertNoError(tracksError, 'upsert tracks batch');
    insertedTracks.push(...(batchResult ?? []));
  }

  console.log(`  ✓ ${insertedTracks.length} tracks upserted\n`);

  // --------------------------------------------------
  // Phase 5 — Insert track_categories (batches of 100)
  // --------------------------------------------------
  console.log('[seed] Phase 5: Inserting track_categories...');

  // Build a lookup: (title, language, school_id) → track id
  const trackIdByKey = new Map<string, string>(
    insertedTracks.map((t) => [`${t.title}||${t.language}||${t.school_id}`, t.id])
  );

  const trackCategoryRows: Array<{ track_id: string; category_id: string }> = [];

  for (const t of allTracks) {
    if (!t.category || t.category.length === 0) continue;

    const schoolId = t.schoolName === UCLA_SCHOOL_NAME ? uclaSchoolId : mcgillSchoolId;
    const trackId = trackIdByKey.get(`${t.title}||${t.language}||${schoolId}`);
    if (!trackId) continue;

    for (const catName of t.category) {
      const categoryId = categoryIdByName.get(catName);
      if (!categoryId) continue;
      trackCategoryRows.push({ track_id: trackId, category_id: categoryId });
    }
  }

  let linkCount = 0;
  for (const batch of chunk(trackCategoryRows, 100)) {
    const { error: tcError } = await supabase
      .from('track_categories')
      .upsert(batch, { onConflict: 'track_id,category_id' });
    assertNoError(tcError, 'upsert track_categories batch');
    linkCount += batch.length;
  }

  console.log(`  ✓ ${linkCount} track-category links upserted\n`);

  // --------------------------------------------------
  // Done
  // --------------------------------------------------
  console.log('[seed] Complete.');
  console.log(`  Schools:              ${schools?.length ?? 0}`);
  console.log(`  Categories:           ${categories?.length ?? 0}`);
  console.log(`  Tracks:               ${insertedTracks.length}`);
  console.log(`  Track-category links: ${linkCount}`);
}

main().catch((err: unknown) => {
  console.error('[seed] Fatal error:', err);
  process.exit(1);
});
