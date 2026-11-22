import type { Entry } from './catalog'

const BASE62 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
const CODE_RE = /^[A-Za-z0-9]{20}$/

export function parseRoom(search: string): { roomId: string; ownerKey: string | null } | null {
  const p = new URLSearchParams(search)
  const roomId = p.get('sala')
  if (!roomId || !CODE_RE.test(roomId)) return null
  return { roomId, ownerKey: p.get('dono') }
}

export function newCode(): string {
  const out: string[] = []
  // rejection sampling (248 = 62*4) avoids modulo bias
  while (out.length < 20) {
    for (const b of crypto.getRandomValues(new Uint8Array(32))) {
      if (b < 248 && out.length < 20) out.push(BASE62[b % 62])
    }
  }
  return out.join('')
}

const same = (a: Entry, b: Entry) =>
  (Object.keys(a) as (keyof Entry)[]).length === (Object.keys(b) as (keyof Entry)[]).length &&
  (Object.keys(a) as (keyof Entry)[]).every((k) => a[k] === b[k])

export function diffEntries(prev: Entry[], next: Entry[]): { upserts: Entry[]; deletes: string[] } {
  const before = new Map(prev.map((x) => [x.key, x]))
  const keep = new Set(next.map((x) => x.key))
  return {
    upserts: next.filter((n) => {
      const o = before.get(n.key)
      return !o || !same(o, n)
    }),
    deletes: prev.filter((p) => !keep.has(p.key)).map((p) => p.key),
  }
}
