import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import SessionBanner from './SessionBanner'
import type { Session } from '../lib/sessions'

const NOW = Date.UTC(2026, 10, 25, 12, 0)
const WHEN = Date.UTC(2026, 10, 28, 23, 0) // sábado, 28/11 às 20:00
const s = (o: Partial<Session> = {}): Session => ({
  id: 'a', key: 'movie-1', when: WHEN, status: 'proposta', proposedBy: 'amiga', updatedAt: 1, ...o,
})
const titles = { 'movie-1': 'Practical Magic' }
const setup = (sessions: Session[], me: 'dono' | 'amiga' = 'dono', t: Record<string, string> = titles) => {
  const onConfirm = vi.fn()
  const onCounter = vi.fn()
  const r = render(<SessionBanner sessions={sessions} me={me} now={NOW} titleByKey={t} onConfirm={onConfirm} onCounter={onCounter} />)
  return { onConfirm, onCounter, ...r }
}

describe('SessionBanner', () => {
  it('shows "Próxima sessão: …" with the film title', () => {
    setup([s({ status: 'confirmada' })])
    expect(screen.getByText('Próxima sessão: sábado, 28/11 às 20:00 · Practical Magic')).toBeInTheDocument()
  })

  it('shows Confirmar / Sugerir outro horário for pending (owner text)', () => {
    const { onConfirm } = setup([s()])
    expect(screen.getByText('Ela quer ver Practical Magic sábado, 28/11 às 20:00')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '✓ Confirmar' }))
    expect(onConfirm).toHaveBeenCalledWith(expect.objectContaining({ id: 'a' }))
    expect(screen.getByRole('button', { name: '↺ Sugerir outro horário' })).toBeInTheDocument()
  })

  it('friend text, newest proposal, title fallback', () => {
    setup([s({ id: 'old', proposedBy: 'dono', updatedAt: 1 }), s({ id: 'new', proposedBy: 'dono', updatedAt: 9, key: 'movie-2' })], 'amiga')
    expect(screen.getByText('Carlos sugeriu ver um filme sábado, 28/11 às 20:00')).toBeInTheDocument()
  })

  it('pending takes precedence over confirmed', () => {
    setup([s({ id: 'c', status: 'confirmada' }), s({ id: 'p' })])
    expect(screen.queryByText(/Próxima sessão/)).toBeNull()
    expect(screen.getByText(/Ela quer ver/)).toBeInTheDocument()
  })

  it('counter reveals a datetime input with min=now and sends the chosen time', () => {
    const { onCounter } = setup([s()])
    fireEvent.click(screen.getByRole('button', { name: '↺ Sugerir outro horário' }))
    const input = screen.getByLabelText('Novo horário') as HTMLInputElement
    expect(input.type).toBe('datetime-local')
    const d = new Date(NOW)
    const pad = (n: number) => String(n).padStart(2, '0')
    expect(input.min).toBe(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`)
    fireEvent.change(input, { target: { value: '2026-12-01T21:30' } })
    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }))
    expect(onCounter).toHaveBeenCalledWith(expect.objectContaining({ id: 'a' }), new Date('2026-12-01T21:30').getTime())
  })

  it('renders nothing when there is nothing to show or everything expired', () => {
    const { container } = setup([s({ when: NOW - 1 }), s({ id: 'x', status: 'confirmada', when: NOW - 1 })])
    expect(container).toBeEmptyDOMElement()
  })
})
