import { useState } from 'react'
import { newPicksSince, type Entry } from '../lib/catalog'
import type { Details } from '../lib/types'

const MAX = 3
const storageKey = (roomId: string) => `ns:lastSeen:${roomId}`

function readLastSeen(roomId: string): number {
  try {
    const n = Number(localStorage.getItem(storageKey(roomId)))
    return Number.isFinite(n) ? n : 0
  } catch {
    return 0
  }
}

export default function PickToast({
  entries,
  detailsByKey,
  isOwner,
  roomId,
  onOpen,
}: {
  entries: Entry[]
  detailsByKey: Record<string, Details>
  isOwner: boolean
  roomId: string
  onOpen: (key: string) => void
}) {
  const [lastSeen, setLastSeen] = useState(() => readLastSeen(roomId))
  if (!isOwner) return null
  const shown = newPicksSince(entries, lastSeen).slice(0, MAX)
  if (!shown.length) return null

  const dismiss = () => {
    const next = Math.max(lastSeen, ...shown.map((e) => e.pickedAt ?? 0))
    setLastSeen(next)
    try {
      localStorage.setItem(storageKey(roomId), String(next))
    } catch {
      // storage unavailable: dismissal lasts until reload
    }
  }

  return (
    <div className="toasts">
      {shown.map((e) => (
        <div key={e.key} className="toast" role="status">
          <span className="toast-text">Ela escolheu: {detailsByKey[e.key]?.title ?? 'um filme'}</span>
          <button
            type="button"
            className="toast-btn"
            onClick={() => {
              dismiss()
              onOpen(e.key)
            }}
          >
            Ver
          </button>
          <button type="button" className="toast-btn" onClick={() => dismiss()}>
            OK
          </button>
        </div>
      ))}
    </div>
  )
}
