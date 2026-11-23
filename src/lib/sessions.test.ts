import { describe, expect, it } from 'vitest'
import { confirm, counter, formatWhen, nextConfirmed, pendingFor, propose, type Session } from './sessions'

const NOW = 1_000_000
const s = (o: Partial<Session> = {}): Session => ({
  id: 'a', key: 'movie-1', when: NOW + 1000, status: 'proposta', proposedBy: 'amiga', updatedAt: 1, ...o,
})

describe('sessions', () => {
  it('propose rejects past date', () => {
    expect(() => propose('movie-1', NOW, 'amiga', NOW)).toThrow('Data no passado')
    expect(() => propose('movie-1', NOW - 1, 'amiga', NOW)).toThrow('Data no passado')
  })

  it('propose builds a 12-char id proposal', () => {
    const p = propose('movie-1', NOW + 5, 'amiga', NOW)
    expect(p).toMatchObject({ key: 'movie-1', when: NOW + 5, status: 'proposta', proposedBy: 'amiga', updatedAt: NOW })
    expect(p.id).toMatch(/^[A-Za-z0-9]{12}$/)
  })

  it('confirm sets confirmada', () => {
    expect(confirm(s(), 50)).toMatchObject({ status: 'confirmada', updatedAt: 50, when: NOW + 1000 })
  })

  it('counter flips proposedBy and changes when', () => {
    const c = counter(s(), NOW + 9, 'dono', 60)
    expect(c).toMatchObject({ status: 'proposta', proposedBy: 'dono', when: NOW + 9, updatedAt: 60, id: 'a' })
  })

  it('counter rejects past date', () => {
    expect(() => counter(s(), NOW - 1, 'dono', NOW)).toThrow('Data no passado')
  })

  it('nextConfirmed returns the soonest future confirmed and ignores past', () => {
    const list = [
      s({ id: '1', status: 'confirmada', when: NOW - 5 }),
      s({ id: '2', status: 'confirmada', when: NOW + 500 }),
      s({ id: '3', status: 'confirmada', when: NOW + 100 }),
      s({ id: '4', status: 'proposta', when: NOW + 10 }),
    ]
    expect(nextConfirmed(list, NOW)?.id).toBe('3')
    expect(nextConfirmed([list[0], list[3]], NOW)).toBeNull()
  })

  it('pendingFor returns only the other side\'s future proposals', () => {
    const list = [
      s({ id: '1', proposedBy: 'amiga' }),
      s({ id: '2', proposedBy: 'dono' }),
      s({ id: '3', proposedBy: 'amiga', status: 'confirmada' }),
      s({ id: '4', proposedBy: 'amiga', when: NOW - 1 }),
    ]
    expect(pendingFor(list, 'dono', NOW).map((x) => x.id)).toEqual(['1'])
    expect(pendingFor(list, 'amiga', NOW).map((x) => x.id)).toEqual(['2'])
  })

  it('formatWhen renders in São Paulo time', () => {
    expect(formatWhen(Date.UTC(2026, 10, 28, 23, 0))).toBe('sábado, 28/11 às 20:00')
  })
})
