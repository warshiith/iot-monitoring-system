import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import Dashboard from '../pages/Dashboard.jsx'

vi.mock('../services/dashboardService', () => ({
  getDashboardSummary: vi.fn(() =>
    Promise.resolve({
      total_devices: 3,
      online_devices: 2,
      offline_devices: 1,
      active_alerts: 1,
      latest_values: [{ sensor_type: 'temperature', value: 24.5, unit: '°C', device_id: 'ESP32-001', timestamp: new Date().toISOString() }],
    })
  ),
}))

vi.mock('../services/deviceService', () => ({
  listDevices: vi.fn(() => Promise.resolve([
    { id: '1', device_name: 'Device A', device_id: 'ESP32-001', location: 'Lab', status: 'ONLINE' },
  ])),
}))

vi.mock('../hooks/useLiveReadings.js', () => ({
  useLiveReadings: () => ({ status: 'connected', lastMessage: null }),
}))

describe('Dashboard page', () => {
  it('renders summary stats and device status', async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    )
    await waitFor(() => expect(screen.getByText('Dashboard')).toBeInTheDocument())
    await waitFor(() => expect(screen.getByText('Device A')).toBeInTheDocument())
    expect(screen.getAllByText('3').length).toBeGreaterThan(0)
  })
})
