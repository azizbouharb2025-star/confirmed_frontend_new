'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { EnvelopeIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'
import AuthCard from '@/components/ui/AuthCard'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [email, setEmail] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <AuthCard 
        title="Check Your Email" 
        subtitle="We've sent a password reset link"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6"
        >
          <div className="w-16 h-16 mx-auto bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
            <EnvelopeIcon className="w-8 h-8 text-white" />
          </div>
          
          <div>
            <p className="text-slate-300 mb-4">
              We've sent a password reset link to <strong className="text-white">{email}</strong>
            </p>
            <p className="text-sm text-slate-400">
              Didn't receive the email? Check your spam folder or try again.
            </p>
          </div>
          
          <div className="space-y-3">
            <Button
              onClick={() => setSent(false)}
              variant="secondary"
              className="w-full"
            >
              Try Different Email
            </Button>
            
            <Link 
              href="/panel/login"
              className="flex items-center justify-center gap-2 text-primary-400 hover:text-primary-300 transition-colors"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Back to Login
            </Link>
          </div>
        </motion.div>
      </AuthCard>
    )
  }

  return (
    <AuthCard 
      title="Reset Password" 
      subtitle="Enter your email to receive a reset link"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Email"
          type="email"
          placeholder="Enter your email"
          icon={<EnvelopeIcon className="w-5 h-5" />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        
        <Button
          type="submit"
          loading={loading}
          className="w-full"
        >
          Send Reset Link
        </Button>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center"
        >
          <Link 
            href="/panel/login"
            className="flex items-center justify-center gap-2 text-primary-400 hover:text-primary-300 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Login
          </Link>
        </motion.div>
      </form>
    </AuthCard>
  )
}