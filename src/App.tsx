import { useEffect, useMemo, useState } from 'react'
import { addToQueue, entryKey, moveInQueue, moveToPosition, queue, react, type Entry } from './lib/catalog'
import { parseRoom } from './lib/room'
import { buildRows } from './lib/rows'
import { getDetails, getLancamentos } from './lib/tmdb'
import type { Details, Summary } from './lib/types'
import { useDetails } from './lib/useDetails'
import { useRoom } from './lib/useRoom'
import DetailsModal from './components/DetailsModal'
import Header from './components/Header'
import Hero from './components/Hero'
import PickToast from './components/PickToast'
import Row from './components/Row'
import SearchBar from './components/SearchBar'

function RoomView({ roomId, ownerKey }: { roomId: string; ownerKey: string | null }) {
  const { entries, loading, error, isOwner, add, remove, apply } = useRoom(roomId, ownerKey)
  const detailsByKey = useDetails(entries)
  const [lancamentos, setLancamentos] = useState<Summary[]>([])
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [fetched, setFetched] = useState<{ key: string; details: Details | null } | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

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
  const fetchedForSelected = fetched && fetched.key === selectedKey ? fetched : null
  const selectedDetails = (selectedKey && detailsByKey[selectedKey]) || fetchedForSelected?.details || null
  const loadFailed = !selectedEntry && fetchedForSelected !== null && fetchedForSelected.details === null
  // Catalog entries get their details from useDetails; only off-catalog items are fetched here.
  const needFetch = selectedKey !== null && !selectedEntry ? selectedItem?.summary : undefined
  const fetchType = needFetch?.mediaType
  const fetchId = needFetch?.id

  useEffect(() => {
    if (fetchType === undefined || fetchId === undefined) return
    const key = entryKey(fetchType, fetchId)
    let cancelled = false
    getDetails(fetchType, fetchId)
      .then((d) => {
        if (!cancelled) setFetched({ key, details: d })
      })
      .catch(() => {
        if (!cancelled) setFetched({ key, details: null })
      })
    return () => {
      cancelled = true
    }
  }, [fetchType, fetchId])

  const onAdd = (s: Summary) => {
    setNotice(null)
    add(s).catch(() => setNotice('Não deu pra adicionar agora, tenta de novo.'))
  }
  const heroApply = (fn: (es: Entry[]) => Entry[]) => {
    setNotice(null)
    apply(fn).catch(() => setNotice('Não deu pra salvar agora, tenta de novo.'))
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
            onWant={(key) => heroApply((es) => react(es, key, 'quero', Date.now(), isOwner ? 'dono' : 'amiga'))}
            onQueue={(key) => heroApply((es) => addToQueue(es, key))}
          />}
        <main className={`rows${hero ? ' rows--hero' : ''}`}>
          {rows.map((r) => (
            <Row
              key={r.id}
              row={r}
              onSelect={setSelectedKey}
              onMove={(key, dir) => heroApply((es) => moveInQueue(es, key, dir))}
              onDrop={(key, pos) => heroApply((es) => moveToPosition(es, key, pos))}
            />
          ))}
        </main>
      </>
    )

  return (
    <>
      <Header>
        {ready && <SearchBar onAdd={onAdd} />}
      </Header>
      {notice && (
        <p className="state state--erro" role="alert">
          {notice}
        </p>
      )}
      {body}
      <PickToast entries={entries} detailsByKey={detailsByKey} isOwner={isOwner} roomId={roomId} onOpen={setSelectedKey} />
      {selectedKey && (
        <DetailsModal
          details={selectedDetails}
          loadFailed={loadFailed}
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
