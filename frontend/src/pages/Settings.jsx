import React from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { API_BASE_URL } from '../services/api'

export default function Settings() {
  const { user } = useAuth()

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="font-display text-2xl font-semibold text-slate-100">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Your account and connection details.</p>
      </div>

      <div className="panel p-6 space-y-4">
        <h2 className="text-sm font-medium text-slate-300">Profile</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-xs text-slate-500 mb-1">Name</div>
            <div className="text-slate-200">{user?.name}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-1">Email</div>
            <div className="text-slate-200">{user?.email}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-1">Role</div>
            <div className="text-slate-200 font-mono uppercase text-xs">{user?.role}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-1">Account status</div>
            <div className="text-slate-200">{user?.is_active ? 'Active' : 'Inactive'}</div>
          </div>
        </div>
      </div>

      <div className="panel p-6 space-y-2">
        <h2 className="text-sm font-medium text-slate-300 mb-2">API connection</h2>
        <div className="text-xs text-slate-500">Backend URL</div>
        <div className="text-sm text-slate-300 font-mono">{API_BASE_URL}</div>
        <div className="text-xs text-slate-500 mt-3">API documentation</div>
        <a href={`${API_BASE_URL}/docs`} target="_blank" rel="noreferrer" className="text-sm text-signal hover:text-signal-dim font-mono">
          {API_BASE_URL}/docs →
        </a>
      </div>
    </div>
  )
}
