import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getDevice } from '../services/deviceService'
import { listSensors } from '../services/sensorService'
import { readingHistory } from '../services/readingService'
import StatusBadge from '../components/StatusBadge.jsx'
import SensorLineChart from '../charts/SensorLineChart.jsx'
import Skeleton from '../components/Skeleton.jsx'
import EmptyState from '../components/EmptyState.jsx'

export default function DeviceDetails() {
  const { id } = useParams()
  const [device, setDevice] = useState(null)
  const [sensors, setSensors] = useState([])
  const [readings, setReadings] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [d, s] = await Promise.all([getDevice(id), listSensors(id)])
      setDevice(d)
      setSensors(s)

      const readingEntries = await Promise.all(
        s.map((sensor) =>
          readingHistory({ device_id: id, sensor_type: sensor.sensor_type, time_range: '24h', limit: 200 })
            .then((data) => [sensor.sensor_type, data])
            .catch(() => [sensor.sensor_type, []])
        )
      )
      setReadings(Object.fromEntries(readingEntries))
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) {
    return <div className="space-y-4"><Skeleton className="h-24" /><Skeleton className="h-64" /></div>
  }

  if (!device) return <EmptyState title="Device not found" message="This device may have been removed." />

  return (
    <div className="space-y-6">
      <Link to="/devices" className="text-xs text-slate-500 hover:text-signal">← Back to devices</Link>

      <div className="panel p-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-slate-100">{device.device_name}</h1>
          <p className="text-sm text-slate-500 font-mono mt-1">{device.device_id}</p>
          {device.description && <p className="text-sm text-slate-400 mt-2 max-w-lg">{device.description}</p>}
        </div>
        <div className="flex flex-col items-end gap-2">
          <StatusBadge value={device.status} />
          <span className="text-xs text-slate-500">{device.location || 'No location set'}</span>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 text-sm">
        <div className="panel p-4">
          <div className="text-xs text-slate-500 mb-1">Device type</div>
          <div className="text-slate-200">{device.device_type || '—'}</div>
        </div>
        <div className="panel p-4">
          <div className="text-xs text-slate-500 mb-1">API key</div>
          <div className="text-slate-200 font-mono text-xs break-all">{device.api_key}</div>
        </div>
        <div className="panel p-4">
          <div className="text-xs text-slate-500 mb-1">Registered</div>
          <div className="text-slate-200">{new Date(device.created_at).toLocaleDateString()}</div>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-medium text-slate-400 mb-3">Sensors ({sensors.length})</h2>
        {sensors.length === 0 ? (
          <EmptyState title="No sensors configured" message="Add sensors to this device from the Sensors page." />
        ) : (
          <div className="grid lg:grid-cols-2 gap-4">
            {sensors.map((s) => (
              <div key={s.id} className="panel p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm text-slate-200">{s.sensor_name}</h3>
                    <span className="text-xs text-slate-500 font-mono">{s.sensor_type} · {s.unit}</span>
                  </div>
                </div>
                <SensorLineChart data={readings[s.sensor_type]} sensorType={s.sensor_type} unit={s.unit} height={200} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
