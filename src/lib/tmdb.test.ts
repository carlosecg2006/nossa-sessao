import { afterEach, describe, expect, it, vi } from 'vitest'
import movie from './__fixtures__/movie.json'
import search from './__fixtures__/search.json'
import tv from './__fixtures__/tv.json'
import { getDetails, getLancamentos, imageUrl, mapDetails, pickTrailer, searchTitles } from './tmdb'

afterEach(() => vi.unstubAllGlobals())

function stubFetch(handler: (url: URL) => unknown) {
  const fn = vi.fn(async (input: RequestInfo | URL) => ({
    ok: true,
    json: async () => handler(new URL(String(input))),
  }))
  vi.stubGlobal('fetch', fn)
  return fn
}

describe('imageUrl', () => {
  it('builds url or null', () => {
    expect(imageUrl('/a.jpg', 'w342')).toBe('https://image.tmdb.org/t/p/w342/a.jpg')
    expect(imageUrl(null, 'w342')).toBeNull()
    expect(imageUrl(undefined, 'w342')).toBeNull()
  })
})

describe('mapDetails', () => {
  it('uses pt-BR overview', () => {
    const d = mapDetails(movie, 'movie', 'English overview')
    expect(d.overview).toBe('Um hacker descobre a verdadeira natureza da realidade.')
  })

  it('falls back to en overview when pt-BR empty', () => {
    const d = mapDetails({ ...movie, overview: '' }, 'movie', 'English overview')
    expect(d.overview).toBe('English overview')
    expect(mapDetails({ ...movie, overview: '' }, 'movie').overview).toBe('')
  })

  it('reads BR flatrate providers only', () => {
    expect(mapDetails(movie, 'movie').providers).toEqual([
      { name: 'Max', logoUrl: 'https://image.tmdb.org/t/p/w92/max.jpg' },
      { name: 'Netflix', logoUrl: 'https://image.tmdb.org/t/p/w92/netflix.jpg' },
    ])
    expect(mapDetails(tv, 'tv').providers).toEqual([])
  })

  it('takes director from crew job Director and first 5 cast', () => {
    const d = mapDetails(movie, 'movie')
    expect(d.director).toBe('Lana Wachowski')
    expect(d.cast).toEqual(['Keanu Reeves', 'Laurence Fishburne', 'Carrie-Anne Moss', 'Hugo Weaving', 'Joe Pantoliano'])
  })

  it('maps movie basics, certification, runtime, images', () => {
    const d = mapDetails(movie, 'movie')
    expect(d).toMatchObject({
      id: 603, mediaType: 'movie', title: 'Matrix', year: '1999', runtimeMin: 136,
      certification: '14', genres: ['Ação', 'Ficção científica'], trailerYoutubeKey: 'official1',
      posterUrl: 'https://image.tmdb.org/t/p/w342/poster.jpg',
      backdropUrl: 'https://image.tmdb.org/t/p/w1280/backdrop.jpg',
    })
    expect(d.images).toHaveLength(10)
    expect(d.images[0]).toBe('https://image.tmdb.org/t/p/w780/b1.jpg')
  })

  it('tv uses name and first_air_date', () => {
    const d = mapDetails(tv, 'tv')
    expect(d).toMatchObject({
      title: 'Breaking Bad', year: '2008', runtimeMin: 47, certification: '18',
      director: 'Vince Gilligan', trailerYoutubeKey: null, images: [], cast: ['Bryan Cranston'],
    })
  })

  it('handles missing data with nulls and empty values', () => {
    const d = mapDetails({ id: 1, title: 'X', runtime: 0 }, 'movie')
    expect(d).toMatchObject({
      year: '', runtimeMin: null, certification: null, director: null,
      cast: [], providers: [], images: [], genres: [], genreIds: [], posterUrl: null,
    })
  })
})

describe('pickTrailer', () => {
  it('prefers official YouTube Trailer type', () => {
    expect(pickTrailer(movie.videos)).toBe('official1')
  })

  it('falls back to any Trailer, then Teaser', () => {
    const unofficial = { results: [
      { key: 't', site: 'YouTube', type: 'Teaser' },
      { key: 'u', site: 'YouTube', type: 'Trailer', official: false },
    ] }
    expect(pickTrailer(unofficial)).toBe('u')
    expect(pickTrailer({ results: [unofficial.results[0]] })).toBe('t')
  })

  it('returns null when no YouTube video', () => {
    expect(pickTrailer({ results: [{ key: 'v', site: 'Vimeo', type: 'Trailer', official: true }] })).toBeNull()
    expect(pickTrailer({ results: [{ key: 'c', site: 'YouTube', type: 'Clip' }] })).toBeNull()
    expect(pickTrailer(undefined)).toBeNull()
  })
})

describe('fetching functions', () => {
  it('searchTitles drops people and maps summaries', async () => {
    const fn = stubFetch(() => search)
    const r = await searchTitles('matrix')
    expect(r.map((s) => s.id)).toEqual([603, 1396])
    expect(r[0]).toMatchObject({ mediaType: 'movie', year: '1999', posterUrl: 'https://image.tmdb.org/t/p/w342/p.jpg', backdropUrl: 'https://image.tmdb.org/t/p/w1280/b.jpg', genreIds: [28] })
    expect(r[1]).toMatchObject({ mediaType: 'tv', title: 'Breaking Bad', posterUrl: null })
    const url = new URL(String(fn.mock.calls[0][0]))
    expect(url.pathname).toBe('/3/search/multi')
    expect(url.searchParams.get('language')).toBe('pt-BR')
    expect(url.searchParams.get('query')).toBe('matrix')
  })

  it('getLancamentos merges and dedupes with region BR', async () => {
    const fn = stubFetch((url) =>
      url.pathname.endsWith('now_playing')
        ? { results: [{ id: 1, title: 'A' }, { id: 2, title: 'B' }] }
        : { results: [{ id: 2, title: 'B' }, { id: 3, title: 'C' }] },
    )
    const r = await getLancamentos()
    expect(r.map((s) => s.id)).toEqual([1, 2, 3])
    expect(r.every((s) => s.mediaType === 'movie')).toBe(true)
    for (const call of fn.mock.calls) expect(new URL(String(call[0])).searchParams.get('region')).toBe('BR')
  })

  it('getDetails requests en-US only when pt-BR overview is empty', async () => {
    const fn = stubFetch(() => movie)
    await getDetails('movie', 603)
    expect(fn).toHaveBeenCalledTimes(1)
    const url = new URL(String(fn.mock.calls[0][0]))
    expect(url.pathname).toBe('/3/movie/603')
    expect(url.searchParams.get('append_to_response')).toBe('videos,images,credits,watch/providers,release_dates,content_ratings')

    const fn2 = stubFetch((u) =>
      u.searchParams.get('language') === 'en-US' ? { ...movie, overview: 'English overview' } : { ...movie, overview: '' },
    )
    const d = await getDetails('movie', 603)
    expect(fn2).toHaveBeenCalledTimes(2)
    expect(d.overview).toBe('English overview')
  })
})
