import { useId, useState } from 'react'
import { PAST_ERROR, toLocalInput } from '../lib/sessions'

const PAST_MSG = 'Escolha um horário que ainda não passou.'

interface Props {
  onPropose: (when: number) => Promise<void>
  onError?: () => void
}

export default function SessionPicker({ onPropose, onError }: Props) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)

  const send = async () => {
    const when = new Date(value).getTime()
    setSent(false)
    if (Number.isNaN(when) || when <= Date.now()) {
      setMsg(PAST_MSG)
      return
    }
    setMsg(null)
    setBusy(true)
    try {
      await onPropose(when)
      setSent(true)
      setOpen(false)
      setValue('')
    } catch (e) {
      if (e instanceof Error && e.message === PAST_ERROR) setMsg(PAST_MSG)
      else onError?.()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="session-picker">
      <button
        type="button"
        className="btn btn--secondary"
        aria-expanded={open}
        onClick={() => {
          setOpen((o) => !o)
          setMsg(null)
          setSent(false)
        }}
      >
        📅 Marcar sessão
      </button>
      {open && (
        <div className="session-form">
          <label htmlFor={id} className="session-label">Dia e horário</label>
          <input
            id={id}
            type="datetime-local"
            className="session-input"
            min={toLocalInput(Date.now())}
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <button type="button" className="btn btn--primary" disabled={busy || !value} onClick={send}>
            Enviar
          </button>
        </div>
      )}
      {msg && <p className="modal-error" role="alert">{msg}</p>}
      {sent && <p className="session-ok" role="status">Pedido enviado!</p>}
    </div>
  )
}
