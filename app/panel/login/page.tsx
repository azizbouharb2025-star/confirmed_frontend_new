'use client'

import { useState } from 'react'
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
  const [formData, setFormData] = useState({ email: '', password: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      const data = await response.json()
      
      if (response.ok) {
        login(data.user, data.token)
        const routes = { admin: '/panel/admin', operator: '/panel/op', shop_owner: '/panel/client' }
        window.location.href = routes[data.user.role as keyof typeof routes] || '/panel/client'
      } else {
        alert(data.error || 'Login failed')
      }
    } catch (error) {
      alert('Login failed. Please check your connection.')
    }
    
    setLoading(false)
  }

  return (
    <AuthCard title={t('auth.welcome')} subtitle={t('auth.signin')}>
      <form onSubmit={handleSubmit} className="space-y-4">
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
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-8 dark:text-slate-400 light:text-gray-400">
            {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
          </button>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" className="rounded" />
            <span>Remember me</span>
          </label>
          <Link href="/panel/forgot-password" className="text-blue-500 hover:text-blue-600">Forgot password?</Link>
        </div>
        
        <Button type="submit" loading={loading} className="w-full">{t('auth.signIn')}</Button>
        
        <div className="text-center text-sm">
          <span className="dark:text-slate-400 light:text-gray-600">Don't have an account? </span>
          <Link href="/panel/register" className="text-blue-500 hover:text-blue-600 font-medium">Sign up</Link>
        </div>
      </form>
    </AuthCard>
  )
}