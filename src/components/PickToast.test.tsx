import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import PickToast from './PickToast'
import type { Entry } from '../lib/catalog'
import type { Details } from '../lib/types'

const entry = (id: number, over: Partial<Entry> = {}): Entry => ({
  key: `movie-${id}`, tmdbId: id, mediaType: 'movie', status: 'catalogo', queuePos: null,
  reaction: 'quero', pickedAt: id * 10, pickedBy: 'amiga', watchedAt: null, addedAt: 1, ...over,
})
const det = (id: number, title: string): Details => ({
  id, mediaType: 'movie', title, year: '2000', posterUrl: null, backdropUrl: null, genreIds: [],
  overview: '', runtimeMin: null, certification: null, genres: [], director: null,
  cast: [], trailerYoutubeKey: null, images: [], providers: [],
})
const details = { 'movie-1': det(1, 'Practical Magic'), 'movie-2': det(2, 'Hocus Pocus') }

beforeEach(() => localStorage.clear())

describe('PickToast', () => {
  it('owner sees "Ela escolheu: title" for new picks, newest first', () => {
    render(<PickToast entries={[entry(1), entry(2)]} detailsByKey={details} isOwner roomId="r" onOpen={vi.fn()} />)
    const msgs = screen.getAllByRole('status').map((n) => n.textContent)
    expect(msgs[0]).toContain('Ela escolheu: Hocus Pocus')
    expect(msgs[1]).toContain('Ela escolheu: Practical Magic')
  })

  it('falls back to "um filme" without details', () => {
    render(<PickToast entries={[entry(5)]} detailsByKey={{}} isOwner roomId="r" onOpen={vi.fn()} />)
    expect(screen.getByRole('status')).toHaveTextContent('Ela escolheu: um filme')
  })

  it('shows at most 3', () => {
    const es = [1, 2, 3, 4].map((i) => entry(i))
    render(<PickToast entries={es} detailsByKey={{}} isOwner roomId="r" onOpen={vi.fn()} />)
    expect(screen.getAllByRole('status')).toHaveLength(3)
  })

  it('OK dismisses and stores lastSeen', () => {
    render(<PickToast entries={[entry(1), entry(2)]} detailsByKey={details} isOwner roomId="r" onOpen={vi.fn()} />)
    fireEvent.click(screen.getAllByRole('button', { name: 'OK' })[0])
    expect(localStorage.getItem('ns:lastSeen:r')).toBe('20')
    expect(screen.queryAllByRole('status')).toHaveLength(0)
  })

  it('Ver opens the entry and dismisses', () => {
    const onOpen = vi.fn()
    render(<PickToast entries={[entry(1)]} detailsByKey={details} isOwner roomId="r" onOpen={onOpen} />)
    fireEvent.click(screen.getByRole('button', { name: 'Ver' }))
    expect(onOpen).toHaveBeenCalledWith('movie-1')
    expect(localStorage.getItem('ns:lastSeen:r')).toBe('10')
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('does not show picks already seen; invalid stored value counts as 0', () => {
    localStorage.setItem('ns:lastSeen:r', '10')
    const { unmount } = render(<PickToast entries={[entry(1)]} detailsByKey={details} isOwner roomId="r" onOpen={vi.fn()} />)
    expect(screen.queryByRole('status')).toBeNull()
    unmount()
    localStorage.setItem('ns:lastSeen:r', 'abc')
    render(<PickToast entries={[entry(1)]} detailsByKey={details} isOwner roomId="r" onOpen={vi.fn()} />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('ignores the owner own picks', () => {
    render(<PickToast entries={[entry(1, { pickedBy: 'dono' })]} detailsByKey={details} isOwner roomId="r" onOpen={vi.fn()} />)
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('non-owner sees nothing', () => {
    render(<PickToast entries={[entry(1)]} detailsByKey={details} isOwner={false} roomId="r" onOpen={vi.fn()} />)
    expect(screen.queryByRole('status')).toBeNull()
  })
})
