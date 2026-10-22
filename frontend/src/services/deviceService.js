import api from './api'

export const listDevices = () => api.get('/api/devices').then((r) => r.data)
export const getDevice = (id) => api.get(`/api/devices/${id}`).then((r) => r.data)
export const createDevice = (payload) => api.post('/api/devices', payload).then((r) => r.data)
export const updateDevice = (id, payload) => api.put(`/api/devices/${id}`, payload).then((r) => r.data)
export const deleteDevice = (id) => api.delete(`/api/devices/${id}`)
