import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import Row from './Row'
import type { Row as RowData, RowItem } from '../lib/rows'
import type { Entry } from '../lib/catalog'

const item = (id: number, pos: number): RowItem => ({
  key: `movie-${id}`,
  summary: { id, mediaType: 'movie', title: `T${id}`, year: '2000', posterUrl: null, backdropUrl: null, genreIds: [] },
  entry: {
    key: `movie-${id}`, tmdbId: id, mediaType: 'movie', status: 'fila', queuePos: pos, reaction: null,
    pickedAt: null, pickedBy: null, watchedAt: null, addedAt: 1,
  } as Entry,
})
const fila: RowData = { id: 'fila', title: 'Nossa fila', items: [item(1, 0), item(2, 1), item(3, 2)] }
const other: RowData = { id: 'escolhidos', title: 'x', items: fila.items }

describe('Row queue reorder', () => {
  it('hides ◀ on the first card and ▶ on the last', () => {
    render(<Row row={fila} onSelect={vi.fn()} onMove={vi.fn()} onDrop={vi.fn()} />)
    expect(screen.getAllByRole('button', { name: 'Mover pra esquerda' })).toHaveLength(2)
    expect(screen.getAllByRole('button', { name: 'Mover pra direita' })).toHaveLength(2)
  })

  it('click calls onMove and does not select', () => {
    const onSelect = vi.fn(), onMove = vi.fn()
    render(<Row row={fila} onSelect={onSelect} onMove={onMove} onDrop={vi.fn()} />)
    fireEvent.click(screen.getAllByRole('button', { name: 'Mover pra direita' })[0])
    expect(onMove).toHaveBeenCalledWith('movie-1', 1)
    fireEvent.click(screen.getAllByRole('button', { name: 'Mover pra esquerda' })[0])
    expect(onMove).toHaveBeenCalledWith('movie-2', -1)
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('no move buttons in other rows', () => {
    render(<Row row={other} onSelect={vi.fn()} onMove={vi.fn()} onDrop={vi.fn()} />)
    expect(screen.queryByRole('button', { name: 'Mover pra direita' })).toBeNull()
  })

  it('dropping a card on another calls onDrop with dragged key and target position', () => {
    const onDrop = vi.fn()
    render(<Row row={fila} onSelect={vi.fn()} onMove={vi.fn()} onDrop={onDrop} />)
    const cards = [screen.getByRole('button', { name: 'T1' }), screen.getByRole('button', { name: 'T3' })]
    const dt = { setData: vi.fn(), getData: vi.fn(), effectAllowed: '' }
    fireEvent.dragStart(cards[0], { dataTransfer: dt })
    fireEvent.drop(cards[1], { dataTransfer: dt })
    expect(onDrop).toHaveBeenCalledWith('movie-1', 2)
  })
})
