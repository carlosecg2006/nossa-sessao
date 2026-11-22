import { useEffect, useState } from 'react'
import type { Entry } from './catalog'
import { getDetails } from './tmdb'
import type { Details } from './types'

const cache = new Map<string, Details>()
const inflight = new Set<string>()

export function useDetails(entries: Entry[]): Record<string, Details> {
  const [, bump] = useState(0)

  useEffect(() => {
    for (const e of entries) {
      if (cache.has(e.key) || inflight.has(e.key)) continue
      inflight.add(e.key)
      getDetails(e.mediaType, e.tmdbId)
        .then((d) => {
          cache.set(e.key, d)
          bump((n) => n + 1)
        })
        .catch(() => {})
        .finally(() => inflight.delete(e.key))
    }
  }, [entries])

  return Object.fromEntries(entries.flatMap((e) => (cache.has(e.key) ? [[e.key, cache.get(e.key)!]] : [])))
}
