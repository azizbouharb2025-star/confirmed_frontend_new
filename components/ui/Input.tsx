'use client'

import { forwardRef } from 'react'
import { clsx } from 'clsx'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && <label className="block text-sm font-medium">{label}</label>}
        
        <div className="relative">
          {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 dark:text-slate-400 light:text-gray-400">{icon}</div>}
          
          <input
            ref={ref}
            className={clsx(
              'w-full px-3 py-2 rounded-lg border transition-colors',
              'dark:bg-slate-900 dark:border-slate-700 dark:text-white dark:placeholder-slate-400',
              'light:bg-white light:border-gray-300 light:text-gray-900 light:placeholder-gray-400',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
              icon && 'pl-10',
              error && 'border-red-500 focus:ring-red-500',
              className
            )}
            {...props}
          />
        </div>
        
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input