import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./lib/useRoom')
vi.mock('./lib/useSessions')
vi.mock('./lib/tmdb')

import App from './App'
import type { Entry } from './lib/catalog'
import { getDetails, getLancamentos, searchTitles } from './lib/tmdb'
import type { Details, Summary } from './lib/types'
import { useRoom } from './lib/useRoom'
import { useSessions } from './lib/useSessions'

const ROOM = 'a'.repeat(20)

const entry = (id: number): Entry => ({
  key: `movie-${id}`, tmdbId: id, mediaType: 'movie', status: 'catalogo', queuePos: null,
  reaction: null, pickedAt: null, pickedBy: null, watchedAt: null, addedAt: id,
})
const details = (id: number): Details => ({
  id, mediaType: 'movie', title: `Filme ${id}`, year: '2000', posterUrl: null, backdropUrl: null,
  genreIds: [], overview: 'x', runtimeMin: null, certification: null, genres: ['Drama'],
  director: null, cast: [], trailerYoutubeKey: null, images: [], providers: [],
})
const room = (o: Record<string, unknown> = {}) => ({
  entries: [] as Entry[], loading: false, error: null, notFound: false, isOwner: false,
  save: vi.fn(), remove: vi.fn(), add: vi.fn().mockResolvedValue('added'), commit: vi.fn(),
  apply: vi.fn().mockResolvedValue(undefined), ...o,
})

describe('App', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/')
    vi.mocked(useSessions).mockReturnValue({ sessions: [], save: vi.fn().mockResolvedValue(undefined) } as never)
    vi.mocked(getLancamentos).mockResolvedValue([])
  })
  afterEach(() => vi.useRealTimers())

  it('renders brand name', () => {
    render(<App />)
    expect(screen.getByText('Nossa Sessão')).toBeInTheDocument()
  })

  it('shows incomplete-link message without a valid sala', () => {
    window.history.pushState({}, '', '/?x=1')
    render(<App />)
    expect(screen.getByText('Link incompleto, peça o link certo pro Carlos')).toBeInTheDocument()
  })

  it('shows the incomplete-link message when the room does not exist', () => {
    window.history.pushState({}, '', `/?sala=${ROOM}`)
    vi.mocked(useRoom).mockReturnValue(room({ notFound: true }) as never)
    render(<App />)
    expect(screen.getByText('Link incompleto, peça o link certo pro Carlos')).toBeInTheDocument()
    expect(screen.queryByLabelText('Buscar filme ou série')).toBeNull()
  })

  it('shows a load message when TMDB fails for every catalog entry', async () => {
    window.history.pushState({}, '', `/?sala=${ROOM}`)
    vi.mocked(useRoom).mockReturnValue(room({ entries: [entry(9001)] }) as never)
    vi.mocked(getDetails).mockRejectedValue(new Error('tmdb down'))
    render(<App />)
    expect(await screen.findByText('Não deu pra carregar os filmes agora. Recarrega a página.')).toBeInTheDocument()
  })

  it('does not show the TMDB failure message when details load', async () => {
    window.history.pushState({}, '', `/?sala=${ROOM}`)
    vi.mocked(useRoom).mockReturnValue(room({ entries: [entry(9002)] }) as never)
    vi.mocked(getDetails).mockResolvedValue(details(9002))
    render(<App />)
    expect((await screen.findAllByText('Filme 9002')).length).toBeGreaterThan(0)
    expect(screen.queryByText('Não deu pra carregar os filmes agora. Recarrega a página.')).toBeNull()
  })

  describe('search feedback', () => {
    const found: Summary = { id: 5, mediaType: 'movie', title: 'Achado', year: '1999', posterUrl: null, backdropUrl: null, genreIds: [] }
    const setup = async (result: 'added' | 'exists') => {
      window.history.pushState({}, '', `/?sala=${ROOM}`)
      vi.mocked(useRoom).mockReturnValue(
        room({ entries: [entry(9003)], add: vi.fn().mockResolvedValue(result) }) as never,
      )
      vi.mocked(getDetails).mockResolvedValue(details(9003))
      vi.mocked(searchTitles).mockResolvedValue([found])
      render(<App />)
      fireEvent.change(screen.getByLabelText('Buscar filme ou série'), { target: { value: 'ach' } })
      fireEvent.click(await screen.findByRole('button', { name: /Achado/ }))
    }

    it('says Adicionado: {title} and clears after 3 s', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true })
      await setup('added')
      expect(await screen.findByText('Adicionado: Achado')).toBeInTheDocument()
      await act(async () => {
        vi.advanceTimersByTime(3000)
      })
      expect(screen.queryByText('Adicionado: Achado')).toBeNull()
    })

    it('says Já está no catálogo when it already exists', async () => {
      await setup('exists')
      await waitFor(() => expect(screen.getByText('Já está no catálogo')).toBeInTheDocument())
    })
  })
})
