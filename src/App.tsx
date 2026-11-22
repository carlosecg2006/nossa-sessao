import { parseRoom } from './lib/room'
import { useRoom } from './lib/useRoom'

function RoomView({ roomId, ownerKey }: { roomId: string; ownerKey: string | null }) {
  const { entries, loading, error } = useRoom(roomId, ownerKey)
  if (loading) return <p>Carregando…</p>
  if (error) return <p role="alert">{error}</p>
  return <p>{entries.length} filmes</p>
}

export default function App() {
  const room = parseRoom(window.location.search)
  return (
    <>
      <header className="app-header">
        <h1 className="app-brand">Nossa Sessão</h1>
      </header>
      {room ? (
        <RoomView roomId={room.roomId} ownerKey={room.ownerKey} />
      ) : (
        <p>Link incompleto, peça o link certo pro Carlos</p>
      )}
    </>
  )
}
