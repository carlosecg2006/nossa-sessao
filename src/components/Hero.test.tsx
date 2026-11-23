import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import Hero from './Hero'
import type { Details } from '../lib/types'

const d: Details = {
  id: 7, mediaType: 'movie', title: 'Practical Magic', year: '1998', posterUrl: null, backdropUrl: null,
  genreIds: [], overview: 'x', runtimeMin: null, certification: null, genres: [], director: null,
  cast: [], trailerYoutubeKey: null, images: [], providers: [],
}

describe('Hero', () => {
  it('Trailer opens details; Quero ver and Minha fila call their handlers with the key', () => {
    const onSelect = vi.fn(), onWant = vi.fn(), onQueue = vi.fn()
    render(<Hero details={{ ...d, trailerYoutubeKey: 'abc' }} onSelect={onSelect} onWant={onWant} onQueue={onQueue} />)
    fireEvent.click(screen.getByRole('button', { name: '▶ Trailer' }))
    fireEvent.click(screen.getByRole('button', { name: '♥ Quero ver' }))
    fireEvent.click(screen.getByRole('button', { name: '+ Minha fila' }))
    expect(onSelect).toHaveBeenCalledWith('movie-7')
    expect(onWant).toHaveBeenCalledWith('movie-7')
    expect(onQueue).toHaveBeenCalledWith('movie-7')
  })

  it('without a trailer shows Detalhes (which opens the modal) and no Trailer button', () => {
    const onSelect = vi.fn()
    render(<Hero details={d} onSelect={onSelect} onWant={vi.fn()} onQueue={vi.fn()} />)
    expect(screen.queryByRole('button', { name: '▶ Trailer' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'ⓘ Detalhes' }))
    expect(onSelect).toHaveBeenCalledWith('movie-7')
  })

  it('quotes the backdrop url', () => {
    const { container } = render(
      <Hero details={{ ...d, backdropUrl: 'http://img/a b.jpg' }} onSelect={vi.fn()} onWant={vi.fn()} onQueue={vi.fn()} />,
    )
    expect((container.firstChild as HTMLElement).style.backgroundImage).toBe('url("http://img/a b.jpg")')
  })
})
