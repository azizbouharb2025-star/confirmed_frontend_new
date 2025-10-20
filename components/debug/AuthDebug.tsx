'use client'

import { useAuth } from '@/hooks/useAuth'

export default function AuthDebug() {
  const { user, isAuthenticated, token } = useAuth()

  return (
    <div className="fixed bottom-4 left-4 bg-black/80 text-white p-4 rounded-lg text-xs max-w-sm z-50">
      <h3 className="font-bold mb-2">Auth Debug</h3>
      <div>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</div>
      <div>User: {user ? JSON.stringify(user, null, 2) : 'None'}</div>
      <div>Token: {token ? 'Present' : 'None'}</div>
    </div>
  )
}