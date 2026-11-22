import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  beforeEach(() => window.history.pushState({}, '', '/'))

  it('renders brand name', () => {
    render(<App />)
    expect(screen.getByText('Nossa Sessão')).toBeInTheDocument()
  })

  it('shows incomplete-link message without a valid sala', () => {
    window.history.pushState({}, '', '/?x=1')
    render(<App />)
    expect(screen.getByText('Link incompleto, peça o link certo pro Carlos')).toBeInTheDocument()
  })
})
