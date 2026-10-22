import React, { useEffect, useState } from 'react'
import { listDevices } from '../services/deviceService'
import { listSensors, createSensor, deleteSensor } from '../services/sensorService'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../components/Toast.jsx'
import { getErrorMessage } from '../utils/errors.js'
import EmptyState from '../components/EmptyState.jsx'
import Skeleton from '../components/Skeleton.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'

const SENSOR_TYPE_OPTIONS = ['temperature', 'humidity', 'air_quality', 'light_intensity', 'custom']

export default function Sensors() {
  const { isAdmin } = useAuth()
  const { push } = useToast()
  const [devices, setDevices] = useState([])
  const [sensors, setSensors] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [form, setForm] = useState({
    device_id: '', sensor_type: 'temperature', sensor_name: '', unit: '°C',
    minimum_value: '', maximum_value: '',
  })

  const load = async () => {
    setLoading(true)
    const [d, s] = await Promise.all([listDevices(), listSensors()])
    setDevices(d)
    setSensors(s)
    setLoading(false)
    if (d.length && !form.device_id) setForm((f) => ({ ...f, device_id: d[0].id }))
  }

  useEffect(() => { load() }, [])

  const deviceName = (deviceId) => devices.find((d) => d.id === deviceId)?.device_name || deviceId

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      await createSensor({
        ...form,
        minimum_value: form.minimum_value === '' ? null : Number(form.minimum_value),
        maximum_value: form.maximum_value === '' ? null : Number(form.maximum_value),
      })
      push('Sensor added.', 'success')
      setShowForm(false)
      load()
    } catch (err) {
      push(getErrorMessage(err, 'Failed to add sensor.'), 'error')
    }
  }

  const handleDelete = async () => {
    try {
      await deleteSensor(deleteTarget.id)
      push('Sensor removed.', 'success')
      setDeleteTarget(null)
      load()
    } catch (err) {
      push(getErrorMessage(err, 'Failed to delete sensor.'), 'error')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-slate-100">Sensors</h1>
          <p className="text-sm text-slate-500 mt-1">Configure sensors attached to your devices.</p>
        </div>
        {isAdmin && devices.length > 0 && (
          <button onClick={() => setShowForm((s) => !s)} className="bg-signal text-graphite-950 text-sm font-medium px-4 py-2 rounded-lg hover:bg-signal-dim transition-colors">
            {showForm ? 'Cancel' : '+ Add sensor'}
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="panel p-5 grid sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Device</label>
            <select value={form.device_id} onChange={(e) => setForm({ ...form, device_id: e.target.value })}
              className="w-full bg-graphite-800 border border-graphite-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-signal/50">
              {devices.map((d) => <option key={d.id} value={d.id}>{d.device_name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Sensor type</label>
            <select value={form.sensor_type} onChange={(e) => setForm({ ...form, sensor_type: e.target.value })}
              className="w-full bg-graphite-800 border border-graphite-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-signal/50">
              {SENSOR_TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Sensor name</label>
            <input required value={form.sensor_name} onChange={(e) => setForm({ ...form, sensor_name: e.target.value })}
              placeholder="Ambient Temperature"
              className="w-full bg-graphite-800 border border-graphite-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-signal/50" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Unit</label>
            <input required value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}
              className="w-full bg-graphite-800 border border-graphite-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-signal/50" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Minimum value</label>
            <input type="number" step="any" value={form.minimum_value} onChange={(e) => setForm({ ...form, minimum_value: e.target.value })}
              className="w-full bg-graphite-800 border border-graphite-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-signal/50" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Maximum value</label>
            <input type="number" step="any" value={form.maximum_value} onChange={(e) => setForm({ ...form, maximum_value: e.target.value })}
              className="w-full bg-graphite-800 border border-graphite-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-signal/50" />
          </div>
          <div className="sm:col-span-3">
            <button className="bg-signal text-graphite-950 text-sm font-medium px-4 py-2 rounded-lg hover:bg-signal-dim transition-colors">
              Add sensor
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <Skeleton className="h-48" />
      ) : sensors.length === 0 ? (
        <EmptyState title="No sensors configured" message="Add a sensor to a device to begin monitoring specific parameters." />
      ) : (
        <div className="panel overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 border-b border-graphite-800">
                <th className="px-5 py-3 font-medium">Sensor</th>
                <th className="px-5 py-3 font-medium">Device</th>
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium">Range</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {sensors.map((s) => (
                <tr key={s.id} className="border-b border-graphite-800 last:border-0 hover:bg-graphite-800/40">
                  <td className="px-5 py-3 text-slate-200">{s.sensor_name}</td>
                  <td className="px-5 py-3 text-slate-400">{deviceName(s.device_id)}</td>
                  <td className="px-5 py-3 text-slate-400 font-mono text-xs">{s.sensor_type}</td>
                  <td className="px-5 py-3 text-slate-400 font-mono text-xs">
                    {s.minimum_value ?? '—'} – {s.maximum_value ?? '—'} {s.unit}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {isAdmin && (
                      <button onClick={() => setDeleteTarget(s)} className="text-xs text-slate-500 hover:text-alert-high">Delete</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete sensor"
        message={`Remove "${deleteTarget?.sensor_name}"? Historical readings will be kept but unlinked.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        danger
      />
    </div>
  )
}
