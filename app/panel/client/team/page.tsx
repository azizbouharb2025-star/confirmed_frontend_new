'use client'

import { useState, useEffect } from 'react'
import { UserGroupIcon, UserPlusIcon, EnvelopeIcon, PhoneIcon, XMarkIcon } from '@heroicons/react/24/outline'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { useLanguage } from '@/hooks/useLanguage'
import { useTheme } from '@/hooks/useTheme'

interface TeamMember {
  id: number
  name: string
  role: string
  email: string
  phone: string
  status: 'active' | 'inactive'
  avatar: string
}

export default function TeamPage() {
  const { t } = useLanguage()
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [showModal, setShowModal] = useState(false)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    email: '',
    phone: '',
    status: 'active' as 'active' | 'inactive'
  })

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('teamMembers')
    if (stored) {
      setTeamMembers(JSON.parse(stored))
    } else {
      // Initial data
      const initialData = [
        {
          id: 1,
          name: 'Ahmed Ben Ali',
          role: 'Manager',
          email: 'ahmed@example.com',
          phone: '+216 12 345 678',
          status: 'active' as 'active' | 'inactive',
          avatar: 'AB'
        },
        {
          id: 2,
          name: 'Fatima Mansouri',
          role: 'Sales Representative',
          email: 'fatima@example.com',
          phone: '+216 98 765 432',
          status: 'active' as 'active' | 'inactive',
          avatar: 'FM'
        },
        {
          id: 3,
          name: 'Mohamed Trabelsi',
          role: 'Customer Support',
          email: 'mohamed@example.com',
          phone: '+216 55 123 456',
          status: 'inactive' as 'active' | 'inactive',
          avatar: 'MT'
        }
      ]
      setTeamMembers(initialData)
      localStorage.setItem('teamMembers', JSON.stringify(initialData))
    }
  }, [])

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newMember: TeamMember = {
      id: Date.now(),
      ...formData,
      avatar: getInitials(formData.name)
    }
    const updated = [...teamMembers, newMember]
    setTeamMembers(updated)
    localStorage.setItem('teamMembers', JSON.stringify(updated))
    setShowModal(false)
    setFormData({ name: '', role: '', email: '', phone: '', status: 'active' })
  }

  const activeCount = teamMembers.filter(m => m.status === 'active').length
  const inactiveCount = teamMembers.filter(m => m.status === 'inactive').length

  return (
    <ProtectedRoute allowedRoles={['shop_owner']}>
      <DashboardLayout userRole="shop_owner">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">{t('team.title')}</h1>
              <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                {t('team.subtitle')}
              </p>
            </div>
            <button 
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <UserPlusIcon className="w-5 h-5" />
              {t('team.addMember')}
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={`p-6 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-white'} border ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>{t('team.totalMembers')}</p>
                  <p className="text-3xl font-bold mt-1">{teamMembers.length}</p>
                </div>
                <UserGroupIcon className={`w-12 h-12 ${isDark ? 'text-slate-600' : 'text-gray-400'}`} />
              </div>
            </div>

            <div className={`p-6 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-white'} border ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>{t('team.active')}</p>
                  <p className="text-3xl font-bold mt-1 text-green-500">{activeCount}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
              </div>
            </div>

            <div className={`p-6 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-white'} border ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>{t('team.inactive')}</p>
                  <p className="text-3xl font-bold mt-1 text-gray-500">{inactiveCount}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-gray-500/20 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Team Members List */}
          <div className={`rounded-lg ${isDark ? 'bg-slate-800' : 'bg-white'} border ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
            <div className="p-6 border-b border-slate-700">
              <h2 className="text-lg font-semibold">{t('team.teamMembers')}</h2>
            </div>
            <div className="divide-y divide-slate-700">
              {teamMembers.map((member) => (
                <div key={member.id} className="p-6 hover:bg-slate-700/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                        {member.avatar}
                      </div>
                      <div>
                        <h3 className="font-semibold">{member.name}</h3>
                        <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>{member.role}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <EnvelopeIcon className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-gray-600'}`} />
                        <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>{member.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <PhoneIcon className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-gray-600'}`} />
                        <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>{member.phone}</span>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        member.status === 'active' 
                          ? 'bg-green-500/20 text-green-500' 
                          : 'bg-gray-500/20 text-gray-500'
                      }`}>
                        {member.status === 'active' ? t('team.active') : t('team.inactive')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add Member Modal */}
          {showModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className={`rounded-lg ${isDark ? 'bg-slate-800' : 'bg-white'} max-w-md w-full p-6`}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold">{t('team.addMember')}</h2>
                  <button onClick={() => setShowModal(false)} className={`p-2 rounded-lg ${isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-100'}`}>
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                      {t('team.name')}
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={`w-full px-4 py-2 rounded-lg border ${isDark ? 'bg-slate-700 border-slate-600' : 'bg-white border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                      {t('team.role')}
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className={`w-full px-4 py-2 rounded-lg border ${isDark ? 'bg-slate-700 border-slate-600' : 'bg-white border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                      {t('team.email')}
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={`w-full px-4 py-2 rounded-lg border ${isDark ? 'bg-slate-700 border-slate-600' : 'bg-white border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                      {t('team.phone')}
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className={`w-full px-4 py-2 rounded-lg border ${isDark ? 'bg-slate-700 border-slate-600' : 'bg-white border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                      {t('team.status')}
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                      className={`w-full px-4 py-2 rounded-lg border ${isDark ? 'bg-slate-700 border-slate-600' : 'bg-white border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    >
                      <option value="active">{t('team.active')}</option>
                      <option value="inactive">{t('team.inactive')}</option>
                    </select>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className={`flex-1 px-4 py-2 rounded-lg border ${isDark ? 'border-slate-600 hover:bg-slate-700' : 'border-gray-300 hover:bg-gray-100'} transition-colors`}
                    >
                      {t('common.cancel')}
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      {t('common.save')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
