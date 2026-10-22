import React from 'react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'

const SENSOR_COLORS = {
  temperature: '#FF6B5E',
  humidity: '#5EC2FF',
  air_quality: '#FFB454',
  light_intensity: '#3DDC97',
}

function formatTime(ts) {
  const d = new Date(ts)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function SensorLineChart({ data, sensorType, unit, height = 260 }) {
  const color = SENSOR_COLORS[sensorType] || '#3DDC97'

  if (!data || data.length === 0) {
    return (
      <div style={{ height }} className="flex items-center justify-center text-sm text-slate-500">
        No data for this range yet.
      </div>
    )
  }

  const chartData = data.map((d) => ({ ...d, time: formatTime(d.timestamp) }))

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
        <CartesianGrid stroke="#243040" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="time" stroke="#4A5D75" fontSize={11} tickLine={false} axisLine={false} minTickGap={30} />
        <YAxis stroke="#4A5D75" fontSize={11} tickLine={false} axisLine={false} width={44} unit={unit ? ` ${unit}` : ''} />
        <Tooltip
          contentStyle={{ background: '#141C25', border: '1px solid #243040', borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: '#94A3B8' }}
          formatter={(value) => [`${value} ${unit || ''}`, sensorType]}
        />
        <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}

export { SENSOR_COLORS }
