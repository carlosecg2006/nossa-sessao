import { doc, setDoc, writeBatch } from 'firebase/firestore'
import { newCode } from '../src/lib/room'
import { db, ensureAuth } from '../src/lib/firebase'
import { env } from '../src/lib/env'
import { searchTitles } from '../src/lib/tmdb'
import type { Summary } from '../src/lib/types'
import list from './seed-list.json' with { type: 'json' }
import { buildSeedEntries, pickMatch, type SeedItem } from './seedLib'

async function main() {
  const projectId = env('VITE_FIREBASE_PROJECT_ID')
  if (!projectId) throw new Error('Defina VITE_FIREBASE_PROJECT_ID no arquivo .env')

  await ensureAuth()

  const matches: { summary: Summary; watched: boolean }[] = []
  const notFound: string[] = []
  for (const item of list as SeedItem[]) {
    const found = pickMatch(await searchTitles(item.search), item)
    if (found) matches.push({ summary: found, watched: item.watched === true })
    else notFound.push(`${item.search} (${item.year})`)
  }

  const roomId = newCode()
  const ownerKey = newCode()
  const now = Date.now()
  await setDoc(doc(db(), 'rooms', roomId), { ownerKey, createdAt: now })

  const batch = writeBatch(db())
  for (const e of buildSeedEntries(matches, now)) batch.set(doc(db(), 'rooms', roomId, 'entries', e.key), e)
  await batch.commit()

  const base = `https://${projectId}.web.app/?sala=${roomId}`
  console.log(`\nSala criada com ${matches.length} títulos.\n`)
  console.log('Link da amiga (pode mandar):')
  console.log(base)
  console.log('\nSeu link (guarde só pra você):')
  console.log(`${base}&dono=${ownerKey}\n`)
  if (notFound.length) {
    console.log('Não achei:')
    for (const n of notFound) console.log(`  - ${n}`)
    console.log('Dá pra adicionar esses pelo próprio site, pela busca.\n')
  }
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error('Deu erro:', err instanceof Error ? err.message : err)
    process.exit(1)
  },
)
