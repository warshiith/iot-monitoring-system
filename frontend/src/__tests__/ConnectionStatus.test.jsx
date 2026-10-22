import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import ConnectionStatus from '../components/ConnectionStatus.jsx'

describe('ConnectionStatus', () => {
  it('shows Connected label when status is connected', () => {
    render(<ConnectionStatus status="connected" />)
    expect(screen.getByText('Connected')).toBeInTheDocument()
  })

  it('shows Disconnected label when status is disconnected', () => {
    render(<ConnectionStatus status="disconnected" />)
    expect(screen.getByText('Disconnected')).toBeInTheDocument()
  })

  it('shows Reconnecting label when status is reconnecting', () => {
    render(<ConnectionStatus status="reconnecting" />)
    expect(screen.getByText('Reconnecting…')).toBeInTheDocument()
  })
})
