import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import DetailsModal from './DetailsModal'
import type { Entry } from '../lib/catalog'
import type { Details } from '../lib/types'

const details = (o: Partial<Details> = {}): Details => ({
  id: 7,
  mediaType: 'movie',
  title: 'Practical Magic',
  year: '1998',
  posterUrl: null,
  backdropUrl: 'http://img/b.jpg',
  genreIds: [],
  overview: 'Duas irmãs bruxas.',
  runtimeMin: 103,
  certification: '12',
  genres: ['Fantasia', 'Romance'],
  director: 'Griffin Dunne',
  cast: ['Sandra Bullock', 'Nicole Kidman'],
  trailerYoutubeKey: 'abc123',
  images: ['http://img/1.jpg', 'http://img/2.jpg'],
  providers: [{ name: 'Max', logoUrl: 'http://img/max.png' }],
  ...o,
})
const entry = (o: Partial<Entry> = {}): Entry => ({
  key: 'movie-7',
  tmdbId: 7,
  mediaType: 'movie',
  status: 'catalogo',
  queuePos: null,
  reaction: null,
  pickedAt: null,
  watchedAt: null,
  addedAt: 1,
  ...o,
})

function setup(p: { details?: Details | null; entry?: Entry | null; isOwner?: boolean } = {}) {
  const onApply = vi.fn().mockResolvedValue(undefined)
  const onAdd = vi.fn().mockResolvedValue(undefined)
  const onRemove = vi.fn().mockResolvedValue(undefined)
  const onClose = vi.fn()
  const d = p.details === undefined ? details() : p.details
  const e = p.entry === undefined ? entry() : p.entry
  render(
    <DetailsModal details={d} entry={e} isOwner={p.isOwner ?? false} onApply={onApply} onAdd={onAdd} onRemove={onRemove} onClose={onClose} />,
  )
  return { onApply, onAdd, onRemove, onClose }
}

describe('DetailsModal', () => {
  it('shows providers, name only when logo is empty, or the no-BR message', () => {
    setup({ details: details({ providers: [{ name: 'Max', logoUrl: 'http://img/max.png' }, { name: 'Globoplay', logoUrl: '' }] }) })
    expect(screen.getByAltText('Max')).toBeInTheDocument()
    expect(screen.getByText('Globoplay')).toBeInTheDocument()
    expect(screen.getAllByRole('img', { hidden: true }).filter((i) => i.getAttribute('src') === '')).toHaveLength(0)
    expect(screen.queryByText('Ainda não está em streaming oficial no Brasil')).toBeNull()
  })

  it('shows the no-BR message without providers', () => {
    setup({ details: details({ providers: [] }) })
    expect(screen.getByText('Ainda não está em streaming oficial no Brasil')).toBeInTheDocument()
  })

  it('renders metadata and photo strip', () => {
    setup()
    expect(screen.getByText(/1998/)).toHaveTextContent('1998 · 1h 43min')
    expect(screen.getByText('Fantasia · Romance')).toBeInTheDocument()
    expect(screen.getByText('Direção: Griffin Dunne')).toBeInTheDocument()
    expect(screen.getByText('Elenco: Sandra Bullock, Nicole Kidman')).toBeInTheDocument()
    expect(screen.getAllByAltText('Cena de Practical Magic')).toHaveLength(2)
  })

  it('shows loading when details is null', () => {
    setup({ details: null })
    expect(screen.getByText('Carregando…')).toBeInTheDocument()
  })

  it('hides Trailer button when trailerYoutubeKey is null; shows iframe on click otherwise', () => {
    setup()
    fireEvent.click(screen.getByRole('button', { name: '▶ Trailer' }))
    const f = screen.getByTitle('Trailer de Practical Magic')
    expect(f).toHaveAttribute('src', 'https://www.youtube-nocookie.com/embed/abc123?autoplay=1')
  })

  it('hides Trailer button without key', () => {
    setup({ details: details({ trailerYoutubeKey: null }) })
    expect(screen.queryByRole('button', { name: '▶ Trailer' })).toBeNull()
  })

  it('Quero ver calls react quero via onApply', async () => {
    const { onApply } = setup()
    fireEvent.click(screen.getByRole('button', { name: '♥ Quero ver' }))
    expect(onApply).toHaveBeenCalledTimes(1)
    const out = onApply.mock.calls[0][0]([entry()])
    expect(out[0].reaction).toBe('quero')
    await waitFor(() => expect(onApply).toHaveBeenCalled())
  })

  it('shows pressed states', () => {
    setup({ entry: entry({ reaction: 'quero' }) })
    expect(screen.getByRole('button', { name: '♥ Você quer ver' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('Não curti applies naocurti', () => {
    const { onApply } = setup()
    fireEvent.click(screen.getByRole('button', { name: '👎 Não curti' }))
    expect(onApply.mock.calls[0][0]([entry()])[0].reaction).toBe('naocurti')
  })

  it('Já assistimos only when in fila; + Fila only in catalogo; Ver de novo when assistido', () => {
    const a = setup({ entry: entry({ status: 'fila', queuePos: 0 }) })
    expect(screen.getByRole('button', { name: '✓ Já assistimos' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '+ Fila' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: '✓ Já assistimos' }))
    expect(a.onApply.mock.calls[0][0]([entry({ status: 'fila', queuePos: 0 })])[0].status).toBe('assistido')
  })

  it('+ Fila in catalogo, no Já assistimos', () => {
    const { onApply } = setup()
    expect(screen.queryByRole('button', { name: '✓ Já assistimos' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: '+ Fila' }))
    expect(onApply.mock.calls[0][0]([entry()])[0].status).toBe('fila')
  })

  it('Ver de novo when assistido', () => {
    const { onApply } = setup({ entry: entry({ status: 'assistido', watchedAt: 5 }) })
    expect(screen.queryByRole('button', { name: '+ Fila' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: '↺ Ver de novo' }))
    expect(onApply.mock.calls[0][0]([entry({ status: 'assistido' })])[0].status).toBe('fila')
  })

  it('hides Remover for non-owner', () => {
    setup({ isOwner: false })
    expect(screen.queryByRole('button', { name: 'Remover do catálogo' })).toBeNull()
  })

  it('Remover (owner) calls onRemove then onClose', async () => {
    const b = setup({ isOwner: true })
    fireEvent.click(screen.getByRole('button', { name: 'Remover do catálogo' }))
    await waitFor(() => expect(b.onClose).toHaveBeenCalled())
    expect(b.onRemove).toHaveBeenCalledWith('movie-7')
  })

  it('not in catalog shows only Adicionar', () => {
    const { onAdd } = setup({ entry: null, isOwner: true })
    expect(screen.queryByRole('button', { name: '♥ Quero ver' })).toBeNull()
    expect(screen.queryByRole('button', { name: /Fila|assistimos|Remover/ })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: '+ Adicionar ao catálogo' }))
    expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({ id: 7, title: 'Practical Magic' }))
  })

  it('closes on Esc and backdrop but not panel click', () => {
    const { onClose } = setup()
    fireEvent.click(screen.getByRole('dialog'))
    expect(onClose).not.toHaveBeenCalled()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByTestId('modal-backdrop'))
    expect(onClose).toHaveBeenCalledTimes(2)
    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }))
    expect(onClose).toHaveBeenCalledTimes(3)
  })

  it('shows inline error when an action rejects', async () => {
    const { onApply } = setup()
    onApply.mockRejectedValueOnce(new Error('x'))
    fireEvent.click(screen.getByRole('button', { name: '+ Fila' }))
    expect(await screen.findByText('Não deu pra salvar agora, tenta de novo.')).toBeInTheDocument()
  })

  it('moves focus in, traps Tab, restores focus and locks scroll', () => {
    const opener = document.createElement('button')
    document.body.appendChild(opener)
    opener.focus()
    const onClose = vi.fn()
    const props = { details: details(), entry: entry(), isOwner: false, onApply: vi.fn(), onAdd: vi.fn(), onRemove: vi.fn(), onClose }
    const { unmount } = render(<DetailsModal {...props} />)
    const dialog = screen.getByRole('dialog')
    expect(dialog).toContainElement(document.activeElement as HTMLElement)
    expect(document.body.style.overflow).toBe('hidden')
    const focusables = dialog.querySelectorAll<HTMLElement>('button')
    focusables[focusables.length - 1].focus()
    fireEvent.keyDown(document.activeElement!, { key: 'Tab' })
    expect(document.activeElement).toBe(focusables[0])
    fireEvent.keyDown(document.activeElement!, { key: 'Tab', shiftKey: true })
    expect(document.activeElement).toBe(focusables[focusables.length - 1])
    unmount()
    expect(document.activeElement).toBe(opener)
    expect(document.body.style.overflow).toBe('')
    opener.remove()
  })
})
