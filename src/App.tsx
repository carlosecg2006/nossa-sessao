import { useEffect, useMemo, useState } from 'react'
import { addToCatalog, queue } from './lib/catalog'
import { parseRoom } from './lib/room'
import { buildRows } from './lib/rows'
import { getLancamentos } from './lib/tmdb'
import type { Summary } from './lib/types'
import { useDetails } from './lib/useDetails'
import { useRoom } from './lib/useRoom'
import Header from './components/Header'
import Hero from './components/Hero'
import Row from './components/Row'
import SearchBar from './components/SearchBar'

function RoomView({ roomId, ownerKey }: { roomId: string; ownerKey: string | null }) {
  const { entries, loading, error, isOwner, commit } = useRoom(roomId, ownerKey)
  const detailsByKey = useDetails(entries)
  const [lancamentos, setLancamentos] = useState<Summary[]>([])
  const [, setSelectedKey] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    getLancamentos()
      .then((l) => {
        if (!cancelled) setLancamentos(l)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const rows = useMemo(
    () => buildRows(entries, detailsByKey, lancamentos, isOwner),
    [entries, detailsByKey, lancamentos, isOwner],
  )

  // Random fallback film: chosen once per mount, from the first loaded catalog films.
  const [randomKey, setRandomKey] = useState<string | null>(null)
  useEffect(() => {
    if (randomKey) return
    const loaded = entries.filter((e) => detailsByKey[e.key])
    if (loaded.length) setRandomKey(loaded[Math.floor(Math.random() * loaded.length)].key)
  }, [entries, detailsByKey, randomKey])
  const hero = useMemo(() => {
    const first = queue(entries).find((e) => detailsByKey[e.key])
    if (first) return detailsByKey[first.key]
    return randomKey ? (detailsByKey[randomKey] ?? null) : null
  }, [entries, detailsByKey, randomKey])

  const onAdd = (s: Summary) => void commit(addToCatalog(entries, s, Date.now()))

  let body
  if (loading) body = <p className="state">Carregando…</p>
  else if (error) body = <p className="state" role="alert">{error}</p>
  else if (!entries.length)
    body = <p className="state">Nenhum filme ainda. Busque um filme lá em cima pra começar.</p>
  else
    body = (
      <>
        {hero && <Hero details={hero} onSelect={setSelectedKey} />}
        <main className="rows">
          {rows.map((r) => (
            <Row key={r.id} row={r} onSelect={setSelectedKey} />
          ))}
        </main>
      </>
    )

  return (
    <>
      <Header>
        <SearchBar onAdd={onAdd} />
      </Header>
      {body}
    </>
  )
}

export default function App() {
  const room = parseRoom(window.location.search)
  if (room) return <RoomView roomId={room.roomId} ownerKey={room.ownerKey} />
  return (
    <>
      <Header />
      <p className="state">Link incompleto, peça o link certo pro Carlos</p>
    </>
  )
}
