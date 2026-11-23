import { useState } from 'react'
import { createSeededRoom, roomLinks, type CreatedRoom } from '../lib/createRoom'

type State =
  | { step: 'idle' }
  | { step: 'working'; done: number; total: number }
  | { step: 'done'; room: CreatedRoom }
  | { step: 'error' }

function siteBase(): string {
  return new URL(import.meta.env.BASE_URL, window.location.origin).href
}

export default function CreateRoom() {
  const [state, setState] = useState<State>({ step: 'idle' })

  const start = async () => {
    setState({ step: 'working', done: 0, total: 0 })
    try {
      const room = await createSeededRoom((done, total) => setState({ step: 'working', done, total }))
      setState({ step: 'done', room })
    } catch {
      setState({ step: 'error' })
    }
  }

  if (state.step === 'done') {
    const { friend, owner } = roomLinks(siteBase(), state.room.roomId, state.room.ownerKey)
    return (
      <div className="create-room">
        <h2>Sala criada com {state.room.found} títulos 🎬</h2>
        <p><strong>Link dela</strong> (pode mandar):</p>
        <a href={friend}>{friend}</a>
        <p><strong>Seu link de dono</strong> (guarde só pra você):</p>
        <a href={owner}>{owner}</a>
        {state.room.notFound.length > 0 && (
          <p>Não achei: {state.room.notFound.join(', ')}. Dá pra adicionar pela busca do site.</p>
        )}
      </div>
    )
  }

  return (
    <div className="create-room">
      <h2>Criar a sala de vocês</h2>
      <p>Isso cria a sala com os filmes iniciais e mostra os dois links.</p>
      {state.step === 'working' ? (
        <p>Buscando filmes… {state.done}/{state.total || '…'}</p>
      ) : (
        <button type="button" className="btn btn--primary" onClick={start}>Criar sala</button>
      )}
      {state.step === 'error' && <p role="alert">Não deu pra criar a sala agora. Tenta de novo.</p>}
    </div>
  )
}
