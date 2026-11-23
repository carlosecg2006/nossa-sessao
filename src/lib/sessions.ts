import { newCode } from './room'

export type Side = 'dono' | 'amiga'

export interface Session {
  id: string
  key: string
  when: number
  status: 'proposta' | 'confirmada'
  proposedBy: Side
  updatedAt: number
}

export const PAST_ERROR = 'Data no passado'

export function propose(key: string, when: number, by: Side, now: number): Session {
  if (when <= now) throw new Error(PAST_ERROR)
  return { id: newCode().slice(0, 12), key, when, status: 'proposta', proposedBy: by, updatedAt: now }
}

export function confirm(s: Session, now: number): Session {
  return { ...s, status: 'confirmada', updatedAt: now }
}

export function counter(s: Session, when: number, by: Side, now: number): Session {
  if (when <= now) throw new Error(PAST_ERROR)
  return { ...s, when, status: 'proposta', proposedBy: by, updatedAt: now }
}

export function nextConfirmed(sessions: Session[], now: number): Session | null {
  let best: Session | null = null
  for (const s of sessions) {
    if (s.status === 'confirmada' && s.when > now && (!best || s.when < best.when)) best = s
  }
  return best
}

export function pendingFor(sessions: Session[], me: Side, now: number): Session[] {
  return sessions.filter((s) => s.status === 'proposta' && s.proposedBy !== me && s.when > now)
}

const fmt = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  weekday: 'long',
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

export function formatWhen(ms: number): string {
  const p = Object.fromEntries(fmt.formatToParts(new Date(ms)).map((x) => [x.type, x.value]))
  return `${p.weekday}, ${p.day}/${p.month} às ${p.hour}:${p.minute}`
}

/** Value for <input type="datetime-local" min>, in the browser's local time (same zone the value is parsed in). */
export function toLocalInput(ms: number): string {
  const d = new Date(ms)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
