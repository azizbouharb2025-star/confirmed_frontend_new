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
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
            {label}
          </label>
        )}
        
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-slate-400">
              {icon}
            </div>
          )}
          
          <input
            ref={ref}
            className={clsx(
              'w-full px-4 py-3 bg-white/50 dark:bg-slate-800/50 border border-gray-300 dark:border-slate-600/50 rounded-xl',
              'text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400',
              'focus:outline-none focus:ring-2 focus:ring-[#ADFF2F]/50 focus:border-[#ADFF2F]/50',
              'transition-all duration-300',
              'backdrop-blur-sm shadow-inner',
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