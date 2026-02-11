'use client'

import { useState } from 'react'
import { UserCircleIcon, LockClosedIcon, EnvelopeIcon } from '@heroicons/react/24/outline'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { useAuth } from '@/hooks/useAuth'
import { useLanguage } from '@/hooks/useLanguage'
import { useTheme } from '@/hooks/useTheme'
import api from '@/lib/api'
import toast from 'react-hot-toast'

export default function ProfilePage() {
  const { user, token, login } = useAuth()
  const { t } = useLanguage()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [saving, setSaving] = useState(false)
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [formData, setFormData] = useState({
    firstName: user?.name?.split(' ')[0] || '',
    lastName: user?.name?.split(' ').slice(1).join(' ') || '',
    email: user?.email || '',
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  })

  const userRole = user?.role || 'shop_owner'

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const response = await api.patch('/api/auth/profile', {
        firstName: formData.firstName,
        lastName: formData.lastName,
      })
      if (response.data && token && user) {
        login({ ...user, name: `${formData.firstName} ${formData.lastName}` }, token)
      }
      toast.success(t('profile.profileUpdated'))
    } catch {
      toast.error(t('profile.profileError'))
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      toast.error(t('auth.passwordMismatch'))
      return
    }
    if (passwordData.newPassword.length < 8) {
      toast.error(t('auth.passwordTooShort'))
      return
    }
    setPasswordSaving(true)
    try {
      await api.patch('/api/auth/password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      })
      toast.success(t('profile.passwordUpdated'))
      setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' })
    } catch {
      toast.error(t('profile.passwordError'))
    } finally {
      setPasswordSaving(false)
    }
  }

  const roleLabel = userRole === 'admin' ? 'Admin' : userRole === 'operator' ? 'Operator' : 'Shop Owner'

  return (
    <ProtectedRoute allowedRoles={['admin', 'operator', 'shop_owner']}>
      <DashboardLayout userRole={userRole}>
        <div className="space-y-6 max-w-2xl">
          <div>
            <h1 className="text-2xl font-semibold">{t('profile.title')}</h1>
            <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
              {t('profile.subtitle')}
            </p>
          </div>

          {/* Personal Info */}
          <form onSubmit={handleProfileSave} className="card p-6 space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <UserCircleIcon className="h-5 w-5" />
              {t('profile.personalInfo')}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={t('profile.firstName')}
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                icon={<UserCircleIcon className="w-5 h-5" />}
              />
              <Input
                label={t('profile.lastName')}
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                icon={<UserCircleIcon className="w-5 h-5" />}
              />
            </div>

            <Input
              label={t('profile.email')}
              value={formData.email}
              disabled
              icon={<EnvelopeIcon className="w-5 h-5" />}
            />

            <div className={`p-3 rounded-lg text-sm ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-gray-50 text-gray-600'}`}>
              <span className="font-medium">{t('profile.role')}:</span> {roleLabel}
            </div>

            <div className="flex justify-end">
              <Button type="submit" loading={saving}>
                {saving ? t('common.saving') : t('common.save')}
              </Button>
            </div>
          </form>

          {/* Change Password */}
          <form onSubmit={handlePasswordChange} className="card p-6 space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <LockClosedIcon className="h-5 w-5" />
              {t('profile.changePassword')}
            </h2>

            <Input
              label={t('profile.currentPassword')}
              type="password"
              placeholder="••••••••"
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              icon={<LockClosedIcon className="w-5 h-5" />}
              required
            />
            <Input
              label={t('profile.newPassword')}
              type="password"
              placeholder="••••••••"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              icon={<LockClosedIcon className="w-5 h-5" />}
              required
            />
            <Input
              label={t('profile.confirmNewPassword')}
              type="password"
              placeholder="••••••••"
              value={passwordData.confirmNewPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmNewPassword: e.target.value })}
              icon={<LockClosedIcon className="w-5 h-5" />}
              required
            />

            <div className="flex justify-end">
              <Button type="submit" loading={passwordSaving}>
                {passwordSaving ? t('common.saving') : t('profile.updatePassword')}
              </Button>
            </div>
          </form>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
