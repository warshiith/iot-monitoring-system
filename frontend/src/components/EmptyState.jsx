import React from 'react'

export default function EmptyState({ title, message, action }) {
  return (
    <div className="panel p-10 text-center">
      <h3 className="font-display text-slate-200 text-base mb-1">{title}</h3>
      <p className="text-sm text-slate-500 mb-4">{message}</p>
      {action}
    </div>
  )
}
