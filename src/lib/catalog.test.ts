import { describe, it, expect } from 'vitest'
import type { Summary } from './types'
import {
  type Entry,
  entryKey,
  addToCatalog,
  addToQueue,
  moveInQueue,
  markWatched,
  react,
  queue,
  picks,
  toReview,
  watched,
  newPicksSince,
} from './catalog'

const sum = (id: number, mediaType: Summary['mediaType'] = 'movie'): Summary => ({
  id,
  mediaType,
  title: `T${id}`,
  year: '2020',
  posterUrl: null,
  backdropUrl: null,
  genreIds: [],
})

const build = (ids: number[]): Entry[] =>
  ids.reduce<Entry[]>((acc, id) => addToCatalog(acc, sum(id), 100), [])

const queued = (ids: number[]): Entry[] =>
  ids.reduce((acc, id) => addToQueue(acc, entryKey('movie', id)), build(ids))

const k = (id: number) => entryKey('movie', id)

describe('entryKey', () => {
  it('joins media type and id', () => {
    expect(entryKey('movie', 123)).toBe('movie-123')
    expect(entryKey('tv', 7)).toBe('tv-7')
  })
})

describe('addToCatalog', () => {
  it('creates a catalogo entry with defaults', () => {
    expect(addToCatalog([], sum(1), 50)).toEqual([
      {
        key: 'movie-1',
        tmdbId: 1,
        mediaType: 'movie',
        status: 'catalogo',
        queuePos: null,
        reaction: null,
        pickedAt: null,
        watchedAt: null,
        addedAt: 50,
      },
    ])
  })

  it('twice keeps one entry', () => {
    const once = addToCatalog([], sum(1), 50)
    const twice = addToCatalog(once, sum(1), 99)
    expect(twice).toHaveLength(1)
    expect(twice).toEqual(once)
  })
})

describe('addToQueue', () => {
  it('appends with next queuePos', () => {
    const e = queued([1, 2, 3])
    expect(queue(e).map((x) => [x.key, x.queuePos])).toEqual([
      ['movie-1', 0],
      ['movie-2', 1],
      ['movie-3', 2],
    ])
    expect(e.every((x) => x.status === 'fila')).toBe(true)
  })

  it('is a no-op when already in fila or key unknown', () => {
    const e = queued([1, 2])
    expect(addToQueue(e, k(1))).toEqual(e)
    expect(addToQueue(e, 'movie-999')).toEqual(e)
  })

  it('moves a watched entry back to the end of the queue keeping watchedAt', () => {
    let e = queued([1, 2])
    e = markWatched(e, k(1), 500)
    e = addToQueue(e, k(1))
    const one = e.find((x) => x.key === k(1))!
    expect(one.status).toBe('fila')
    expect(one.queuePos).toBe(1)
    expect(one.watchedAt).toBe(500)
    expect(queue(e).map((x) => x.key)).toEqual([k(2), k(1)])
  })
})

describe('moveInQueue', () => {
  it('swaps neighbours', () => {
    const e = queued([1, 2, 3])
    expect(queue(moveInQueue(e, k(2), -1)).map((x) => x.key)).toEqual([k(2), k(1), k(3)])
    expect(queue(moveInQueue(e, k(2), 1)).map((x) => x.key)).toEqual([k(1), k(3), k(2)])
  })

  it('is a no-op at the ends and when not in fila', () => {
    const e = queued([1, 2])
    expect(moveInQueue(e, k(1), -1)).toEqual(e)
    expect(moveInQueue(e, k(2), 1)).toEqual(e)
    const c = build([1])
    expect(moveInQueue(c, k(1), 1)).toEqual(c)
  })
})

describe('markWatched', () => {
  it('removes from queue, renumbers 0..n-1, sets watchedAt', () => {
    const e = markWatched(queued([1, 2, 3]), k(1), 777)
    const one = e.find((x) => x.key === k(1))!
    expect(one).toMatchObject({ status: 'assistido', queuePos: null, watchedAt: 777 })
    expect(queue(e).map((x) => [x.key, x.queuePos])).toEqual([
      [k(2), 0],
      [k(3), 1],
    ])
  })
})

describe('react', () => {
  it('quero sets pickedAt', () => {
    const e = react(build([1]), k(1), 'quero', 300)
    expect(e[0]).toMatchObject({ reaction: 'quero', pickedAt: 300 })
    expect(picks(e)).toHaveLength(1)
  })

  it('naocurti appears in toReview and clears pickedAt', () => {
    let e = react(build([1]), k(1), 'quero', 300)
    e = react(e, k(1), 'naocurti', 400)
    expect(e[0]).toMatchObject({ reaction: 'naocurti', pickedAt: null })
    expect(toReview(e).map((x) => x.key)).toEqual([k(1)])
    expect(picks(e)).toHaveLength(0)
  })

  it('same reaction again keeps original pickedAt', () => {
    let e = react(build([1]), k(1), 'quero', 300)
    e = react(e, k(1), 'quero', 900)
    expect(e[0].pickedAt).toBe(300)
  })
})

describe('selectors', () => {
  it('picks sorted by pickedAt desc, watched by watchedAt desc', () => {
    let e = build([1, 2, 3])
    e = react(e, k(1), 'quero', 10)
    e = react(e, k(2), 'quero', 30)
    e = react(e, k(3), 'quero', 20)
    expect(picks(e).map((x) => x.key)).toEqual([k(2), k(3), k(1)])

    let w = queued([1, 2])
    w = markWatched(w, k(1), 5)
    w = markWatched(w, k(2), 8)
    expect(watched(w).map((x) => x.key)).toEqual([k(2), k(1)])
  })

  it('newPicksSince returns only picks after lastSeen', () => {
    let e = build([1, 2])
    e = react(e, k(1), 'quero', 10)
    e = react(e, k(2), 'quero', 30)
    expect(newPicksSince(e, 10).map((x) => x.key)).toEqual([k(2)])
    expect(newPicksSince(e, 30)).toEqual([])
  })
})

describe('immutability', () => {
  it('never mutates inputs', () => {
    const e = Object.freeze(build([1, 2]).map((x) => Object.freeze({ ...x }))) as Entry[]
    const snap = JSON.stringify(e)
    const q = addToQueue(addToQueue(e, k(1)), k(2))
    const qs = JSON.stringify(q)
    moveInQueue(q, k(1), 1)
    markWatched(q, k(1), 1)
    react(e, k(1), 'quero', 1)
    addToCatalog(e, sum(3), 1)
    expect(JSON.stringify(e)).toBe(snap)
    expect(JSON.stringify(q)).toBe(qs)
  })
})
