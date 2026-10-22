import React, { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { getDashboardSummary } from '../services/dashboardService'
import { listDevices } from '../services/deviceService'
import { useLiveReadings } from '../hooks/useLiveReadings.js'
import StatCard from '../components/StatCard.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import Skeleton from '../components/Skeleton.jsx'
import EmptyState from '../components/EmptyState.jsx'

const SENSOR_LABELS = {
  temperature: 'Temperature',
  humidity: 'Humidity',
  air_quality: 'Air Quality',
  light_intensity: 'Light Intensity',
}

function timeAgo(iso) {
  if (!iso) return 'never'
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return `${Math.floor(diff)}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function Dashboard() {
  const [summary, setSummary] = useState(null)
  const [devices, setDevices] = useState([])
  const [loading, setLoading] = useState(true)
  const [recent, setRecent] = useState([])

  const load = useCallback(async () => {
    const [s, d] = await Promise.all([getDashboardSummary(), listDevices()])
    setSummary(s)
    setDevices(d)
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(load, 15000)
    return () => clearInterval(interval)
  }, [load])

  useLiveReadings({
    onMessage: (msg) => {
      if (msg.type === 'reading') {
        setRecent((r) => [msg, ...r].slice(0, 8))
      }
    },
  })

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-slate-100">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Live overview of your sensor network.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total devices" value={summary.total_devices} />
        <StatCard label="Online" value={summary.online_devices} accent="text-signal" />
        <StatCard label="Offline" value={summary.offline_devices} accent="text-slate-500" />
        <StatCard label="Active alerts" value={summary.active_alerts} accent={summary.active_alerts > 0 ? 'text-alert-high' : 'text-slate-100'} />
      </div>

      <div>
        <h2 className="text-sm font-medium text-slate-400 mb-3">Latest sensor values</h2>
        {summary.latest_values.length === 0 ? (
          <EmptyState title="No readings yet" message="Once devices start sending data, the latest values will appear here." />
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {summary.latest_values.map((v) => (
              <div key={v.sensor_type} className="panel p-5">
                <div className="text-xs text-slate-500 mb-2">{SENSOR_LABELS[v.sensor_type] || v.sensor_type}</div>
                <div className="font-display text-2xl font-semibold data-mono text-slate-100">
                  {v.value}
                  <span className="text-sm text-slate-500 ml-1 font-body">{v.unit}</span>
                </div>
                <div className="text-[11px] text-slate-600 mt-2 font-mono">{timeAgo(v.timestamp)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="panel p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-slate-400">Device status</h2>
            <Link to="/devices" className="text-xs text-signal hover:text-signal-dim">View all →</Link>
          </div>
          {devices.length === 0 ? (
            <EmptyState title="No devices registered" message="Add your first device to start collecting data." />
          ) : (
            <div className="space-y-2">
              {devices.slice(0, 6).map((d) => (
                <div key={d.id} className="flex items-center justify-between py-2 border-b border-graphite-800 last:border-0">
                  <div>
                    <div className="text-sm text-slate-200">{d.device_name}</div>
                    <div className="text-xs text-slate-500 font-mono">{d.device_id} · {d.location || 'unassigned'}</div>
                  </div>
                  <StatusBadge value={d.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="panel p-5">
          <h2 className="text-sm font-medium text-slate-400 mb-4">Live feed</h2>
          {recent.length === 0 ? (
            <EmptyState title="Waiting for data" message="New readings will stream in here as devices report." />
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto scrollbar-thin">
              {recent.map((r, i) => (
                <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-graphite-800 last:border-0">
                  <span className="text-slate-400 font-mono text-xs">{r.device_id}</span>
                  <span className="text-slate-300">{SENSOR_LABELS[r.sensor_type] || r.sensor_type}</span>
                  <span className="data-mono text-slate-100">{r.value} {r.unit}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
