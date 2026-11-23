import { addToCatalog, markWatched, entryKey, type Entry } from '../src/lib/catalog'
import type { MediaType, Summary } from '../src/lib/types'

export interface SeedItem {
  search: string
  year: string
  mediaType: MediaType
  watched?: true
}

export function pickMatch(results: Summary[], item: SeedItem): Summary | null {
  return results.find((r) => r.mediaType === item.mediaType && r.year === item.year) ?? null
}

export function buildSeedEntries(matches: { summary: Summary; watched: boolean }[], now: number): Entry[] {
  let entries: Entry[] = []
  matches.forEach((m, i) => {
    entries = addToCatalog(entries, m.summary, now)
    // timestamps crescentes mantêm a ordem dos assistidos
    if (m.watched) entries = markWatched(entries, entryKey(m.summary.mediaType, m.summary.id), now + i)
  })
  return entries
}
