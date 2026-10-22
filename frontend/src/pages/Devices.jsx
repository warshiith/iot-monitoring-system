import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listDevices, createDevice, deleteDevice } from '../services/deviceService'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../components/Toast.jsx'
import { getErrorMessage } from '../utils/errors.js'
import StatusBadge from '../components/StatusBadge.jsx'
import EmptyState from '../components/EmptyState.jsx'
import Skeleton from '../components/Skeleton.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'

function timeAgo(iso) {
  if (!iso) return 'never'
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return `${Math.floor(diff)}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function Devices() {
  const { isAdmin } = useAuth()
  const { push } = useToast()
  const [devices, setDevices] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ device_id: '', device_name: '', location: '', device_type: '', description: '' })
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const load = async () => {
    setLoading(true)
    const data = await listDevices()
    setDevices(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await createDevice(form)
      push('Device created successfully.', 'success')
      setShowForm(false)
      setForm({ device_id: '', device_name: '', location: '', device_type: '', description: '' })
      load()
    } catch (err) {
      push(getErrorMessage(err, 'Failed to create device.'), 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    try {
      await deleteDevice(deleteTarget.id)
      push('Device removed.', 'success')
      setDeleteTarget(null)
      load()
    } catch (err) {
      push(getErrorMessage(err, 'Failed to delete device.'), 'error')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-slate-100">Devices</h1>
          <p className="text-sm text-slate-500 mt-1">Register and manage your IoT devices.</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowForm((s) => !s)}
            className="bg-signal text-graphite-950 text-sm font-medium px-4 py-2 rounded-lg hover:bg-signal-dim transition-colors"
          >
            {showForm ? 'Cancel' : '+ Add device'}
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="panel p-5 grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Device ID</label>
            <input required value={form.device_id} onChange={(e) => setForm({ ...form, device_id: e.target.value })}
              placeholder="ESP32-004"
              className="w-full bg-graphite-800 border border-graphite-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-signal/50" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Device name</label>
            <input required value={form.device_name} onChange={(e) => setForm({ ...form, device_name: e.target.value })}
              placeholder="Warehouse Sensor"
              className="w-full bg-graphite-800 border border-graphite-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-signal/50" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Location</label>
            <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="Warehouse B"
              className="w-full bg-graphite-800 border border-graphite-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-signal/50" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Device type</label>
            <input value={form.device_type} onChange={(e) => setForm({ ...form, device_type: e.target.value })}
              placeholder="environmental"
              className="w-full bg-graphite-800 border border-graphite-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-signal/50" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Description</label>
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full bg-graphite-800 border border-graphite-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-signal/50" />
          </div>
          <div className="sm:col-span-2">
            <button disabled={submitting} className="bg-signal text-graphite-950 text-sm font-medium px-4 py-2 rounded-lg hover:bg-signal-dim transition-colors disabled:opacity-60">
              {submitting ? 'Creating…' : 'Create device'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : devices.length === 0 ? (
        <EmptyState title="No devices yet" message="Register a device to begin receiving sensor readings." />
      ) : (
        <div className="panel overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 border-b border-graphite-800">
                <th className="px-5 py-3 font-medium">Device</th>
                <th className="px-5 py-3 font-medium">Location</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Last seen</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {devices.map((d) => (
                <tr key={d.id} className="border-b border-graphite-800 last:border-0 hover:bg-graphite-800/40">
                  <td className="px-5 py-3">
                    <Link to={`/devices/${d.id}`} className="text-slate-200 hover:text-signal">{d.device_name}</Link>
                    <div className="text-xs text-slate-500 font-mono">{d.device_id}</div>
                  </td>
                  <td className="px-5 py-3 text-slate-400">{d.location || '—'}</td>
                  <td className="px-5 py-3"><StatusBadge value={d.status} /></td>
                  <td className="px-5 py-3 text-slate-500 font-mono text-xs">{timeAgo(d.last_seen)}</td>
                  <td className="px-5 py-3 text-right">
                    {isAdmin && (
                      <button onClick={() => setDeleteTarget(d)} className="text-xs text-slate-500 hover:text-alert-high">
                        Delete
                      </button>
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
        title="Delete device"
        message={`This will permanently remove "${deleteTarget?.device_name}" and all its readings.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        danger
      />
    </div>
  )
}
