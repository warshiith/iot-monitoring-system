import React, { useEffect, useState, useCallback } from 'react'
import { listDevices } from '../services/deviceService'
import { listSensors } from '../services/sensorService'
import { readingHistory, readingHistoryStats, exportHistoryCsvUrl } from '../services/readingService'
import SensorAreaChart from '../charts/SensorAreaChart.jsx'
import Skeleton from '../components/Skeleton.jsx'
import EmptyState from '../components/EmptyState.jsx'

const TIME_RANGES = [
  { value: '1h', label: 'Last 1 hour' },
  { value: '6h', label: 'Last 6 hours' },
  { value: '24h', label: 'Last 24 hours' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
]

export default function HistoricalData() {
  const [devices, setDevices] = useState([])
  const [sensors, setSensors] = useState([])
  const [deviceId, setDeviceId] = useState('')
  const [sensorType, setSensorType] = useState('')
  const [timeRange, setTimeRange] = useState('24h')
  const [data, setData] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listDevices().then((d) => {
      setDevices(d)
      if (d.length) setDeviceId(d[0].id)
    })
  }, [])

  useEffect(() => {
    if (!deviceId) return
    listSensors(deviceId).then((s) => {
      setSensors(s)
      if (s.length) setSensorType(s[0].sensor_type)
      else setSensorType('')
    })
  }, [deviceId])

  const loadData = useCallback(async () => {
    if (!deviceId || !sensorType) {
      setData([])
      setStats(null)
      setLoading(false)
      return
    }
    setLoading(true)
    const params = { device_id: deviceId, sensor_type: sensorType, time_range: timeRange }
    const [history, statsData] = await Promise.all([
      readingHistory(params),
      readingHistoryStats(params),
    ])
    setData(history)
    setStats(statsData)
    setLoading(false)
  }, [deviceId, sensorType, timeRange])

  useEffect(() => { loadData() }, [loadData])

  const currentSensor = sensors.find((s) => s.sensor_type === sensorType)
  const currentDevice = devices.find((d) => d.id === deviceId)

  const handleExport = () => {
    if (!deviceId || !sensorType) return
    const url = exportHistoryCsvUrl({ device_id: deviceId, sensor_type: sensorType, time_range: timeRange })
    const token = localStorage.getItem('access_token')
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.blob())
      .then((blob) => {
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `readings_${sensorType}_${timeRange}.csv`
        link.click()
      })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-slate-100">Historical Data</h1>
        <p className="text-sm text-slate-500 mt-1">Explore trends and export sensor history.</p>
      </div>

      <div className="panel p-5 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Device</label>
          <select value={deviceId} onChange={(e) => setDeviceId(e.target.value)}
            className="bg-graphite-800 border border-graphite-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-signal/50 min-w-[180px]">
            {devices.map((d) => <option key={d.id} value={d.id}>{d.device_name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Sensor</label>
          <select value={sensorType} onChange={(e) => setSensorType(e.target.value)}
            className="bg-graphite-800 border border-graphite-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-signal/50 min-w-[160px]">
            {sensors.map((s) => <option key={s.id} value={s.sensor_type}>{s.sensor_name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Time range</label>
          <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}
            className="bg-graphite-800 border border-graphite-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-signal/50 min-w-[160px]">
            {TIME_RANGES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>
        <button
          onClick={handleExport}
          disabled={!deviceId || !sensorType}
          className="ml-auto text-sm px-4 py-2 rounded-lg border border-graphite-700 text-slate-300 hover:bg-graphite-800 transition-colors disabled:opacity-50"
        >
          Export CSV
        </button>
      </div>

      {!deviceId || sensors.length === 0 ? (
        <EmptyState title="No sensor data available" message="Select a device with configured sensors to view history." />
      ) : loading ? (
        <Skeleton className="h-80" />
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatBox label="Minimum" value={stats?.min_value} unit={currentSensor?.unit} />
            <StatBox label="Maximum" value={stats?.max_value} unit={currentSensor?.unit} />
            <StatBox label="Average" value={stats?.avg_value?.toFixed(2)} unit={currentSensor?.unit} />
            <StatBox label="Data points" value={stats?.count} />
          </div>

          <div className="panel p-5">
            <h2 className="text-sm font-medium text-slate-400 mb-4">
              {currentSensor?.sensor_name} — {currentDevice?.device_name}
            </h2>
            <SensorAreaChart data={data} sensorType={sensorType} unit={currentSensor?.unit} height={320} />
          </div>
        </>
      )}
    </div>
  )
}

function StatBox({ label, value, unit }) {
  return (
    <div className="panel p-4">
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className="font-display text-lg font-semibold data-mono text-slate-100">
        {value ?? '—'}{unit && value != null ? <span className="text-xs text-slate-500 ml-1 font-body">{unit}</span> : null}
      </div>
    </div>
  )
}
