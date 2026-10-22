import React from 'react'

const STYLES = {
  ONLINE: 'bg-signal/10 text-signal border-signal/30',
  OFFLINE: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
  WARNING: 'bg-alert-medium/10 text-alert-medium border-alert-medium/30',
  HIGH: 'bg-alert-high/10 text-alert-high border-alert-high/30',
  MEDIUM: 'bg-alert-medium/10 text-alert-medium border-alert-medium/30',
  LOW: 'bg-alert-low/10 text-alert-low border-alert-low/30',
}

export default function StatusBadge({ value }) {
  const style = STYLES[value] || 'bg-slate-500/10 text-slate-400 border-slate-500/30'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-mono font-medium ${style}`}>
      {value}
    </span>
  )
}
