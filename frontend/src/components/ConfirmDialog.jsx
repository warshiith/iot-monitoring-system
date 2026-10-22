import React from 'react'

export default function ConfirmDialog({ open, title, message, onConfirm, onCancel, danger }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="panel w-full max-w-sm p-6">
        <h3 className="font-display font-semibold text-slate-100 text-lg mb-2">{title}</h3>
        <p className="text-sm text-slate-400 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 text-sm rounded-lg text-slate-300 hover:bg-graphite-800 transition-colors">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
              danger ? 'bg-alert-high text-graphite-950 hover:bg-alert-high/90' : 'bg-signal text-graphite-950 hover:bg-signal-dim'
            }`}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}
