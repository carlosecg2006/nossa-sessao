import { doc, setDoc, writeBatch } from 'firebase/firestore'
import { db, ensureAuth } from './firebase'
import { newCode } from './room'
import list from './seed-list.json'
import { buildSeedEntries, pickMatch, type SeedItem } from './seedLib'
import { searchTitles } from './tmdb'
import type { Summary } from './types'

export interface CreatedRoom {
  roomId: string
  ownerKey: string
  found: number
  notFound: string[]
}

/** Cria uma sala nova com os títulos iniciais da seed-list. */
export async function createSeededRoom(onProgress?: (done: number, total: number) => void): Promise<CreatedRoom> {
  await ensureAuth()
  const items = list as SeedItem[]
  const matches: { summary: Summary; watched: boolean }[] = []
  const notFound: string[] = []
  for (const [i, item] of items.entries()) {
    const found = pickMatch(await searchTitles(item.search), item)
    if (found) matches.push({ summary: found, watched: item.watched === true })
    else notFound.push(`${item.search} (${item.year})`)
    onProgress?.(i + 1, items.length)
  }

  const roomId = newCode()
  const ownerKey = newCode()
  const now = Date.now()
  await setDoc(doc(db(), 'rooms', roomId), { ownerKey, createdAt: now })
  const batch = writeBatch(db())
  for (const e of buildSeedEntries(matches, now)) batch.set(doc(db(), 'rooms', roomId, 'entries', e.key), e)
  await batch.commit()
  return { roomId, ownerKey, found: matches.length, notFound }
}

/** Monta os dois links a partir do endereço base do site (termina com "/"). */
export function roomLinks(siteBase: string, roomId: string, ownerKey: string) {
  const friend = `${siteBase}?sala=${roomId}`
  return { friend, owner: `${friend}&dono=${ownerKey}` }
}
