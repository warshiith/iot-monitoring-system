import { useEffect, useRef, useState, useCallback } from 'react'

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws/readings'

/**
 * Connects to the live readings WebSocket, tracks connection status, and
 * exposes the most recent messages. Automatically reconnects with backoff.
 */
export function useLiveReadings({ onMessage } = {}) {
  const [status, setStatus] = useState('connecting') // connecting | connected | reconnecting | disconnected
  const [lastMessage, setLastMessage] = useState(null)
  const wsRef = useRef(null)
  const attemptRef = useRef(0)
  const onMessageRef = useRef(onMessage)
  onMessageRef.current = onMessage

  const connect = useCallback(() => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      setStatus('disconnected')
      return
    }
    setStatus(attemptRef.current === 0 ? 'connecting' : 'reconnecting')
    const ws = new WebSocket(WS_URL)
    wsRef.current = ws

    ws.onopen = () => {
      attemptRef.current = 0
      setStatus('connected')
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        setLastMessage(data)
        if (onMessageRef.current) onMessageRef.current(data)
      } catch {
        // ignore malformed messages
      }
    }

    ws.onclose = () => {
      setStatus('reconnecting')
      attemptRef.current += 1
      const delay = Math.min(1000 * 2 ** attemptRef.current, 15000)
      setTimeout(connect, delay)
    }

    ws.onerror = () => {
      ws.close()
    }
  }, [])

  useEffect(() => {
    connect()
    return () => {
      wsRef.current?.close()
      wsRef.current = null
    }
  }, [connect])

  return { status, lastMessage }
}
