'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { EnvelopeIcon, LockClosedIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import AuthCard from '@/components/ui/AuthCard'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { useLanguage } from '@/hooks/useLanguage'
import { useAuth } from '@/hooks/useAuth'

export default function LoginPage() {
  const { t } = useLanguage()
  const { login } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      // Call real backend API
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        }),
        mode: 'cors'
      })
      
      const data = await response.json()
      
      if (response.ok) {
        // Login user with real data from backend
        login(data.user, data.token)
        
        // Role-based redirect
        setTimeout(() => {
          switch (data.user.role) {
            case 'admin':
              window.location.href = '/panel/admin'
              break
            case 'operator':
              window.location.href = '/panel/op'
              break
            case 'shop_owner':
              window.location.href = '/panel/client'
              break
            default:
              window.location.href = '/panel/client'
          }
        }, 200)
      } else {
        alert(data.error || 'Login failed')
      }
    } catch (error) {
      console.error('Login error:', error)
      alert('Login failed. Please check your connection.')
    }
    
    setLoading(false)
  }

  return (
    <AuthCard 
      title={t('auth.welcome')} 
      subtitle={t('auth.signin')}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label={t('auth.email')}
          type="email"
          placeholder={t('auth.email')}
          icon={<EnvelopeIcon className="w-5 h-5" />}
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
        
        <div className="relative">
          <Input
            label={t('auth.password')}
            type={showPassword ? 'text' : 'password'}
            placeholder={t('auth.password')}
            icon={<LockClosedIcon className="w-5 h-5" />}
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-9 text-slate-400 hover:text-slate-300 transition-colors"
          >
            {showPassword ? (
              <EyeSlashIcon className="w-5 h-5" />
            ) : (
              <EyeIcon className="w-5 h-5" />
            )}
          </button>
        </div>
        
        <div className="flex items-center justify-between">
          <label className="flex items-center">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-gray-300 bg-white text-[#ADFF2F] focus:ring-[#ADFF2F]/50 dark:border-slate-600 dark:bg-slate-800"
            />
            <span className="ml-2 text-sm text-gray-700 dark:text-slate-300">{t('auth.rememberMe')}</span>
          </label>
          
          <Link 
            href="/panel/forgot-password"
            className="text-sm text-[#32CD32] hover:text-[#ADFF2F] transition-colors"
          >
            {t('auth.forgotPassword')}
          </Link>
        </div>
        
        <Button
          type="submit"
          loading={loading}
          className="w-full"
        >
          {t('auth.signIn')}
        </Button>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center"
        >
          <span className="text-gray-600 dark:text-slate-400">{t('auth.dontHaveAccount')} </span>
          <Link 
            href="/panel/register"
            className="text-[#32CD32] hover:text-[#ADFF2F] transition-colors font-medium"
          >
            {t('auth.signup')}
          </Link>
        </motion.div>
      </form>
    </AuthCard>
  )
}