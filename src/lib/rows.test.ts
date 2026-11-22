import { describe, expect, it } from 'vitest'
import { buildRows } from './rows'
import type { Entry } from './catalog'
import type { Details, Summary } from './types'

const entry = (id: number, over: Partial<Entry> = {}): Entry => ({
  key: `movie-${id}`,
  tmdbId: id,
  mediaType: 'movie',
  status: 'catalogo',
  queuePos: null,
  reaction: null,
  pickedAt: null,
  watchedAt: null,
  addedAt: 0,
  ...over,
})

const details = (id: number, genres: string[] = []): Details => ({
  id,
  mediaType: 'movie',
  title: `Filme ${id}`,
  year: '2020',
  posterUrl: null,
  backdropUrl: null,
  genreIds: [],
  overview: '',
  runtimeMin: null,
  certification: null,
  genres,
  director: null,
  cast: [],
  trailerYoutubeKey: null,
  images: [],
  providers: [],
})

const summary = (id: number): Summary => details(id)

const detailsFor = (...ds: Details[]) => Object.fromEntries(ds.map((d) => [`movie-${d.id}`, d]))
const ids = (rows: ReturnType<typeof buildRows>, title: string) =>
  rows.find((r) => r.title === title)?.items.map((i) => i.key)

describe('buildRows', () => {
  it('omits empty rows', () => {
    expect(buildRows([], {}, [], true)).toEqual([])
  })

  it('omits entries whose details are not loaded', () => {
    const rows = buildRows([entry(1)], {}, [], false)
    expect(rows).toEqual([])
  })

  it('shows Pra revisar only for the owner', () => {
    const e = entry(1, { reaction: 'naocurti' })
    const d = detailsFor(details(1))
    expect(buildRows([e], d, [], true).map((r) => r.title)).toContain('Pra revisar')
    expect(buildRows([e], d, [], false).map((r) => r.title)).not.toContain('Pra revisar')
  })

  it('Lançamentos excludes items already in the catalog', () => {
    const rows = buildRows([entry(1)], detailsFor(details(1)), [summary(1), summary(2)], false)
    expect(ids(rows, 'Lançamentos')).toEqual(['movie-2'])
  })

  it('orders rows: fila, escolhidos, genres, lançamentos, já vimos, revisar', () => {
    const entries = [
      entry(1, { status: 'fila', queuePos: 0 }),
      entry(2, { reaction: 'quero', pickedAt: 5 }),
      entry(3, { status: 'assistido', watchedAt: 9 }),
      entry(4, { reaction: 'naocurti' }),
    ]
    const d = detailsFor(details(1, ['Drama']), details(2, ['Drama']), details(3), details(4, ['Drama']))
    const rows = buildRows(entries, d, [summary(9)], true)
    expect(rows.map((r) => r.title)).toEqual([
      'Nossa fila',
      'Escolhidos por ela',
      'Drama',
      'Lançamentos',
      'Já vimos ✓',
      'Pra revisar',
    ])
  })

  it('genre rows: Fantasia renamed, sorted by count desc then name, only catalogo/fila', () => {
    const entries = [
      entry(1),
      entry(2),
      entry(3, { status: 'fila', queuePos: 0 }),
      entry(4),
      entry(5, { status: 'assistido', watchedAt: 1 }),
    ]
    const d = detailsFor(
      details(1, ['Fantasia', 'Drama']),
      details(2, ['Fantasia']),
      details(3, ['Fantasia', 'Comédia']),
      details(4, ['Comédia']),
      details(5, ['Terror']),
    )
    const titles = buildRows(entries, d, [], false).map((r) => r.title)
    expect(titles).toEqual(['Nossa fila', 'Bruxas e magia', 'Comédia', 'Drama', 'Já vimos ✓'])
  })

  it('a film appears in several genre rows', () => {
    const d = detailsFor(details(1, ['Drama', 'Comédia']))
    const rows = buildRows([entry(1)], d, [], false)
    expect(ids(rows, 'Drama')).toEqual(['movie-1'])
    expect(ids(rows, 'Comédia')).toEqual(['movie-1'])
  })

  it('items carry entry for catalog films and null for lançamentos', () => {
    const rows = buildRows([entry(1)], detailsFor(details(1, ['Drama'])), [summary(2)], false)
    expect(rows.find((r) => r.title === 'Drama')!.items[0].entry?.key).toBe('movie-1')
    expect(rows.find((r) => r.title === 'Lançamentos')!.items[0].entry).toBeNull()
  })
})
