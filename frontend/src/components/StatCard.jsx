import React from 'react'

export default function StatCard({ label, value, unit, accent = 'text-slate-100', icon }) {
  return (
    <div className="panel p-5 flex items-start justify-between">
      <div>
        <div className="text-xs text-slate-500 mb-2">{label}</div>
        <div className={`font-display text-2xl font-semibold data-mono ${accent}`}>
          {value}
          {unit && <span className="text-sm text-slate-500 ml-1 font-body">{unit}</span>}
        </div>
      </div>
      {icon && <div className="text-slate-600">{icon}</div>}
    </div>
  )
}
