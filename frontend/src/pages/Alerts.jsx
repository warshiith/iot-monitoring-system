import React, { useEffect, useState, useCallback } from 'react'
import { listAlerts, acknowledgeAlert, listThresholds, createThreshold, updateThreshold } from '../services/alertService'
import { listDevices } from '../services/deviceService'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../components/Toast.jsx'
import { getErrorMessage } from '../utils/errors.js'
import { useLiveReadings } from '../hooks/useLiveReadings.js'
import StatusBadge from '../components/StatusBadge.jsx'
import EmptyState from '../components/EmptyState.jsx'
import Skeleton from '../components/Skeleton.jsx'

export default function Alerts() {
  const { isAdmin } = useAuth()
  const { push } = useToast()
  const [alerts, setAlerts] = useState([])
  const [devices, setDevices] = useState([])
  const [filter, setFilter] = useState('all') // all | active | acknowledged
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('alerts') // alerts | thresholds

  const load = useCallback(async () => {
    setLoading(true)
    const params = filter === 'active' ? { is_acknowledged: false } : filter === 'acknowledged' ? { is_acknowledged: true } : {}
    const [a, d] = await Promise.all([listAlerts(params), listDevices()])
    setAlerts(a)
    setDevices(d)
    setLoading(false)
  }, [filter])

  useEffect(() => { load() }, [load])

  useLiveReadings({
    onMessage: (msg) => {
      if (msg.type === 'reading' && msg.alert) load()
    },
  })

  const deviceName = (id) => devices.find((d) => d.id === id)?.device_name || id

  const handleAck = async (id) => {
    try {
      await acknowledgeAlert(id)
      push('Alert acknowledged.', 'success')
      load()
    } catch (err) {
      push(getErrorMessage(err, 'Failed to acknowledge alert.'), 'error')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-slate-100">Alerts</h1>
        <p className="text-sm text-slate-500 mt-1">Threshold breaches and alert configuration.</p>
      </div>

      <div className="flex gap-2 border-b border-graphite-800">
        <TabButton active={tab === 'alerts'} onClick={() => setTab('alerts')}>Alerts</TabButton>
        <TabButton active={tab === 'thresholds'} onClick={() => setTab('thresholds')}>Thresholds</TabButton>
      </div>

      {tab === 'alerts' ? (
        <>
          <div className="flex gap-2">
            {['all', 'active', 'acknowledged'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors capitalize ${
                  filter === f ? 'border-signal/40 bg-signal/10 text-signal' : 'border-graphite-700 text-slate-400 hover:bg-graphite-800'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {loading ? (
            <Skeleton className="h-64" />
          ) : alerts.length === 0 ? (
            <EmptyState title="No alerts" message="Alerts will appear here when a sensor reading crosses a configured threshold." />
          ) : (
            <div className="panel overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500 border-b border-graphite-800">
                    <th className="px-5 py-3 font-medium">Device</th>
                    <th className="px-5 py-3 font-medium">Sensor</th>
                    <th className="px-5 py-3 font-medium">Value</th>
                    <th className="px-5 py-3 font-medium">Type</th>
                    <th className="px-5 py-3 font-medium">Severity</th>
                    <th className="px-5 py-3 font-medium">Time</th>
                    <th className="px-5 py-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.map((a) => (
                    <tr key={a.id} className="border-b border-graphite-800 last:border-0 hover:bg-graphite-800/40">
                      <td className="px-5 py-3 text-slate-200">{deviceName(a.device_id)}</td>
                      <td className="px-5 py-3 text-slate-400 font-mono text-xs">{a.sensor_type}</td>
                      <td className="px-5 py-3 data-mono text-slate-200">{a.sensor_value} <span className="text-slate-600">/ {a.threshold_value}</span></td>
                      <td className="px-5 py-3"><StatusBadge value={a.alert_type} /></td>
                      <td className="px-5 py-3"><StatusBadge value={a.severity} /></td>
                      <td className="px-5 py-3 text-slate-500 font-mono text-xs">{new Date(a.created_at).toLocaleString()}</td>
                      <td className="px-5 py-3 text-right">
                        {a.is_acknowledged ? (
                          <span className="text-xs text-slate-600">Acknowledged</span>
                        ) : (
                          <button onClick={() => handleAck(a.id)} className="text-xs text-signal hover:text-signal-dim">Acknowledge</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        <ThresholdsPanel devices={devices} isAdmin={isAdmin} push={push} />
      )}
    </div>
  )
}

function TabButton({ active, children, ...props }) {
  return (
    <button
      {...props}
      className={`px-4 py-2 text-sm border-b-2 -mb-px transition-colors ${
        active ? 'border-signal text-signal' : 'border-transparent text-slate-500 hover:text-slate-300'
      }`}
    >
      {children}
    </button>
  )
}

const SENSOR_TYPES = ['temperature', 'humidity', 'air_quality', 'light_intensity']

function ThresholdsPanel({ devices, isAdmin, push }) {
  const [deviceId, setDeviceId] = useState('')
  const [thresholds, setThresholds] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ sensor_type: 'temperature', minimum_threshold: '', maximum_threshold: '', severity: 'MEDIUM' })

  useEffect(() => {
    if (devices.length && !deviceId) setDeviceId(devices[0].id)
  }, [devices, deviceId])

  const load = useCallback(async () => {
    if (!deviceId) return
    setLoading(true)
    const t = await listThresholds(deviceId)
    setThresholds(t)
    setLoading(false)
  }, [deviceId])

  useEffect(() => { load() }, [load])

  const existing = (sensorType) => thresholds.find((t) => t.sensor_type === sensorType)

  const handleSave = async (e) => {
    e.preventDefault()
    const payload = {
      device_id: deviceId,
      sensor_type: form.sensor_type,
      minimum_threshold: form.minimum_threshold === '' ? null : Number(form.minimum_threshold),
      maximum_threshold: form.maximum_threshold === '' ? null : Number(form.maximum_threshold),
      severity: form.severity,
      enabled: true,
    }
    try {
      const found = existing(form.sensor_type)
      if (found) await updateThreshold(found.id, payload)
      else await createThreshold(payload)
      push('Threshold saved.', 'success')
      load()
    } catch (err) {
      push(getErrorMessage(err, 'Failed to save threshold.'), 'error')
    }
  }

  if (!devices.length) return <EmptyState title="No devices" message="Register a device first to configure thresholds." />

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1.5">Device</label>
        <select value={deviceId} onChange={(e) => setDeviceId(e.target.value)}
          className="bg-graphite-800 border border-graphite-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-signal/50 min-w-[200px]">
          {devices.map((d) => <option key={d.id} value={d.id}>{d.device_name}</option>)}
        </select>
      </div>

      {loading ? (
        <Skeleton className="h-32" />
      ) : (
        <div className="panel overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 border-b border-graphite-800">
                <th className="px-5 py-3 font-medium">Sensor</th>
                <th className="px-5 py-3 font-medium">Min</th>
                <th className="px-5 py-3 font-medium">Max</th>
                <th className="px-5 py-3 font-medium">Severity</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {SENSOR_TYPES.map((type) => {
                const t = existing(type)
                return (
                  <tr key={type} className="border-b border-graphite-800 last:border-0">
                    <td className="px-5 py-3 text-slate-200 font-mono text-xs">{type}</td>
                    <td className="px-5 py-3 text-slate-400">{t?.minimum_threshold ?? '—'}</td>
                    <td className="px-5 py-3 text-slate-400">{t?.maximum_threshold ?? '—'}</td>
                    <td className="px-5 py-3">{t ? <StatusBadge value={t.severity} /> : '—'}</td>
                    <td className="px-5 py-3 text-xs text-slate-500">{t ? (t.enabled ? 'Enabled' : 'Disabled') : 'Not configured'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {isAdmin && (
        <form onSubmit={handleSave} className="panel p-5 grid sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Sensor</label>
            <select value={form.sensor_type} onChange={(e) => setForm({ ...form, sensor_type: e.target.value })}
              className="w-full bg-graphite-800 border border-graphite-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-signal/50">
              {SENSOR_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Minimum</label>
            <input type="number" step="any" value={form.minimum_threshold} onChange={(e) => setForm({ ...form, minimum_threshold: e.target.value })}
              className="w-full bg-graphite-800 border border-graphite-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-signal/50" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Maximum</label>
            <input type="number" step="any" value={form.maximum_threshold} onChange={(e) => setForm({ ...form, maximum_threshold: e.target.value })}
              className="w-full bg-graphite-800 border border-graphite-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-signal/50" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Severity</label>
            <select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}
              className="w-full bg-graphite-800 border border-graphite-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-signal/50">
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
            </select>
          </div>
          <div className="sm:col-span-4">
            <button className="bg-signal text-graphite-950 text-sm font-medium px-4 py-2 rounded-lg hover:bg-signal-dim transition-colors">
              Save threshold
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
