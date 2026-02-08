/**
 * Production-safe logging service
 * Replaces console.* calls with environment-aware logging
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  level: LogLevel
  message: string
  data?: unknown
  timestamp: string
  context?: string
}

const isDevelopment = process.env.NODE_ENV === 'development'

const formatLogEntry = (entry: LogEntry): string => {
  const prefix = entry.context ? `[${entry.context}]` : ''
  return `${entry.timestamp} ${entry.level.toUpperCase()} ${prefix} ${entry.message}`
}

const shouldLog = (level: LogLevel): boolean => {
  if (isDevelopment) return true
  // In production, only log warnings and errors
  return level === 'warn' || level === 'error'
}

const createLogEntry = (level: LogLevel, message: string, data?: unknown, context?: string): LogEntry => ({
  level,
  message,
  data,
  context,
  timestamp: new Date().toISOString()
})

export const logger = {
  debug: (message: string, data?: unknown, context?: string): void => {
    const entry = createLogEntry('debug', message, data, context)
    if (shouldLog('debug')) {
      // eslint-disable-next-line no-console
      console.debug(formatLogEntry(entry), data ?? '')
    }
  },

  info: (message: string, data?: unknown, context?: string): void => {
    const entry = createLogEntry('info', message, data, context)
    if (shouldLog('info')) {
      // eslint-disable-next-line no-console
      console.info(formatLogEntry(entry), data ?? '')
    }
  },

  warn: (message: string, data?: unknown, context?: string): void => {
    const entry = createLogEntry('warn', message, data, context)
    if (shouldLog('warn')) {
      // eslint-disable-next-line no-console
      console.warn(formatLogEntry(entry), data ?? '')
    }
  },

  error: (message: string, error?: unknown, context?: string): void => {
    const entry = createLogEntry('error', message, error, context)
    if (shouldLog('error')) {
      // eslint-disable-next-line no-console
      console.error(formatLogEntry(entry), error ?? '')
    }
    // TODO: Send to error tracking service (Sentry, etc.) in production
  }
}

export default logger
