import React, { useEffect, useState, useCallback } from 'react'
import { listDevices } from '../services/deviceService'
import { latestReadings } from '../services/readingService'
import { useLiveReadings } from '../hooks/useLiveReadings.js'
import ConnectionStatus from '../components/ConnectionStatus.jsx'
import EmptyState from '../components/EmptyState.jsx'
import Skeleton from '../components/Skeleton.jsx'

const SENSOR_LABELS = {
  temperature: 'Temperature',
  humidity: 'Humidity',
  air_quality: 'Air Quality',
  light_intensity: 'Light Intensity',
}

export default function LiveMonitoring() {
  const [devices, setDevices] = useState([])
  const [values, setValues] = useState({}) // key: `${device_id}:${sensor_type}` -> {value, unit, timestamp, flash}
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const [d, latest] = await Promise.all([listDevices(), latestReadings()])
    setDevices(d)
    const map = {}
    latest.forEach((r) => {
      const device = d.find((dev) => dev.id === r.device_id)
      if (!device) return
      map[`${device.device_id}:${r.sensor_type}`] = { value: r.value, unit: r.unit, timestamp: r.timestamp }
    })
    setValues(map)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const { status } = useLiveReadings({
    onMessage: (msg) => {
      if (msg.type !== 'reading') return
      const key = `${msg.device_id}:${msg.sensor_type}`
      setValues((v) => ({ ...v, [key]: { value: msg.value, unit: msg.unit, timestamp: msg.timestamp, flash: true } }))
      setTimeout(() => {
        setValues((v) => (v[key] ? { ...v, [key]: { ...v[key], flash: false } } : v))
      }, 900)
    },
  })

  if (loading) return <Skeleton className="h-96" />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-slate-100">Live Monitoring</h1>
          <p className="text-sm text-slate-500 mt-1">Readings update automatically as devices report.</p>
        </div>
        <ConnectionStatus status={status} />
      </div>

      {devices.length === 0 ? (
        <EmptyState title="No devices yet" message="Register a device to start live monitoring." />
      ) : (
        <div className="space-y-8">
          {devices.map((device) => (
            <div key={device.id}>
              <h2 className="text-sm font-medium text-slate-300 mb-3">
                {device.device_name}
                <span className="text-slate-600 font-mono text-xs ml-2">{device.device_id}</span>
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.keys(SENSOR_LABELS).map((type) => {
                  const entry = values[`${device.device_id}:${type}`]
                  return (
                    <div
                      key={type}
                      className={`panel p-5 transition-colors duration-500 ${entry?.flash ? 'border-signal/60 bg-signal/5' : ''}`}
                    >
                      <div className="text-xs text-slate-500 mb-2">{SENSOR_LABELS[type]}</div>
                      {entry ? (
                        <div className="font-display text-2xl font-semibold data-mono text-slate-100">
                          {entry.value}<span className="text-sm text-slate-500 ml-1 font-body">{entry.unit}</span>
                        </div>
                      ) : (
                        <div className="text-sm text-slate-600">No data</div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
