'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { EnvelopeIcon, LockClosedIcon, UserIcon, PhoneIcon, GlobeAltIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import AuthCard from '@/components/ui/AuthCard'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import AuthRedirect from '@/components/auth/AuthRedirect'
import { useLanguage } from '@/hooks/useLanguage'
import { useTheme } from '@/hooks/useTheme'
import { api } from '@/lib/api'
import logger from '@/lib/logger'
import toast from 'react-hot-toast'

const COUNTRY_PREFIXES = [
  { code: '+216', label: 'TN', country: 'Tunisia' },
  { code: '+213', label: 'DZ', country: 'Algeria' },
  { code: '+212', label: 'MA', country: 'Morocco' },
  { code: '+20', label: 'EG', country: 'Egypt' },
  { code: '+218', label: 'LY', country: 'Libya' },
  { code: '+33', label: 'FR', country: 'France' },
  { code: '+1', label: 'US', country: 'USA' },
  { code: '+44', label: 'GB', country: 'UK' },
  { code: '+966', label: 'SA', country: 'Saudi Arabia' },
  { code: '+971', label: 'AE', country: 'UAE' },
  { code: '+974', label: 'QA', country: 'Qatar' },
]

const COUNTRY_CODE_MAP: Record<string, string> = {
  TN: '+216', DZ: '+213', MA: '+212', EG: '+20', LY: '+218',
  FR: '+33', US: '+1', GB: '+44', SA: '+966', AE: '+971', QA: '+974',
}

const COUNTRY_NAME_MAP: Record<string, string> = {
  TN: 'Tunisia', DZ: 'Algeria', MA: 'Morocco', EG: 'Egypt', LY: 'Libya',
}

function PhonePrefixInput({
  label,
  prefix,
  onPrefixChange,
  value,
  onChange,
  disabled,
  error,
  ariaLabel,
}: {
  label?: string
  prefix: string
  onPrefixChange: (val: string) => void
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  disabled?: boolean
  error?: string
  ariaLabel?: string
}) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
          {label}
        </label>
      )}
      <div
        className={`flex items-center bg-white/50 dark:bg-slate-800/50 border rounded-xl transition-all duration-300 backdrop-blur-sm shadow-inner focus-within:ring-2 focus-within:ring-[#ADFF2F]/50 focus-within:border-[#ADFF2F]/50 ${
          error
            ? 'border-red-500'
            : 'border-gray-300 dark:border-slate-600/50'
        } ${disabled ? 'opacity-50' : ''}`}
      >
        <div className="flex items-center pl-3 text-gray-500 dark:text-slate-400">
          <PhoneIcon className="w-5 h-5" />
        </div>
        <select
          value={prefix}
          onChange={(e) => onPrefixChange(e.target.value)}
          disabled={disabled}
          aria-label={ariaLabel || 'Country code'}
          className="bg-transparent border-none outline-none text-sm font-medium text-gray-700 dark:text-slate-200 pl-2 pr-1 py-3 cursor-pointer appearance-none"
          style={{ backgroundImage: 'none' }}
        >
          {COUNTRY_PREFIXES.map((p) => (
            <option key={p.code} value={p.code}>
              {p.label} {p.code}
            </option>
          ))}
        </select>
        <div className="w-px h-6 bg-gray-300 dark:bg-slate-600/50 mx-1 flex-shrink-0" />
        <input
          type="tel"
          placeholder="12 345 678"
          value={value}
          onChange={onChange}
          disabled={disabled}
          className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 py-3 pr-4 pl-2 text-sm"
        />
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}

export default function RegisterPage() {
  const { t } = useLanguage()
  const [loading, setLoading] = useState(false)
  const { theme } = useTheme()
  const [step, setStep] = useState(1)
  const [errors, setErrors] = useState<{[key: string]: string}>({})
  const [phonePrefix, setPhonePrefix] = useState('+216')
  const [whatsappPrefix, setWhatsappPrefix] = useState('+216')
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    whatsappNumber: '',
    isWhatsappLinked: true,
    country: 'Tunisia',
    role: 'shop_owner'
  })

  useEffect(() => {
    if (formData.isWhatsappLinked) {
      setFormData(prev => ({ ...prev, whatsappNumber: prev.phoneNumber }))
      setWhatsappPrefix(phonePrefix)
    }
  }, [formData.phoneNumber, formData.isWhatsappLinked, phonePrefix])

  useEffect(() => {
    const detectCountry = async () => {
      try {
        const res = await fetch('https://ipapi.co/json/')
        if (!res.ok) return
        const data = await res.json()
        const cc = data.country_code?.toUpperCase()
        if (cc && COUNTRY_CODE_MAP[cc]) {
          setPhonePrefix(COUNTRY_CODE_MAP[cc])
          setWhatsappPrefix(COUNTRY_CODE_MAP[cc])
        }
        if (cc && COUNTRY_NAME_MAP[cc]) {
          setFormData(prev => ({ ...prev, country: COUNTRY_NAME_MAP[cc] }))
        }
      } catch {
        // silently fallback to default (+216 Tunisia)
      }
    }
    detectCountry()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    
    const newErrors: {[key: string]: string} = {}
    const fullPhone = `${phonePrefix}${formData.phoneNumber}`
    const fullWhatsapp = formData.isWhatsappLinked ? fullPhone : `${whatsappPrefix}${formData.whatsappNumber}`
    
    if (!validatePhone(fullPhone)) newErrors.phoneNumber = t('auth.invalidPhone')
    if (!formData.isWhatsappLinked && !validatePhone(fullWhatsapp)) newErrors.whatsappNumber = t('auth.invalidWhatsapp')
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    
    setLoading(true)
    
    try {
      const fullPhone = `${phonePrefix}${formData.phoneNumber.trim()}`
      const fullWhatsapp = formData.isWhatsappLinked ? fullPhone : `${whatsappPrefix}${formData.whatsappNumber.trim()}`

      const response = await api.auth.register({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        phoneNumber: fullPhone,
        whatsappNumber: fullWhatsapp,
        isWhatsappLinked: formData.isWhatsappLinked,
        country: formData.country,
        role: formData.role
      })
      
      if (response.error) {
        const errorMsg: string = response.error
        const match = errorMsg.match(/Missing required fields:\s*(.+)/i)
        if (match) {
          const fields = match[1].split(',').map((f: string) => f.trim())
          const fieldErrors: {[key: string]: string} = {}
          const fieldLabels: Record<string, string> = {
            email: t('auth.email'),
            password: t('auth.password'),
            firstName: t('auth.firstName'),
            lastName: t('auth.lastName'),
            phoneNumber: t('auth.phoneNumber'),
            whatsappNumber: t('auth.whatsappNumber'),
            country: t('auth.country'),
            role: 'Role',
            isWhatsappLinked: 'WhatsApp linked',
          }
          fields.forEach((field: string) => {
            fieldErrors[field] = `${fieldLabels[field] || field} is required`
          })
          setErrors(fieldErrors)
          // Jump to the earliest step that has an error
          if (fields.some((f: string) => ['firstName', 'lastName', 'email'].includes(f))) {
            setStep(1)
          } else if (fields.some((f: string) => ['password'].includes(f))) {
            setStep(2)
          } else {
            setStep(3)
          }
          toast.error('Please fix the highlighted fields')
        } else {
          toast.error(errorMsg)
        }
      } else if (response.token) {
        toast.success('Registration successful! Please login.')
        window.location.href = '/panel/login'
      } else {
        toast.error('Registration failed. Please try again.')
      }
    } catch (error) {
      logger.error('Registration error:', error, 'Auth')
      toast.error('Registration failed. Please try again.')
    }
    
    setLoading(false)
  }

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const validatePhone = (phone: string) => {
    return /^\+?[0-9]{8,15}$/.test(phone.replace(/\s/g, ''))
  }

  const validatePassword = (password: string) => {
    return password.length >= 8
  }

  const nextStep = () => {
    setErrors({})
    if (step === 1) {
      const newErrors: {[key: string]: string} = {}
      if (!formData.firstName.trim()) newErrors.firstName = t('auth.firstNameRequired')
      if (!formData.lastName.trim()) newErrors.lastName = t('auth.lastNameRequired')
      if (!validateEmail(formData.email)) newErrors.email = t('auth.invalidEmail')
      
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors)
        return
      }
      setStep(2)
    } else if (step === 2) {
      const newErrors: {[key: string]: string} = {}
      if (!validatePassword(formData.password)) newErrors.password = t('auth.passwordTooShort')
      if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = t('auth.passwordMismatch')
      
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors)
        return
      }
      setStep(3)
    }
  }

  const prevStep = () => setStep(step - 1)

  return (
    <AuthRedirect redirectIfAuth={true}>
      <AuthCard 
        title={t('auth.signup')} 
        subtitle={t('hero.description')}
      >
      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: step >= s ? 1 : 0.8 }}
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${
                step >= s
                  ? 'bg-gradient-to-r from-[#ADFF2F] to-[#32CD32] text-black shadow-lg'
                  : theme === 'dark'
                  ? 'bg-slate-700 text-slate-400'
                  : 'bg-gray-200 text-gray-400'
              }`}
            >
              {step > s ? <CheckCircleIcon className="w-6 h-6" /> : s}
            </motion.div>
            {s < 3 && (
              <div className={`w-16 h-1 mx-2 rounded transition-all duration-300 ${
                step > s
                  ? 'bg-gradient-to-r from-[#ADFF2F] to-[#32CD32]'
                  : theme === 'dark'
                  ? 'bg-slate-700'
                  : 'bg-gray-200'
              }`} />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Personal Info */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Input
                  label={t('auth.firstName')}
                  type="text"
                  placeholder={t('auth.firstName')}
                  icon={<UserIcon className="w-5 h-5" />}
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                />
                {errors.firstName && <p className="text-sm text-red-500 mt-1">{errors.firstName}</p>}
              </div>
              <div>
                <Input
                  label={t('auth.lastName')}
                  type="text"
                  placeholder={t('auth.lastName')}
                  icon={<UserIcon className="w-5 h-5" />}
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                />
                {errors.lastName && <p className="text-sm text-red-500 mt-1">{errors.lastName}</p>}
              </div>
            </div>
            
            <div>
              <Input
                label={t('auth.email')}
                type="email"
                placeholder="example@email.com"
                icon={<EnvelopeIcon className="w-5 h-5" />}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
              {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
            </div>

            <Button type="button" onClick={nextStep} className="w-full">
              {t('auth.continue')}
            </Button>
          </motion.div>
        )}

        {/* Step 2: Security */}
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div>
              <Input
                label={t('auth.password')}
                type="password"
                placeholder="••••••••"
                icon={<LockClosedIcon className="w-5 h-5" />}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                {t('auth.passwordHint')}
              </p>
              {errors.password && <p className="text-sm text-red-500 mt-1">{errors.password}</p>}
            </div>
            
            <div>
              <Input
                label={t('auth.confirmPassword')}
                type="password"
                placeholder="••••••••"
                icon={<LockClosedIcon className="w-5 h-5" />}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
              />
              {errors.confirmPassword && <p className="text-sm text-red-500 mt-1">{errors.confirmPassword}</p>}
            </div>



            <div className="flex gap-3">
              <Button type="button" onClick={prevStep} className="w-full" variant="secondary">
                {t('auth.back')}
              </Button>
              <Button type="button" onClick={nextStep} className="w-full">
                {t('auth.continue')}
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Contact Info */}
        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <PhonePrefixInput
              label={t('auth.phoneNumber')}
              prefix={phonePrefix}
              onPrefixChange={setPhonePrefix}
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              error={errors.phoneNumber}
              ariaLabel={t('auth.phonePrefix') || 'Phone prefix'}
            />
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-slate-300">
                  {t('auth.whatsappNumber')}
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isWhatsappLinked}
                    onChange={(e) => setFormData({ ...formData, isWhatsappLinked: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 bg-white text-[#ADFF2F] focus:ring-[#ADFF2F]/50 dark:border-slate-600 dark:bg-slate-800"
                  />
                  <span className="ml-2 text-sm text-gray-600 dark:text-slate-400">
                    {t('auth.sameAsPhone')}
                  </span>
                </label>
              </div>
              <PhonePrefixInput
                prefix={whatsappPrefix}
                onPrefixChange={setWhatsappPrefix}
                value={formData.whatsappNumber}
                onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                disabled={formData.isWhatsappLinked}
                error={errors.whatsappNumber}
                ariaLabel={t('auth.whatsappPrefix') || 'WhatsApp prefix'}
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                {t('auth.country')}
              </label>
              <div className="relative">
                <GlobeAltIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
                <select
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-white/50 dark:bg-slate-800/50 border border-gray-300 dark:border-slate-600/50 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#ADFF2F]/50 focus:border-[#ADFF2F]/50 transition-all duration-300 backdrop-blur-sm shadow-inner"
                >
                  <option value="Tunisia">🇹🇳 Tunisia</option>
                  <option value="Algeria">🇩🇿 Algeria</option>
                  <option value="Morocco">🇲🇦 Morocco</option>
                  <option value="Egypt">🇪🇬 Egypt</option>
                  <option value="Libya">🇱🇾 Libya</option>
                </select>
              </div>
              {errors.country && <p className="text-sm text-red-500 mt-1">{errors.country}</p>}
            </div>
        
            <div className="flex items-center p-4 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700">
              <input
                type="checkbox"
                required
                className="w-4 h-4 rounded border-gray-300 bg-white text-[#ADFF2F] focus:ring-[#ADFF2F]/50 dark:border-slate-600 dark:bg-slate-800 flex-shrink-0"
              />
              <span className="ml-3 text-sm text-gray-700 dark:text-slate-300">
                {t('auth.termsAgree')}{' '}
                <Link href="/terms" className="text-[#32CD32] hover:text-[#ADFF2F] font-medium">
                  {t('auth.termsService')}
                </Link>{' '}
                {t('auth.and')}{' '}
                <Link href="/privacy" className="text-[#32CD32] hover:text-[#ADFF2F] font-medium">
                  {t('auth.privacyPolicy')}
                </Link>
              </span>
            </div>

            <div className="flex gap-3">
              <Button type="button" onClick={prevStep} className="w-full" variant="secondary">
                {t('auth.back')}
              </Button>
              <Button
                type="submit"
                loading={loading}
                className="w-full"
              >
                {t('auth.createAccount')}
              </Button>
            </div>
          </motion.div>
        )}
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center"
        >
          <span className="text-gray-600 dark:text-slate-400">{t('auth.alreadyHaveAccount')} </span>
          <Link 
            href="/panel/login"
            className="text-[#32CD32] hover:text-[#ADFF2F] transition-colors font-medium"
          >
            {t('auth.signIn')}
          </Link>
        </motion.div>
      </form>
    </AuthCard>
    </AuthRedirect>
  )
}
