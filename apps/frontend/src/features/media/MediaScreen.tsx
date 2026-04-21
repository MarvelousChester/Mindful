/**
 * @filename MediaScreen.tsx
 * @date 2026-03-29
 * @author Karandeep Sandhu
 * @fileoverview Main media screen with meditation library and listening history
 * @version 1.0.0
 */

import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { AppHeader } from '../../components/AppHeader'
import { CategoryFilter, type FilterOption } from './components/CategoryFilter'
import { MediaPlayer } from './components/MediaPlayer'
import { TrackCard } from './components/TrackCard'
import { apiFetch, authFetch } from '../../lib/api'
import type { Track } from './types'

type View = 'library' | 'history'

const DEFAULT_VIEW: View = 'library'
const PAGE_SIZE = 10

interface PaginationMeta {
  limit: number
  page: number
  totalCount: number
  totalPages: number
}

interface MeditationApiItem {
  id: string
  title: string
  duration: number | null
  language: string
  audioUrl: string
  thumbnailUrl?: string
  university: string
  categories: string[]
}

interface MeditationListResponse {
  data: MeditationApiItem[]
  meta: PaginationMeta
  success: boolean
}

interface FilterResponse {
  data: {
    categories: FilterOption[]
    languages: FilterOption[]
  }
  success: boolean
}

/**
 * Function: normalizeLanguage
 * Description: Normalizes a language string by trimming and defaulting to 'Unknown' if empty.
 * Params:
 * - language: The language string to normalize.
 * Returns: The normalized language string.
 */
function normalizeLanguage(language: string): string {
  const value = language.trim()
  return value.length > 0 ? value : 'Unknown'
}

/**
 * Function: mapToTrack
 * Description: Maps a meditation API item to the Track type used by the UI.
 * Params:
 * - item: The API response item to transform.
 * Returns: A Track object.
 */
function mapToTrack(item: MeditationApiItem): Track {
  return {
    id: item.id,
    title: item.title,
    duration: item.duration,
    language: item.language,
    audioUrl: item.audioUrl,
    thumbnailUrl: item.thumbnailUrl,
    university: item.university,
    category: item.categories,
  }
}

/**
 * Function: parsePositivePage
 * Description: Parses a page number from query params, defaulting to 1 for invalid values.
 * Params:
 * - rawPage: The raw page value from URL params.
 * Returns: A positive integer page number.
 */
function parsePositivePage(rawPage: string | null): number {
  if (!rawPage) return 1
  const parsed = Number(rawPage)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1
}

/**
 * Function: parseView
 * Description: Parses the view mode from URL params, defaulting to library.
 * Params:
 * - rawView: The raw view value from URL params.
 * Returns: The validated View type.
 */
function parseView(rawView: string | null): View {
  return rawView === 'history' ? 'history' : DEFAULT_VIEW
}

/**
 * Function: buildTrackQuery
 * Description: Builds a query string for track API requests from filter parameters.
 * Params:
 * - params: Object containing category, languages, limit, page, and search.
 * Returns: A URL-encoded query string.
 */
function buildTrackQuery(params: {
  category: string | null
  languages: string[]
  limit: number
  page: number
  search: string
}): string {
  const query = new URLSearchParams()
  query.set('page', String(params.page))
  query.set('limit', String(params.limit))

  const search = params.search.trim()
  if (search) query.set('search', search)
  if (params.category) query.set('category', params.category)
  for (const language of params.languages) {
    query.append('language', language)
  }

  return query.toString()
}

/**
 * Function: createSkeletonCards
 * Description: Creates skeleton loading placeholders for track cards.
 * Params:
 * - count: The number of skeleton cards to create.
 * Returns: An array of JSX skeleton elements.
 */
function createSkeletonCards(count: number) {
  return Array.from({ length: count }, (_, index) => (
    <div
      key={`skeleton-${index}`}
      className="flex items-center gap-5 rounded-2xl bg-white p-4 shadow-sm"
    >
      <div className="h-20 w-20 shrink-0 animate-pulse rounded-xl bg-slate-200" />
      <div className="flex grow flex-col gap-3">
        <div className="h-3 w-40 animate-pulse rounded bg-slate-200" />
        <div className="h-5 w-2/3 animate-pulse rounded bg-slate-200" />
        <div className="h-3 w-1/3 animate-pulse rounded bg-slate-100" />
      </div>
    </div>
  ))
}

/**
 * Function: MediaScreen
 * Description: Main media screen component displaying meditation library and listening history.
 * Returns: JSX element with track listing, filters, and media player.
 */
export const MediaScreen = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const searchParamString = searchParams.toString()
  const parsedParams = useMemo(() => {
    const params = new URLSearchParams(searchParamString)
    return {
      currentPage: parsePositivePage(params.get('page')),
      querySearch: params.get('search') ?? '',
      selectedCategory: params.get('category'),
      selectedLanguages: params.getAll('language').filter(Boolean),
      view: parseView(params.get('view')),
    }
  }, [searchParamString])
  const { currentPage, querySearch, selectedCategory, selectedLanguages, view } = parsedParams
  const requestIdRef = useRef(0)
  const hasLoadedRef = useRef(false)

  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null)
  const [autoPlayRequestId, setAutoPlayRequestId] = useState(0)
  const [searchInput, setSearchInput] = useState(querySearch)
  const deferredSearchInput = useDeferredValue(searchInput)
  const [tracks, setTracks] = useState<Track[]>([])
  const [activeError, setActiveError] = useState<string | null>(null)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [meta, setMeta] = useState<PaginationMeta>({
    page: 1,
    limit: PAGE_SIZE,
    totalCount: 0,
    totalPages: 0,
  })
  const [libraryFilters, setLibraryFilters] = useState<FilterResponse['data'] | null>(null)
  const [historyFilters, setHistoryFilters] = useState<FilterResponse['data'] | null>(null)
  const [historyVersion, setHistoryVersion] = useState(0)

  const activeFilters = view === 'library' ? libraryFilters : historyFilters
  const historyRefreshKey = view === 'history' ? historyVersion : 0

  useEffect(() => {
    setSearchInput(querySearch)
  }, [querySearch])

  useEffect(() => {
    const trimmedDeferred = deferredSearchInput.trim()
    const trimmedQuery = querySearch.trim()
    if (trimmedDeferred === trimmedQuery) return

    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      if (trimmedDeferred) {
        next.set('search', trimmedDeferred)
      } else {
        next.delete('search')
      }
      next.set('page', '1')
      return next
    })
  }, [deferredSearchInput, querySearch, setSearchParams])

  useEffect(() => {
    const controller = new AbortController()
    const requestId = ++requestIdRef.current
    const isFirstLoad = !hasLoadedRef.current

    if (isFirstLoad) {
      setIsInitialLoading(true)
    } else {
      setIsRefreshing(true)
    }
    setActiveError(null)

    const query = buildTrackQuery({
      page: currentPage,
      limit: PAGE_SIZE,
      search: querySearch,
      category: selectedCategory,
      languages: selectedLanguages,
    })

    const path = view === 'library' ? `/api/meditations?${query}` : `/api/history?${query}`
    const fetcher = view === 'library' ? apiFetch : authFetch

    void fetcher<MeditationListResponse>(path, { signal: controller.signal })
      .then((response) => {
        if (requestId !== requestIdRef.current) return
        setTracks(response.data.map(mapToTrack))
        setMeta(response.meta)
      })
      .catch((error: unknown) => {
        if ((error as Error)?.name === 'AbortError') return
        if (requestId !== requestIdRef.current) return
        setActiveError(error instanceof Error ? error.message : 'Failed to load tracks')
      })
      .finally(() => {
        if (requestId !== requestIdRef.current) return
        hasLoadedRef.current = true
        setIsInitialLoading(false)
        setIsRefreshing(false)
      })

    return () => controller.abort()
  }, [currentPage, historyRefreshKey, querySearch, selectedCategory, selectedLanguages, view])

  useEffect(() => {
    if (view === 'library' && libraryFilters) return
    if (view === 'history' && historyFilters) return

    const controller = new AbortController()
    const path = view === 'library' ? '/api/meditations/filters' : '/api/history/filters'
    const fetcher = view === 'library' ? apiFetch : authFetch

    void fetcher<FilterResponse>(path, { signal: controller.signal })
      .then((response) => {
        if (view === 'library') {
          setLibraryFilters(response.data)
          return
        }
        setHistoryFilters(response.data)
      })
      .catch((error: unknown) => {
        if ((error as Error)?.name === 'AbortError') return
        setActiveError(error instanceof Error ? error.message : 'Failed to load filters')
      })

    return () => controller.abort()
  }, [historyFilters, libraryFilters, view])

  function updateParams(mutator: (params: URLSearchParams) => void) {
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      mutator(next)
      return next
    })
  }

  function handleViewChange(next: View) {
    updateParams((params) => {
      params.set('view', next)
      params.set('page', '1')
      params.delete('category')
      params.delete('search')
      params.delete('language')
    })
    setSearchInput('')
    setActiveError(null)
  }

  function handleCategoryChange(next: string | null) {
    updateParams((params) => {
      params.set('page', '1')
      if (next) {
        params.set('category', next)
      } else {
        params.delete('category')
      }
    })
  }

  function handleLanguageChange(next: string[]) {
    updateParams((params) => {
      params.set('page', '1')
      params.delete('language')
      for (const language of next) {
        params.append('language', language)
      }
    })
  }

  function handleSearchChange(value: string) {
    setSearchInput(value)
  }

  function handlePageChange(nextPage: number) {
    updateParams((params) => {
      params.set('page', String(nextPage))
    })
  }

  function handleTrackSelect(track: Track) {
    setSelectedTrack(track)
    setAutoPlayRequestId((id) => id + 1)
  }

  const handleHistoryRecorded = () => {
    setHistoryFilters(null)
    if (view === 'history') {
      setHistoryVersion((value) => value + 1)
    }
  }

  const availableCategories = useMemo(
    () => (activeFilters?.categories ?? []).slice().sort((a, b) => a.name.localeCompare(b.name)),
    [activeFilters],
  )

  const availableLanguages = useMemo(
    () =>
      (activeFilters?.languages ?? [])
        .map((language) => ({
          ...language,
          name: normalizeLanguage(language.name),
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [activeFilters],
  )

  const skeletonCards = useMemo(() => createSkeletonCards(4), [])
  const showEmptyState = !isInitialLoading && tracks.length === 0

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f4f6f5] text-slate-900">
      <AppHeader />
      <div className="grow max-w-5xl mx-auto w-full px-6 py-12 pb-40">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold mb-2 text-slate-800">Find your peace</h2>
          <p className="text-slate-500">Discover guided practices for every state of mind.</p>
        </div>

        <div className="flex justify-center mb-6">
          <div className="inline-flex bg-white rounded-2xl shadow-sm p-1 gap-1">
            <button
              onClick={() => handleViewChange('library')}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium transition-all ${view === 'library'
                ? 'bg-primary text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              <span className="material-icons text-base">library_music</span>
              Library
            </button>
            <button
              onClick={() => handleViewChange('history')}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium transition-all ${view === 'history'
                ? 'bg-primary text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              <span className="material-icons text-base">history</span>
              History
            </button>
          </div>
        </div>

        <div className="relative w-full mb-4">
          <span className="material-icons absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
          <input
            className="w-full pl-12 pr-4 py-4 bg-white border-none rounded-2xl shadow-sm focus:ring-2 focus:ring-primary transition-all outline-none text-slate-700"
            placeholder="Search for a practice..."
            type="text"
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
          {isRefreshing && (
            <div className="pointer-events-none absolute inset-x-4 bottom-2 h-0.5 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full w-1/3 animate-[pulse_1s_ease-in-out_infinite] rounded-full bg-primary" />
            </div>
          )}
        </div>

        {activeError && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">
            Failed to load tracks: {activeError}
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-4 items-start">
          <div className={`relative w-full grid grid-cols-1 gap-4 ${tracks.length > 0 ? 'md:w-[70%]' : ''}`}>
            {isInitialLoading ? (
              skeletonCards
            ) : showEmptyState ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3 rounded-2xl bg-white shadow-sm">
                <span className="material-icons text-5xl">{view === 'history' ? 'history' : 'library_music'}</span>
                <p className="text-sm">
                  {view === 'history' ? 'Your listening history will appear here.' : 'No tracks found.'}
                </p>
              </div>
            ) : (
              tracks.map((track) => (
                <TrackCard
                  key={track.id}
                  track={track}
                  onSelect={handleTrackSelect}
                />
              ))
            )}

            {!isInitialLoading && isRefreshing && tracks.length > 0 && (
              <div className="pointer-events-none absolute inset-0 rounded-3xl bg-white/35 backdrop-blur-[1px]" />
            )}

            {!isInitialLoading && meta.totalPages > 1 && (
              <div className="mt-2 flex items-center justify-between bg-white rounded-2xl px-4 py-3 shadow-sm">
                <button
                  type="button"
                  disabled={meta.page <= 1 || isRefreshing}
                  onClick={() => handlePageChange(Math.max(1, meta.page - 1))}
                  className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-sm text-slate-600">
                  Page {meta.page} of {meta.totalPages}
                </span>
                <button
                  type="button"
                  disabled={meta.page >= meta.totalPages || isRefreshing}
                  onClick={() => handlePageChange(Math.min(meta.totalPages, meta.page + 1))}
                  className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>

          <div className="w-full md:w-[30%]">
            {activeFilters ? (
              <CategoryFilter
                categories={availableCategories}
                selectedCategory={selectedCategory}
                onCategoryChange={handleCategoryChange}
                languages={availableLanguages}
                selectedLanguages={selectedLanguages}
                onLanguageChange={handleLanguageChange}
                disabled={isRefreshing}
              />
            ) : (
              <div className="w-full rounded-2xl bg-white px-4 py-4 shadow-sm">
                <div className="space-y-3">
                  <div className="h-3 w-20 animate-pulse rounded bg-slate-200" />
                  <div className="h-9 w-full animate-pulse rounded-xl bg-slate-100" />
                  <div className="h-9 w-full animate-pulse rounded-xl bg-slate-100" />
                  <div className="h-px w-full bg-slate-100" />
                  <div className="h-3 w-24 animate-pulse rounded bg-slate-200" />
                  <div className="h-9 w-full animate-pulse rounded-xl bg-slate-100" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <footer className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-xl border-t border-primary/20 px-6 py-4 z-50">
        <MediaPlayer
          track={selectedTrack}
          autoPlayRequestId={autoPlayRequestId}
          onHistoryRecorded={handleHistoryRecorded}
        />
      </footer>
    </div>
  )
}
