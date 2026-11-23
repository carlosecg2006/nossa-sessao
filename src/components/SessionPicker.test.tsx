import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import SessionPicker from './SessionPicker'

describe('SessionPicker', () => {
  it('past date shows the inline message and stays open', async () => {
    const onPropose = vi.fn()
    render(<SessionPicker onPropose={onPropose} />)
    fireEvent.click(screen.getByRole('button', { name: '📅 Marcar sessão' }))
    fireEvent.change(screen.getByLabelText('Dia e horário'), { target: { value: '2000-01-01T20:00' } })
    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }))
    expect(await screen.findByText('Escolha um horário que ainda não passou.')).toBeInTheDocument()
    expect(onPropose).not.toHaveBeenCalled()
  })

  it('success sends the parsed time, confirms and closes', async () => {
    const onPropose = vi.fn().mockResolvedValue(undefined)
    render(<SessionPicker onPropose={onPropose} />)
    fireEvent.click(screen.getByRole('button', { name: '📅 Marcar sessão' }))
    fireEvent.change(screen.getByLabelText('Dia e horário'), { target: { value: '2999-01-01T20:00' } })
    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }))
    await waitFor(() => expect(onPropose).toHaveBeenCalledWith(new Date('2999-01-01T20:00').getTime()))
    expect(await screen.findByText('Pedido enviado!')).toBeInTheDocument()
    expect(screen.queryByLabelText('Dia e horário')).toBeNull()
  })

  it('rejection propagates to the caller (modal shows its save error)', async () => {
    const onPropose = vi.fn().mockRejectedValue(new Error('x'))
    const onError = vi.fn()
    render(<SessionPicker onPropose={onPropose} onError={onError} />)
    fireEvent.click(screen.getByRole('button', { name: '📅 Marcar sessão' }))
    fireEvent.change(screen.getByLabelText('Dia e horário'), { target: { value: '2999-01-01T20:00' } })
    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }))
    await waitFor(() => expect(onError).toHaveBeenCalled())
    expect(screen.queryByText('Pedido enviado!')).toBeNull()
  })
})
