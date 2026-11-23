import { useId, useState } from 'react'
import { formatWhen, nextConfirmed, pendingFor, toLocalInput, type Session, type Side } from '../lib/sessions'

interface Props {
  sessions: Session[]
  me: Side
  now: number
  titleByKey: Record<string, string>
  onConfirm: (s: Session) => void
  onCounter: (s: Session, when: number) => void
}

export default function SessionBanner({ sessions, me, now, titleByKey, onConfirm, onCounter }: Props) {
  const id = useId()
  const [counterFor, setCounterFor] = useState<string | null>(null)
  const [value, setValue] = useState('')

  const pending = [...pendingFor(sessions, me, now)].sort((a, b) => b.updatedAt - a.updatedAt)[0]
  if (pending) {
    const title = titleByKey[pending.key] ?? 'um filme'
    const when = formatWhen(pending.when)
    const open = counterFor === pending.id
    const when2 = new Date(value).getTime()
    return (
      <div className="session-banner session-banner--pending" role="status">
        <p className="session-text">
          {me === 'dono' ? `Ela quer ver ${title} ${when}` : `Carlos sugeriu ver ${title} ${when}`}
        </p>
        <div className="session-actions">
          <button type="button" className="btn btn--primary" onClick={() => onConfirm(pending)}>✓ Confirmar</button>
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => setCounterFor(open ? null : pending.id)}
          >
            ↺ Sugerir outro horário
          </button>
        </div>
        {open && (
          <div className="session-form">
            <label htmlFor={id} className="session-label">Novo horário</label>
            <input
              id={id}
              type="datetime-local"
              className="session-input"
              min={toLocalInput(now)}
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
            <button
              type="button"
              className="btn btn--primary"
              disabled={Number.isNaN(when2) || when2 <= now}
              onClick={() => {
                onCounter(pending, when2)
                setCounterFor(null)
                setValue('')
              }}
            >
              Enviar
            </button>
          </div>
        )}
      </div>
    )
  }

  const next = nextConfirmed(sessions, now)
  if (!next) return null
  return (
    <div className="session-banner session-banner--next">
      <span className="session-pill">
        Próxima sessão: {formatWhen(next.when)} · {titleByKey[next.key] ?? 'um filme'}
      </span>
    </div>
  )
}
