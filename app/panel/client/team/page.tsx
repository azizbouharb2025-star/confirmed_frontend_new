'use client'

import { UserGroupIcon, UserPlusIcon, EnvelopeIcon, PhoneIcon } from '@heroicons/react/24/outline'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { useLanguage } from '@/hooks/useLanguage'
import { useTheme } from '@/hooks/useTheme'

export default function TeamPage() {
  const { t } = useLanguage()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  // Static team members data
  const teamMembers = [
    {
      id: 1,
      name: 'Ahmed Ben Ali',
      role: 'Manager',
      email: 'ahmed@example.com',
      phone: '+216 12 345 678',
      status: 'active',
      avatar: 'AB'
    },
    {
      id: 2,
      name: 'Fatima Mansouri',
      role: 'Sales Representative',
      email: 'fatima@example.com',
      phone: '+216 98 765 432',
      status: 'active',
      avatar: 'FM'
    },
    {
      id: 3,
      name: 'Mohamed Trabelsi',
      role: 'Customer Support',
      email: 'mohamed@example.com',
      phone: '+216 55 123 456',
      status: 'inactive',
      avatar: 'MT'
    }
  ]

  return (
    <ProtectedRoute allowedRoles={['shop_owner']}>
      <DashboardLayout userRole="shop_owner">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">{t('nav.team')}</h1>
              <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                Manage your team members and their roles
              </p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
              <UserPlusIcon className="w-5 h-5" />
              Add Member
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={`p-6 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-white'} border ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Total Members</p>
                  <p className="text-3xl font-bold mt-1">3</p>
                </div>
                <UserGroupIcon className={`w-12 h-12 ${isDark ? 'text-slate-600' : 'text-gray-400'}`} />
              </div>
            </div>

            <div className={`p-6 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-white'} border ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Active</p>
                  <p className="text-3xl font-bold mt-1 text-green-500">2</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
              </div>
            </div>

            <div className={`p-6 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-white'} border ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Inactive</p>
                  <p className="text-3xl font-bold mt-1 text-gray-500">1</p>
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
              <h2 className="text-lg font-semibold">Team Members</h2>
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
                        {member.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
