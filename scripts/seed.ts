import { env } from '../src/lib/env'
import { createSeededRoom, roomLinks } from '../src/lib/createRoom'

async function main() {
  const site = env('SITE_URL')
  if (!site) throw new Error('Defina SITE_URL no arquivo .env (ex.: https://carlosecg2006.github.io/nossa-sessao/)')
  const room = await createSeededRoom()
  const { friend, owner } = roomLinks(site.endsWith('/') ? site : `${site}/`, room.roomId, room.ownerKey)
  console.log(`\nSala criada com ${room.found} títulos.\n`)
  console.log('Link da amiga (pode mandar):')
  console.log(friend)
  console.log('\nSeu link (guarde só pra você):')
  console.log(`${owner}\n`)
  if (room.notFound.length) {
    console.log('Não achei:')
    for (const n of room.notFound) console.log(`  - ${n}`)
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
