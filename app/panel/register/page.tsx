'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { EnvelopeIcon, LockClosedIcon, UserIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline'
import AuthCard from '@/components/ui/AuthCard'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { useLanguage } from '@/hooks/useLanguage'
import { api } from '@/lib/api'

export default function RegisterPage() {
  const { t } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'shop_owner'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match')
      setLoading(false)
      return
    }
    
    try {
      const response = await api.auth.register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role
      })
      
      if (response.token) {
        alert('Registration successful! Please login.')
        window.location.href = '/panel/login'
      } else {
        alert(response.error || 'Registration failed')
      }
    } catch (error) {
      console.error('Registration error:', error)
      alert('Registration failed. Please try again.')
    }
    
    setLoading(false)
  }

  return (
    <AuthCard 
      title="Create Account" 
      subtitle="Join the future of order management"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Full Name"
          type="text"
          placeholder="Enter your full name"
          icon={<UserIcon className="w-5 h-5" />}
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
        
        <Input
          label="Email"
          type="email"
          placeholder="Enter your email"
          icon={<EnvelopeIcon className="w-5 h-5" />}
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
        
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-300">
            Role
          </label>
          <select
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 backdrop-blur-sm shadow-inner"
          >
            <option value="shop_owner" className="bg-slate-800">Shop Owner</option>
            <option value="operator" className="bg-slate-800">Operator</option>
          </select>
        </div>
        
        <Input
          label="Password"
          type="password"
          placeholder="Create a password"
          icon={<LockClosedIcon className="w-5 h-5" />}
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          required
        />
        
        <Input
          label="Confirm Password"
          type="password"
          placeholder="Confirm your password"
          icon={<LockClosedIcon className="w-5 h-5" />}
          value={formData.confirmPassword}
          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
          required
        />
        
        <div className="flex items-center">
          <input
            type="checkbox"
            required
            className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500/50"
          />
          <span className="ml-2 text-sm text-slate-300">
            I agree to the{' '}
            <Link href="#" className="text-primary-400 hover:text-primary-300">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="#" className="text-primary-400 hover:text-primary-300">
              Privacy Policy
            </Link>
          </span>
        </div>
        
        <Button
          type="submit"
          loading={loading}
          className="w-full"
        >
          Create Account
        </Button>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center"
        >
          <span className="text-slate-400">Already have an account? </span>
          <Link 
            href="/panel/login"
            className="text-primary-400 hover:text-primary-300 transition-colors font-medium"
          >
            Sign in
          </Link>
        </motion.div>
      </form>
    </AuthCard>
  )
}