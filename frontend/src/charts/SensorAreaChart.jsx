import React from 'react'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { SENSOR_COLORS } from './SensorLineChart.jsx'

function formatTime(ts) {
  const d = new Date(ts)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function SensorAreaChart({ data, sensorType, unit, height = 220 }) {
  const color = SENSOR_COLORS[sensorType] || '#3DDC97'
  const gradientId = `grad-${sensorType}`

  if (!data || data.length === 0) {
    return (
      <div style={{ height }} className="flex items-center justify-center text-sm text-slate-500">
        No data yet.
      </div>
    )
  }

  const chartData = data.map((d) => ({ ...d, time: formatTime(d.timestamp) }))

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.35} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#243040" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="time" stroke="#4A5D75" fontSize={11} tickLine={false} axisLine={false} minTickGap={30} />
        <YAxis stroke="#4A5D75" fontSize={11} tickLine={false} axisLine={false} width={44} />
        <Tooltip
          contentStyle={{ background: '#141C25', border: '1px solid #243040', borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: '#94A3B8' }}
          formatter={(value) => [`${value} ${unit || ''}`, sensorType]}
        />
        <Area type="monotone" dataKey="value" stroke={color} fill={`url(#${gradientId})`} strokeWidth={2} isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  )
}
