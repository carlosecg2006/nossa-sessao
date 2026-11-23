import { describe, expect, it } from 'vitest'
import type { Summary } from '../src/lib/types'
import { buildSeedEntries, pickMatch } from './seedLib'

const s = (id: number, mediaType: 'movie' | 'tv', year: string): Summary => ({
  id,
  mediaType,
  title: `T${id}`,
  year,
  posterUrl: null,
  backdropUrl: null,
  genreIds: [],
})

describe('pickMatch', () => {
  it('pega o primeiro com mesmo tipo e ano', () => {
    const r = [s(1, 'tv', '1993'), s(2, 'movie', '1994'), s(3, 'movie', '1993'), s(4, 'movie', '1993')]
    expect(pickMatch(r, { search: 'x', year: '1993', mediaType: 'movie' })?.id).toBe(3)
  })

  it('devolve null quando nada bate', () => {
    expect(pickMatch([s(1, 'movie', '1990')], { search: 'x', year: '1993', mediaType: 'movie' })).toBeNull()
    expect(pickMatch([], { search: 'x', year: '1993', mediaType: 'movie' })).toBeNull()
  })
})

describe('buildSeedEntries', () => {
  const matches = [
    { summary: s(1, 'movie', '1993'), watched: false },
    { summary: s(2, 'movie', '1998'), watched: true },
    { summary: s(3, 'movie', '2026'), watched: true },
  ]

  it('mantém a ordem e marca os assistidos com datas crescentes', () => {
    const e = buildSeedEntries(matches, 1000)
    expect(e.map((x) => x.key)).toEqual(['movie-1', 'movie-2', 'movie-3'])
    expect(e.map((x) => x.status)).toEqual(['catalogo', 'assistido', 'assistido'])
    expect(e[1].watchedAt!).toBeLessThan(e[2].watchedAt!)
    expect(e[0].watchedAt).toBeNull()
    expect(e.every((x) => x.queuePos === null)).toBe(true)
  })

  it('ignora repetidos', () => {
    const e = buildSeedEntries([matches[0], matches[0]], 1000)
    expect(e).toHaveLength(1)
  })
})
