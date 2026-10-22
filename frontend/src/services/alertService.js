import api from './api'

export const listAlerts = (params) => api.get('/api/alerts', { params }).then((r) => r.data)
export const acknowledgeAlert = (id) => api.put(`/api/alerts/${id}/acknowledge`).then((r) => r.data)

export const listThresholds = (deviceId) =>
  api.get('/api/thresholds', { params: deviceId ? { device_id: deviceId } : {} }).then((r) => r.data)
export const createThreshold = (payload) => api.post('/api/thresholds', payload).then((r) => r.data)
export const updateThreshold = (id, payload) => api.put(`/api/thresholds/${id}`, payload).then((r) => r.data)
export const deleteThreshold = (id) => api.delete(`/api/thresholds/${id}`)
