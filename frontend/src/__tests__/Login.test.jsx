import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import Login from '../pages/Login.jsx'
import { AuthProvider } from '../context/AuthContext.jsx'

vi.mock('../services/authService', () => ({
  login: vi.fn(() =>
    Promise.resolve({
      access_token: 'fake-token',
      user: { id: '1', name: 'Test User', email: 'admin@iot.local', role: 'admin', is_active: true },
    })
  ),
  getCurrentUser: vi.fn(() => Promise.reject(new Error('no token'))),
}))

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <AuthProvider>
        <Login />
      </AuthProvider>
    </MemoryRouter>
  )
}

describe('Login page', () => {
  beforeEach(() => localStorage.clear())

  it('renders the sign in form', () => {
    renderLogin()
    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument()
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument()
  })

  it('submits credentials and stores a token on success', async () => {
    renderLogin()
    fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: 'admin@iot.local' } })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'Admin@123' } })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(localStorage.getItem('access_token')).toBe('fake-token')
    })
  })
})
