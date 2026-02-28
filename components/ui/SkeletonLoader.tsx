'use client'

/**
 * Skeleton Loader Components
 * Provides consistent loading states across the application
 */

interface SkeletonProps {
  className?: string
}

export function SkeletonCard({ className = '' }: SkeletonProps) {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="bg-gray-200 dark:bg-slate-700 rounded-lg p-6 space-y-4">
        <div className="h-4 bg-gray-300 dark:bg-slate-600 rounded w-1/3"></div>
        <div className="h-8 bg-gray-300 dark:bg-slate-600 rounded w-1/2"></div>
        <div className="h-3 bg-gray-300 dark:bg-slate-600 rounded w-2/3"></div>
      </div>
    </div>
  )
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="animate-pulse space-y-3">
      {/* Header */}
      <div className="flex gap-4 p-4 bg-gray-100 dark:bg-slate-800 rounded-lg">
        <div className="h-4 bg-gray-300 dark:bg-slate-600 rounded flex-1"></div>
        <div className="h-4 bg-gray-300 dark:bg-slate-600 rounded flex-1"></div>
        <div className="h-4 bg-gray-300 dark:bg-slate-600 rounded flex-1"></div>
        <div className="h-4 bg-gray-300 dark:bg-slate-600 rounded w-20"></div>
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 p-4 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
          <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded flex-1"></div>
          <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded flex-1"></div>
          <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded flex-1"></div>
          <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-20"></div>
        </div>
      ))}
    </div>
  )
}

export function SkeletonChart() {
  return (
    <div className="animate-pulse">
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-gray-200 dark:border-slate-700">
        <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/4 mb-6"></div>
        <div className="h-64 bg-gray-100 dark:bg-slate-700/50 rounded flex items-end justify-around gap-2 p-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="bg-gray-300 dark:bg-slate-600 rounded-t w-full"
              style={{ height: `${Math.random() * 60 + 40}%` }}
            ></div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function SkeletonMetricCard() {
  return (
    <div className="animate-pulse">
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-gray-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/3"></div>
          <div className="h-10 w-10 bg-gray-200 dark:bg-slate-700 rounded-lg"></div>
        </div>
        <div className="h-8 bg-gray-200 dark:bg-slate-700 rounded w-1/2 mb-2"></div>
        <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-2/3"></div>
      </div>
    </div>
  )
}

export function SkeletonList({ items = 3 }: { items?: number }) {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
          <div className="h-12 w-12 bg-gray-200 dark:bg-slate-700 rounded-full flex-shrink-0"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-1/2"></div>
          </div>
          <div className="h-8 w-20 bg-gray-200 dark:bg-slate-700 rounded"></div>
        </div>
      ))}
    </div>
  )
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="animate-pulse space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-gray-200 dark:bg-slate-700 rounded"
          style={{ width: i === lines - 1 ? '60%' : '100%' }}
        ></div>
      ))}
    </div>
  )
}
