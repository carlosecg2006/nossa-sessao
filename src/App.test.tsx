import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  it('renders brand name', () => {
    render(<App />)
    expect(screen.getByText('Nossa Sessão')).toBeInTheDocument()
  })
})
