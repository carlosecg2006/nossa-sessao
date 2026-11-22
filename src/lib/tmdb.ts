import type { Details, MediaType, Summary } from './types'

const API = 'https://api.themoviedb.org/3'
const IMG = 'https://image.tmdb.org/t/p'

type Raw = any

export function imageUrl(path: string | null | undefined, size: string): string | null {
  return path ? `${IMG}/${size}${path}` : null
}

function yearOf(date: unknown): string {
  return typeof date === 'string' ? date.slice(0, 4) : ''
}

export function mapSummary(raw: Raw, mediaType: MediaType): Summary {
  return {
    id: raw.id,
    mediaType,
    title: (mediaType === 'movie' ? raw.title : raw.name) ?? '',
    year: yearOf(mediaType === 'movie' ? raw.release_date : raw.first_air_date),
    posterUrl: imageUrl(raw.poster_path, 'w342'),
    backdropUrl: imageUrl(raw.backdrop_path, 'w1280'),
    genreIds: raw.genre_ids ?? (raw.genres ?? []).map((g: Raw) => g.id),
  }
}

export function pickTrailer(videos: Raw): string | null {
  const yt: Raw[] = (videos?.results ?? []).filter((v: Raw) => v.site === 'YouTube')
  const found =
    yt.find((v) => v.type === 'Trailer' && v.official) ??
    yt.find((v) => v.type === 'Trailer') ??
    yt.find((v) => v.type === 'Teaser')
  return found?.key ?? null
}

function certificationOf(raw: Raw, mediaType: MediaType): string | null {
  if (mediaType === 'movie') {
    const br = (raw.release_dates?.results ?? []).find((r: Raw) => r.iso_3166_1 === 'BR')
    const hit = (br?.release_dates ?? []).find((d: Raw) => d.certification)
    return hit?.certification || null
  }
  const br = (raw.content_ratings?.results ?? []).find((r: Raw) => r.iso_3166_1 === 'BR')
  return br?.rating || null
}

export function mapDetails(raw: Raw, mediaType: MediaType, rawEnOverview?: string): Details {
  const director =
    mediaType === 'movie'
      ? ((raw.credits?.crew ?? []).find((c: Raw) => c.job === 'Director')?.name ?? null)
      : (raw.created_by?.[0]?.name ?? null)
  const runtime = mediaType === 'movie' ? raw.runtime : raw.episode_run_time?.[0]
  const flatrate: Raw[] = raw['watch/providers']?.results?.BR?.flatrate ?? []
  return {
    ...mapSummary(raw, mediaType),
    overview: raw.overview || rawEnOverview || '',
    runtimeMin: runtime || null,
    certification: certificationOf(raw, mediaType),
    genres: (raw.genres ?? []).map((g: Raw) => g.name),
    director,
    cast: (raw.credits?.cast ?? []).slice(0, 5).map((c: Raw) => c.name),
    trailerYoutubeKey: pickTrailer(raw.videos),
    images: (raw.images?.backdrops ?? [])
      .slice(0, 10)
      .map((b: Raw) => imageUrl(b.file_path, 'w780'))
      .filter((u: string | null): u is string => u !== null),
    providers: flatrate.map((p) => ({ name: p.provider_name, logoUrl: imageUrl(p.logo_path, 'w92') ?? '' })),
  }
}

async function get(path: string, params: Record<string, string> = {}): Promise<Raw> {
  const qs = new URLSearchParams({
    api_key: import.meta.env.VITE_TMDB_KEY,
    language: 'pt-BR',
    ...params,
  })
  const res = await fetch(`${API}${path}?${qs}`)
  if (!res.ok) throw new Error(`TMDB ${path} falhou: ${res.status}`)
  return res.json()
}

export async function searchTitles(q: string): Promise<Summary[]> {
  const data = await get('/search/multi', { query: q })
  return (data.results ?? [])
    .filter((r: Raw) => r.media_type === 'movie' || r.media_type === 'tv')
    .map((r: Raw) => mapSummary(r, r.media_type))
}

export async function getDetails(mediaType: MediaType, id: number): Promise<Details> {
  const append = 'videos,images,credits,watch/providers,release_dates,content_ratings'
  const raw = await get(`/${mediaType}/${id}`, {
    append_to_response: append,
    include_image_language: 'pt,en,null',
  })
  let en: string | undefined
  if (!raw.overview) {
    const rawEn = await get(`/${mediaType}/${id}`, { language: 'en-US' })
    en = rawEn.overview
  }
  return mapDetails(raw, mediaType, en)
}

export async function getLancamentos(): Promise<Summary[]> {
  const [now, upcoming] = await Promise.all([
    get('/movie/now_playing', { region: 'BR' }),
    get('/movie/upcoming', { region: 'BR' }),
  ])
  const seen = new Set<number>()
  return [...(now.results ?? []), ...(upcoming.results ?? [])]
    .filter((r: Raw) => (seen.has(r.id) ? false : (seen.add(r.id), true)))
    .map((r: Raw) => mapSummary(r, 'movie'))
}
