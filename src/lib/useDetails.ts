import { useEffect, useState } from 'react'
import type { Entry } from './catalog'
import { getDetails } from './tmdb'
import type { Details } from './types'

const cache = new Map<string, Details>()
const inflight = new Set<string>()

export function useDetails(entries: Entry[]): { details: Record<string, Details>; failedCount: number } {
  // `details` identity changes only when new details arrive.
  const [map, setMap] = useState<Record<string, Details>>(() => Object.fromEntries(cache))
  const [failed, setFailed] = useState<ReadonlySet<string>>(() => new Set())

  useEffect(() => {
    for (const e of entries) {
      if (cache.has(e.key) || inflight.has(e.key)) continue
      inflight.add(e.key)
      getDetails(e.mediaType, e.tmdbId)
        .then((d) => {
          cache.set(e.key, d)
          setMap((prev) => ({ ...prev, [e.key]: d }))
          setFailed((prev) => {
            if (!prev.has(e.key)) return prev
            const next = new Set(prev)
            next.delete(e.key)
            return next
          })
        })
        .catch(() => setFailed((prev) => (prev.has(e.key) ? prev : new Set(prev).add(e.key))))
        .finally(() => inflight.delete(e.key))
    }
  }, [entries])

  return { details: map, failedCount: failed.size }
}
