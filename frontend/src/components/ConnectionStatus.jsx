import React from 'react'

const CONFIG = {
  connected: { label: 'Connected', color: 'text-signal', dot: 'bg-signal' },
  connecting: { label: 'Connecting…', color: 'text-alert-medium', dot: 'bg-alert-medium' },
  reconnecting: { label: 'Reconnecting…', color: 'text-alert-medium', dot: 'bg-alert-medium' },
  disconnected: { label: 'Disconnected', color: 'text-alert-high', dot: 'bg-alert-high' },
}

export default function ConnectionStatus({ status }) {
  const cfg = CONFIG[status] || CONFIG.disconnected
  return (
    <div className="flex items-center gap-2 text-xs font-mono">
      <span className={`pulse-dot ${cfg.dot} ${cfg.color}`} />
      <span className={cfg.color}>{cfg.label}</span>
    </div>
  )
}
