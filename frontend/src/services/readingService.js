import api from './api'

export const listReadings = (params) => api.get('/api/readings', { params }).then((r) => r.data)
export const latestReadings = (deviceId) =>
  api.get('/api/readings/latest', { params: deviceId ? { device_id: deviceId } : {} }).then((r) => r.data)
export const readingHistory = (params) => api.get('/api/readings/history', { params }).then((r) => r.data)
export const readingHistoryStats = (params) => api.get('/api/readings/history/stats', { params }).then((r) => r.data)
export const exportHistoryCsvUrl = (params) => {
  const usp = new URLSearchParams(params).toString()
  return `${api.defaults.baseURL}/api/readings/history/export?${usp}`
}
