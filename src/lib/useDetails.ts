import { useEffect, useState } from 'react'
import type { Entry } from './catalog'
import { getDetails } from './tmdb'
import type { Details } from './types'

const cache = new Map<string, Details>()
const inflight = new Set<string>()

export function useDetails(entries: Entry[]): Record<string, Details> {
  // Identity changes only when new details arrive.
  const [map, setMap] = useState<Record<string, Details>>(() => Object.fromEntries(cache))

  useEffect(() => {
    for (const e of entries) {
      if (cache.has(e.key) || inflight.has(e.key)) continue
      inflight.add(e.key)
      getDetails(e.mediaType, e.tmdbId)
        .then((d) => {
          cache.set(e.key, d)
          setMap((prev) => ({ ...prev, [e.key]: d }))
        })
        .catch(() => {})
        .finally(() => inflight.delete(e.key))
    }
  }, [entries])

  return map
}
