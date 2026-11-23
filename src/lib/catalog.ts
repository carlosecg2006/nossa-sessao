import type { MediaType, Summary } from './types'

export type Status = 'catalogo' | 'fila' | 'assistido'
export type Person = 'dono' | 'amiga'
export type Reaction = 'quero' | 'naocurti'

export interface Entry {
  key: string
  tmdbId: number
  mediaType: MediaType
  status: Status
  queuePos: number | null
  reaction: Reaction | null
  pickedAt: number | null
  pickedBy: Person | null
  watchedAt: number | null
  addedAt: number
}

export const entryKey = (mediaType: MediaType, id: number): string => `${mediaType}-${id}`

const patch = (entries: Entry[], key: string, fn: (e: Entry) => Entry): Entry[] =>
  entries.map((e) => (e.key === key ? fn(e) : e))

export function addToCatalog(entries: Entry[], s: Summary, now: number): Entry[] {
  const key = entryKey(s.mediaType, s.id)
  if (entries.some((e) => e.key === key)) return [...entries]
  return [
    ...entries,
    {
      key,
      tmdbId: s.id,
      mediaType: s.mediaType,
      status: 'catalogo',
      queuePos: null,
      reaction: null,
      pickedAt: null,
      pickedBy: null,
      watchedAt: null,
      addedAt: now,
    },
  ]
}

export function queue(entries: Entry[]): Entry[] {
  return entries
    .filter((e) => e.status === 'fila')
    .sort((a, b) => (a.queuePos ?? 0) - (b.queuePos ?? 0))
}

export function addToQueue(entries: Entry[], key: string): Entry[] {
  const target = entries.find((e) => e.key === key)
  if (!target || target.status === 'fila') return [...entries]
  const pos = queue(entries).length
  return patch(entries, key, (e) => ({ ...e, status: 'fila', queuePos: pos }))
}

export function moveInQueue(entries: Entry[], key: string, dir: -1 | 1): Entry[] {
  const target = entries.find((e) => e.key === key)
  if (!target || target.status !== 'fila' || target.queuePos === null) return [...entries]
  const from = target.queuePos
  const to = from + dir
  const neighbour = entries.find((e) => e.status === 'fila' && e.queuePos === to)
  if (!neighbour) return [...entries]
  return entries.map((e) => {
    if (e.key === key) return { ...e, queuePos: to }
    if (e.key === neighbour.key) return { ...e, queuePos: from }
    return e
  })
}

export function markWatched(entries: Entry[], key: string, now: number): Entry[] {
  const target = entries.find((e) => e.key === key)
  if (!target) return [...entries]
  const marked = patch(entries, key, (e) => ({
    ...e,
    status: 'assistido',
    queuePos: null,
    watchedAt: now,
  }))
  const order = new Map(queue(marked).map((e, i) => [e.key, i]))
  return marked.map((e) => (order.has(e.key) ? { ...e, queuePos: order.get(e.key)! } : e))
}

export function moveToPosition(entries: Entry[], key: string, targetPos: number): Entry[] {
  const q = queue(entries)
  const from = q.findIndex((e) => e.key === key)
  if (from === -1 || !Number.isInteger(targetPos) || targetPos < 0 || targetPos >= q.length) {
    return [...entries]
  }
  const order = q.map((e) => e.key)
  order.splice(from, 1)
  order.splice(targetPos, 0, key)
  const pos = new Map(order.map((k, i) => [k, i]))
  return entries.map((e) => (pos.has(e.key) ? { ...e, queuePos: pos.get(e.key)! } : e))
}

export function react(entries: Entry[], key: string, r: Reaction, now: number, by: Person): Entry[] {
  return patch(entries, key, (e) => {
    if (e.reaction === r) return { ...e }
    return r === 'quero'
      ? { ...e, reaction: r, pickedAt: now, pickedBy: by }
      : { ...e, reaction: r, pickedAt: null, pickedBy: null }
  })
}

export const picks = (entries: Entry[]): Entry[] =>
  entries.filter((e) => e.reaction === 'quero').sort((a, b) => (b.pickedAt ?? 0) - (a.pickedAt ?? 0))

// Old entries without pickedBy count as hers.
export const herPicks = (entries: Entry[]): Entry[] => picks(entries).filter((e) => e.pickedBy !== 'dono')

export const toReview = (entries: Entry[]): Entry[] =>
  entries.filter((e) => e.reaction === 'naocurti')

export const watched = (entries: Entry[]): Entry[] =>
  entries
    .filter((e) => e.status === 'assistido')
    .sort((a, b) => (b.watchedAt ?? 0) - (a.watchedAt ?? 0))

export const newPicksSince = (entries: Entry[], lastSeen: number): Entry[] =>
  herPicks(entries).filter((e) => (e.pickedAt ?? 0) > lastSeen)
