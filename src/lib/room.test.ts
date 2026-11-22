import { describe, expect, it } from 'vitest'
import { diffEntries, newCode, parseRoom } from './room'
import type { Entry } from './catalog'

const ID = 'aB3dE5gH7jK9mN1pQ3rS'
const e = (key: string, over: Partial<Entry> = {}): Entry => ({
  key, tmdbId: 1, mediaType: 'movie', status: 'catalogo', queuePos: null,
  reaction: null, pickedAt: null, watchedAt: null, addedAt: 1, ...over,
})

describe('parseRoom', () => {
  it('accepts valid sala', () => {
    expect(parseRoom(`?sala=${ID}`)).toEqual({ roomId: ID, ownerKey: null })
  })
  it('returns null for missing or short sala', () => {
    expect(parseRoom('')).toBeNull()
    expect(parseRoom('?sala=abc')).toBeNull()
    expect(parseRoom(`?sala=${ID}x`)).toBeNull()
    expect(parseRoom('?sala=aB3dE5gH7jK9mN1pQ3r-')).toBeNull()
  })
  it('flags dono present', () => {
    expect(parseRoom(`?sala=${ID}&dono=segredo`)).toEqual({ roomId: ID, ownerKey: 'segredo' })
  })
})

describe('newCode', () => {
  it('is 20 base62 chars', () => {
    const c = newCode()
    expect(c).toMatch(/^[A-Za-z0-9]{20}$/)
    expect(newCode()).not.toBe(c)
  })
})

describe('diffEntries', () => {
  it('ignores unchanged', () => {
    expect(diffEntries([e('a')], [e('a')])).toEqual({ upserts: [], deletes: [] })
  })
  it('detects changed field', () => {
    const n = e('a', { status: 'fila', queuePos: 0 })
    expect(diffEntries([e('a')], [n])).toEqual({ upserts: [n], deletes: [] })
  })
  it('detects new', () => {
    expect(diffEntries([], [e('b')])).toEqual({ upserts: [e('b')], deletes: [] })
  })
  it('detects removed', () => {
    expect(diffEntries([e('a'), e('b')], [e('a')])).toEqual({ upserts: [], deletes: ['b'] })
  })
})
