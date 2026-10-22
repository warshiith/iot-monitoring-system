import api from './api'

export const listSensors = (deviceId) =>
  api.get('/api/sensors', { params: deviceId ? { device_id: deviceId } : {} }).then((r) => r.data)
export const createSensor = (payload) => api.post('/api/sensors', payload).then((r) => r.data)
export const updateSensor = (id, payload) => api.put(`/api/sensors/${id}`, payload).then((r) => r.data)
export const deleteSensor = (id) => api.delete(`/api/sensors/${id}`)
