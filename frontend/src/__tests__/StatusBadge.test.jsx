import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import StatusBadge from '../components/StatusBadge.jsx'

describe('StatusBadge', () => {
  it('renders the given status value', () => {
    render(<StatusBadge value="ONLINE" />)
    expect(screen.getByText('ONLINE')).toBeInTheDocument()
  })

  it('renders unknown statuses with a fallback style', () => {
    render(<StatusBadge value="UNKNOWN" />)
    expect(screen.getByText('UNKNOWN')).toBeInTheDocument()
  })
})
