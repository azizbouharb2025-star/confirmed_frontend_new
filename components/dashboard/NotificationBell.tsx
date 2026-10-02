'use client'

import { useEffect, useRef, useState } from 'react'
import {
  BellIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  ShoppingBagIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import api from '@/lib/api'
import { useWebSocketContext } from '@/components/providers/WebSocketProvider'
import { useTheme } from '@/hooks/useTheme'

interface AppNotification {
  _id: string
  type:
    | 'order_new'
    | 'order_status'
    | 'order_deleted'
    | 'integration'
    | 'system'
  title: string
  message: string
  orderId?: string | null
  orderStatus?: string | null
  isRead: boolean
  createdAt: string
}

interface NotificationsResponse {
  notifications: AppNotification[]
  unreadCount: number
}

export default function NotificationBell() {
  const { socket } = useWebSocketContext()
  const { theme } = useTheme()

  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] =
    useState<AppNotification[]>([])
  const [unreadCount, setUnreadCount] =
    useState(0)
  const [loading, setLoading] =
    useState(true)
  const [error, setError] =
    useState<string | null>(null)

  const containerRef =
    useRef<HTMLDivElement>(null)

  const isDark = theme === 'dark'

  const loadNotifications = async () => {
    try {
      setError(null)

      const response =
        await api.get(
          '/api/notifications?limit=20'
        )

      const data =
        response.data as NotificationsResponse

      setNotifications(
        Array.isArray(data.notifications)
          ? data.notifications
          : []
      )

      setUnreadCount(
        Number(data.unreadCount) || 0
      )
    } catch (err) {
      console.error(
        'Failed to load notifications:',
        err
      )

      setError(
        'Impossible de charger les notifications.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadNotifications()
  }, [])

  useEffect(() => {
    if (!socket) return

    const handleNewNotification = (
      incoming: AppNotification
    ) => {
      if (!incoming?._id) return

      setNotifications(prev => {
        if (
          prev.some(
            item => item._id === incoming._id
          )
        ) {
          return prev
        }

        return [
          {
            ...incoming,
            isRead: false
          },
          ...prev
        ].slice(0, 20)
      })

      setUnreadCount(prev => prev + 1)
    }

    socket.on(
      'notification:new',
      handleNewNotification
    )

    return () => {
      socket.off(
        'notification:new',
        handleNewNotification
      )
    }
  }, [socket])

  useEffect(() => {
    if (!open) return

    const handleClickOutside = (
      event: MouseEvent
    ) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(
          event.target as Node
        )
      ) {
        setOpen(false)
      }
    }

    const handleEscape = (
      event: KeyboardEvent
    ) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener(
      'mousedown',
      handleClickOutside
    )

    document.addEventListener(
      'keydown',
      handleEscape
    )

    return () => {
      document.removeEventListener(
        'mousedown',
        handleClickOutside
      )

      document.removeEventListener(
        'keydown',
        handleEscape
      )
    }
  }, [open])

  const markAsRead = async (
    notification: AppNotification
  ) => {
    if (notification.isRead) return

    try {
      await api.patch(
        `/api/notifications/${notification._id}/read`,
        {}
      )

      setNotifications(prev =>
        prev.map(item =>
          item._id === notification._id
            ? {
                ...item,
                isRead: true
              }
            : item
        )
      )

      setUnreadCount(prev =>
        Math.max(0, prev - 1)
      )
    } catch (err) {
      console.error(
        'Failed to mark notification as read:',
        err
      )
    }
  }

  const markAllAsRead = async () => {
    if (unreadCount === 0) return

    try {
      await api.patch(
        '/api/notifications/read-all',
        {}
      )

      setNotifications(prev =>
        prev.map(item => ({
          ...item,
          isRead: true
        }))
      )

      setUnreadCount(0)
    } catch (err) {
      console.error(
        'Failed to mark all notifications as read:',
        err
      )
    }
  }

  const formatTime = (
    value: string
  ) => {
    const date = new Date(value)
    const now = new Date()

    const seconds =
      Math.floor(
        (now.getTime() - date.getTime()) /
          1000
      )

    if (seconds < 60) {
      return "À l'instant"
    }

    const minutes =
      Math.floor(seconds / 60)

    if (minutes < 60) {
      return `Il y a ${minutes} min`
    }

    const hours =
      Math.floor(minutes / 60)

    if (hours < 24) {
      return `Il y a ${hours} h`
    }

    const days =
      Math.floor(hours / 24)

    if (days < 7) {
      return `Il y a ${days} j`
    }

    return date.toLocaleDateString(
      'fr-FR',
      {
        day: '2-digit',
        month: 'short'
      }
    )
  }

  const getIcon = (
    type: AppNotification['type']
  ) => {
    if (type === 'order_new') {
      return (
        <ShoppingBagIcon className="h-5 w-5 text-blue-500" />
      )
    }

    if (type === 'order_status') {
      return (
        <CheckCircleIcon className="h-5 w-5 text-[#ADFF2F]" />
      )
    }

    if (type === 'order_deleted') {
      return (
        <TrashIcon className="h-5 w-5 text-red-500" />
      )
    }

    return (
      <InformationCircleIcon className="h-5 w-5 text-cyan-500" />
    )
  }

  return (
    <div
      ref={containerRef}
      className="relative"
    >
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        className={`relative rounded-lg p-2 transition-colors ${
          isDark
            ? 'hover:bg-slate-800'
            : 'hover:bg-gray-100'
        }`}
        aria-label="Notifications"
        aria-expanded={open}
      >
        <BellIcon className="h-5 w-5" />

        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#ADFF2F] px-1 text-[10px] font-bold leading-none text-slate-950 shadow-sm">
            {unreadCount > 99
              ? '99+'
              : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className={`absolute right-0 z-50 mt-2 w-[380px] max-w-[calc(100vw-1rem)] overflow-hidden rounded-2xl border shadow-2xl ${
            isDark
              ? 'border-slate-700 bg-slate-900'
              : 'border-gray-200 bg-white'
          }`}
        >
          <div
            className={`flex items-center justify-between border-b px-4 py-4 ${
              isDark
                ? 'border-slate-700'
                : 'border-gray-200'
            }`}
          >
            <div>
              <h3
                className={`text-sm font-bold ${
                  isDark
                    ? 'text-white'
                    : 'text-gray-900'
                }`}
              >
                Notifications
              </h3>

              <p
                className={`mt-0.5 text-xs ${
                  isDark
                    ? 'text-slate-400'
                    : 'text-gray-500'
                }`}
              >
                {unreadCount > 0
                  ? `${unreadCount} non lue${
                      unreadCount > 1
                        ? 's'
                        : ''
                    }`
                  : 'Aucune notification non lue'}
              </p>
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() =>
                  void markAllAsRead()
                }
                className="text-xs font-semibold text-[#ADFF2F] transition-opacity hover:opacity-75"
              >
                Tout marquer comme lu
              </button>
            )}
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {loading ? (
              <div
                className={`px-5 py-10 text-center text-sm ${
                  isDark
                    ? 'text-slate-400'
                    : 'text-gray-500'
                }`}
              >
                Chargement…
              </div>
            ) : error ? (
              <div className="px-5 py-8 text-center">
                <p className="text-sm text-red-500">
                  {error}
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setLoading(true)
                    void loadNotifications()
                  }}
                  className="mt-3 text-xs font-semibold text-blue-500"
                >
                  Réessayer
                </button>
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <div
                  className={`mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full ${
                    isDark
                      ? 'bg-slate-800'
                      : 'bg-gray-100'
                  }`}
                >
                  <BellIcon
                    className={`h-5 w-5 ${
                      isDark
                        ? 'text-slate-500'
                        : 'text-gray-400'
                    }`}
                  />
                </div>

                <p
                  className={`text-sm font-medium ${
                    isDark
                      ? 'text-slate-300'
                      : 'text-gray-700'
                  }`}
                >
                  Aucune notification
                </p>

                <p
                  className={`mt-1 text-xs ${
                    isDark
                      ? 'text-slate-500'
                      : 'text-gray-500'
                  }`}
                >
                  Les nouvelles activités apparaîtront ici.
                </p>
              </div>
            ) : (
              notifications.map(
                notification => (
                  <button
                    key={notification._id}
                    type="button"
                    onClick={() =>
                      void markAsRead(
                        notification
                      )
                    }
                    className={`relative flex w-full items-start gap-3 border-b px-4 py-4 text-left transition-colors last:border-b-0 ${
                      isDark
                        ? 'border-slate-800 hover:bg-slate-800/80'
                        : 'border-gray-100 hover:bg-gray-50'
                    } ${
                      !notification.isRead
                        ? isDark
                          ? 'bg-[#ADFF2F]/[0.04]'
                          : 'bg-lime-50/60'
                        : ''
                    }`}
                  >
                    {!notification.isRead && (
                      <span className="absolute left-1.5 top-5 h-2 w-2 rounded-full bg-[#ADFF2F]" />
                    )}

                    <div
                      className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                        isDark
                          ? 'bg-slate-800'
                          : 'bg-gray-100'
                      }`}
                    >
                      {getIcon(
                        notification.type
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <p
                          className={`truncate text-sm ${
                            notification.isRead
                              ? 'font-medium'
                              : 'font-bold'
                          } ${
                            isDark
                              ? 'text-white'
                              : 'text-gray-900'
                          }`}
                        >
                          {
                            notification.title
                          }
                        </p>

                        <span
                          className={`shrink-0 text-[11px] ${
                            isDark
                              ? 'text-slate-500'
                              : 'text-gray-400'
                          }`}
                        >
                          {formatTime(
                            notification.createdAt
                          )}
                        </span>
                      </div>

                      <p
                        className={`mt-1 line-clamp-2 text-xs leading-5 ${
                          isDark
                            ? 'text-slate-400'
                            : 'text-gray-600'
                        }`}
                      >
                        {
                          notification.message
                        }
                      </p>
                    </div>
                  </button>
                )
              )
            )}
          </div>
        </div>
      )}
    </div>
  )
}
