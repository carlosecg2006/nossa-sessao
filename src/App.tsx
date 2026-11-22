import { useEffect, useMemo, useState } from 'react'
import { addToQueue, entryKey, queue, react } from './lib/catalog'
import { parseRoom } from './lib/room'
import { buildRows } from './lib/rows'
import { getDetails, getLancamentos } from './lib/tmdb'
import type { Details, Summary } from './lib/types'
import { useDetails } from './lib/useDetails'
import { useRoom } from './lib/useRoom'
import DetailsModal from './components/DetailsModal'
import Header from './components/Header'
import Hero from './components/Hero'
import Row from './components/Row'
import SearchBar from './components/SearchBar'

function RoomView({ roomId, ownerKey }: { roomId: string; ownerKey: string | null }) {
  const { entries, loading, error, isOwner, add, remove, apply } = useRoom(roomId, ownerKey)
  const detailsByKey = useDetails(entries)
  const [lancamentos, setLancamentos] = useState<Summary[]>([])
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [fetched, setFetched] = useState<Details | null>(null)
  const [addFailed, setAddFailed] = useState(false)

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

  // Random fallback film: seed fixed per mount, pool is the unwatched catalog (stable order).
  const [seed] = useState(Math.random)
  const hero = useMemo(() => {
    const head = queue(entries)[0]
    if (head) return detailsByKey[head.key] ?? null
    const pool = entries.filter((e) => e.status !== 'assistido').sort((a, b) => a.key.localeCompare(b.key))
    if (!pool.length) return null
    return detailsByKey[pool[Math.floor(seed * pool.length)].key] ?? null
  }, [entries, detailsByKey, seed])

  const selectedItem = useMemo(
    () => (selectedKey ? rows.flatMap((r) => r.items).find((i) => i.key === selectedKey) : undefined),
    [rows, selectedKey],
  )
  const selectedEntry = selectedKey ? (entries.find((e) => e.key === selectedKey) ?? null) : null
  const selectedDetails =
    (selectedKey && detailsByKey[selectedKey]) ||
    (fetched && selectedKey && entryKey(fetched.mediaType, fetched.id) === selectedKey ? fetched : null)
  const needFetch = selectedKey !== null && !detailsByKey[selectedKey] ? selectedItem?.summary : undefined
  const fetchType = needFetch?.mediaType
  const fetchId = needFetch?.id

  useEffect(() => {
    if (fetchType === undefined || fetchId === undefined) return
    let cancelled = false
    getDetails(fetchType, fetchId)
      .then((d) => {
        if (!cancelled) setFetched(d)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [fetchType, fetchId])

  const onAdd = (s: Summary) => {
    setAddFailed(false)
    add(s).catch(() => setAddFailed(true))
  }
  const ready = !loading && !error

  let body
  if (loading) body = <p className="state">Carregando…</p>
  else if (error) body = <p className="state" role="alert">{error}</p>
  else if (!entries.length)
    body = <p className="state">Nenhum filme ainda. Busque um filme lá em cima pra começar.</p>
  else
    body = (
      <>
        {hero && <Hero
            details={hero}
            onSelect={setSelectedKey}
            onWant={(key) => apply((es) => react(es, key, 'quero', Date.now()))}
            onQueue={(key) => apply((es) => addToQueue(es, key))}
          />}
        <main className={`rows${hero ? ' rows--hero' : ''}`}>
          {rows.map((r) => (
            <Row key={r.id} row={r} onSelect={setSelectedKey} />
          ))}
        </main>
      </>
    )

  return (
    <>
      <Header>
        {ready && <SearchBar onAdd={onAdd} />}
      </Header>
      {addFailed && (
        <p className="state state--erro" role="alert">
          Não deu pra adicionar agora, tenta de novo.
        </p>
      )}
      {body}
      {selectedKey && (
        <DetailsModal
          details={selectedDetails}
          entry={selectedEntry}
          isOwner={isOwner}
          onApply={apply}
          onAdd={add}
          onRemove={remove}
          onClose={() => setSelectedKey(null)}
        />
      )}
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
