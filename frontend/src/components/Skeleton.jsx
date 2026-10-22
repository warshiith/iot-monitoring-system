import React from 'react'

export default function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-graphite-800 rounded-md ${className}`} />
}
