import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./lib/firebase', () => ({
  db: () => ({}),
  ensureAuth: () => Promise.reject(new Error('auth/invalid-api-key')),
}))
vi.mock('./lib/tmdb')

import App from './App'
import { getLancamentos } from './lib/tmdb'

describe('App when auth fails', () => {
  beforeEach(() => {
    vi.mocked(getLancamentos).mockResolvedValue([])
    window.history.pushState({}, '', '/?sala=' + 'a'.repeat(20))
  })

  it('shows the header and the load-error text instead of a white page', async () => {
    render(<App />)
    expect(screen.getByText('Nossa Sessão')).toBeInTheDocument()
    expect(
      await screen.findByText('Não deu pra carregar agora. Confere a internet e recarrega a página.'),
    ).toBeInTheDocument()
  })
})
