import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import SearchBar from './SearchBar'
import { searchTitles } from '../lib/tmdb'
import type { Summary } from '../lib/types'

vi.mock('../lib/tmdb')

const s = (id: number, title: string): Summary => ({
  id,
  mediaType: 'movie',
  title,
  year: '2001',
  posterUrl: null,
  backdropUrl: null,
  genreIds: [],
})

describe('SearchBar', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.mocked(searchTitles).mockReset()
  })
  afterEach(() => vi.useRealTimers())

  it('debounces 300 ms, lists up to 8 results; click calls onAdd and clears', async () => {
    vi.mocked(searchTitles).mockResolvedValue(Array.from({ length: 10 }, (_, i) => s(i, `Filme ${i}`)))
    const onAdd = vi.fn()
    render(<SearchBar onAdd={onAdd} />)
    const input = screen.getByPlaceholderText('Buscar filme ou série')

    fireEvent.change(input, { target: { value: 'har' } })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(299)
    })
    expect(searchTitles).not.toHaveBeenCalled()
    fireEvent.change(input, { target: { value: 'harry' } })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300)
    })
    expect(searchTitles).toHaveBeenCalledTimes(1)
    expect(searchTitles).toHaveBeenCalledWith('harry')

    expect(screen.getAllByRole('button')).toHaveLength(8)
    expect(screen.getByText('Filme 0')).toBeInTheDocument()
    expect(screen.getAllByText('2001')).toHaveLength(8)

    fireEvent.click(screen.getByRole('button', { name: /Filme 3/ }))
    expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({ id: 3 }))
    expect(input).toHaveValue('')
    expect(screen.queryByText('Filme 0')).not.toBeInTheDocument()
  })

  it('does not search for blank input', async () => {
    render(<SearchBar onAdd={vi.fn()} />)
    fireEvent.change(screen.getByPlaceholderText('Buscar filme ou série'), { target: { value: '  ' } })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500)
    })
    expect(searchTitles).not.toHaveBeenCalled()
  })
})
