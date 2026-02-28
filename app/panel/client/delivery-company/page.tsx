'use client'

import { TruckIcon, MapPinIcon, PhoneIcon, ClockIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { useLanguage } from '@/hooks/useLanguage'
import { useTheme } from '@/hooks/useTheme'

export default function DeliveryCompanyPage() {
  const { t } = useLanguage()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  // Static delivery companies data
  const deliveryCompanies = [
    {
      id: 1,
      name: 'Express Delivery TN',
      logo: 'ED',
      status: 'active',
      coverage: 'National',
      avgDeliveryTime: '24-48h',
      phone: '+216 71 123 456',
      email: 'contact@expressdelivery.tn',
      totalDeliveries: 1250,
      successRate: 98.5,
      regions: ['Tunis', 'Sfax', 'Sousse', 'Nabeul']
    },
    {
      id: 2,
      name: 'Fast Courier',
      logo: 'FC',
      status: 'active',
      coverage: 'Regional',
      avgDeliveryTime: '48-72h',
      phone: '+216 73 456 789',
      email: 'info@fastcourier.tn',
      totalDeliveries: 850,
      successRate: 96.2,
      regions: ['Tunis', 'Ariana', 'Ben Arous']
    },
    {
      id: 3,
      name: 'Quick Transport',
      logo: 'QT',
      status: 'inactive',
      coverage: 'National',
      avgDeliveryTime: '72h',
      phone: '+216 75 987 654',
      email: 'support@quicktransport.tn',
      totalDeliveries: 420,
      successRate: 94.8,
      regions: ['Sfax', 'Gabès', 'Médenine']
    }
  ]

  return (
    <ProtectedRoute allowedRoles={['shop_owner']}>
      <DashboardLayout userRole="shop_owner">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">{t('nav.deliveryCompany')}</h1>
              <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                Manage your delivery partners and logistics
              </p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
              <TruckIcon className="w-5 h-5" />
              Add Partner
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className={`p-6 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-white'} border ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Total Partners</p>
                  <p className="text-3xl font-bold mt-1">3</p>
                </div>
                <TruckIcon className={`w-12 h-12 ${isDark ? 'text-slate-600' : 'text-gray-400'}`} />
              </div>
            </div>

            <div className={`p-6 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-white'} border ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Active</p>
                  <p className="text-3xl font-bold mt-1 text-green-500">2</p>
                </div>
                <CheckCircleIcon className="w-12 h-12 text-green-500" />
              </div>
            </div>

            <div className={`p-6 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-white'} border ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Total Deliveries</p>
                  <p className="text-3xl font-bold mt-1">2,520</p>
                </div>
                <div className={`w-12 h-12 rounded-full ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'} flex items-center justify-center`}>
                  <span className="text-blue-500 font-bold">📦</span>
                </div>
              </div>
            </div>

            <div className={`p-6 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-white'} border ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Avg Success Rate</p>
                  <p className="text-3xl font-bold mt-1 text-green-500">96.5%</p>
                </div>
                <div className={`w-12 h-12 rounded-full ${isDark ? 'bg-green-500/20' : 'bg-green-100'} flex items-center justify-center`}>
                  <span className="text-green-500 font-bold">✓</span>
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Companies List */}
          <div className="space-y-4">
            {deliveryCompanies.map((company) => (
              <div key={company.id} className={`rounded-lg ${isDark ? 'bg-slate-800' : 'bg-white'} border ${isDark ? 'border-slate-700' : 'border-gray-200'} p-6`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-lg bg-blue-500 flex items-center justify-center text-white font-bold text-xl">
                      {company.logo}
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-semibold">{company.name}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          company.status === 'active' 
                            ? 'bg-green-500/20 text-green-500' 
                            : 'bg-gray-500/20 text-gray-500'
                        }`}>
                          {company.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1">
                          <PhoneIcon className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-gray-600'}`} />
                          <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>{company.phone}</span>
                        </div>
                        <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>{company.email}</span>
                      </div>
                    </div>
                  </div>
                  <button className={`px-4 py-2 rounded-lg border ${isDark ? 'border-slate-700 hover:bg-slate-700' : 'border-gray-300 hover:bg-gray-100'} transition-colors`}>
                    View Details
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  <div className={`p-4 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <MapPinIcon className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-gray-600'}`} />
                      <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Coverage</span>
                    </div>
                    <p className="font-semibold">{company.coverage}</p>
                  </div>

                  <div className={`p-4 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <ClockIcon className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-gray-600'}`} />
                      <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Avg Delivery</span>
                    </div>
                    <p className="font-semibold">{company.avgDeliveryTime}</p>
                  </div>

                  <div className={`p-4 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <TruckIcon className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-gray-600'}`} />
                      <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Deliveries</span>
                    </div>
                    <p className="font-semibold">{company.totalDeliveries.toLocaleString()}</p>
                  </div>

                  <div className={`p-4 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircleIcon className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-gray-600'}`} />
                      <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Success Rate</span>
                    </div>
                    <p className="font-semibold text-green-500">{company.successRate}%</p>
                  </div>
                </div>

                <div className="mt-4">
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'} mb-2`}>Coverage Regions:</p>
                  <div className="flex flex-wrap gap-2">
                    {company.regions.map((region, index) => (
                      <span key={index} className={`px-3 py-1 rounded-full text-xs ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-700'}`}>
                        {region}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
