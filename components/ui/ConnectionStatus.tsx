'use client'

import { useWebSocketContext } from '@/components/providers/WebSocketProvider'

/**
 * ConnectionStatus - shows WebSocket real-time connection state in the navbar.
 *
 * Design decision:
 * - WebSocket is a background real-time feature, NOT the authentication state.
 * - Showing a red "Disconnected" label to a logged-in user is misleading — it
 *   implies the user's session is broken, which is incorrect.
 * - When disconnected: render nothing (null). The user is still authenticated.
 * - When connected: show a small green pulse dot only (no text label).
 *   A label is shown only on hover via the title attribute.
 */
export default function ConnectionStatus() {
  const { isConnected } = useWebSocketContext()

  if (!isConnected) {
    // WebSocket unavailable — hide indicator completely.
    // The user is authenticated; this is a real-time feature status only.
    return null
  }

  return (
    <div
      className="flex items-center gap-1.5"
      title="Real-time updates active"
      aria-label="Real-time updates active"
    >
      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
    </div>
  )
}
