import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ErrorBoundary from './ErrorBoundary'

function Boom(): never {
  throw new Error('boom')
}

describe('ErrorBoundary', () => {
  afterEach(() => vi.restoreAllMocks())

  it('renders children when nothing throws', () => {
    render(<ErrorBoundary><p>tudo certo</p></ErrorBoundary>)
    expect(screen.getByText('tudo certo')).toBeInTheDocument()
  })

  it('renders the header and the load-error text when a child throws', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    render(<ErrorBoundary><Boom /></ErrorBoundary>)
    expect(screen.getByText('Nossa Sessão')).toBeInTheDocument()
    expect(screen.getByText('Não deu pra carregar agora. Confere a internet e recarrega a página.')).toBeInTheDocument()
  })
})
