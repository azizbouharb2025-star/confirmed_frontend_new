'use client'

import { useState, useEffect } from 'react'
import { TruckIcon, MapPinIcon, PhoneIcon, ClockIcon, CheckCircleIcon, XMarkIcon } from '@heroicons/react/24/outline'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { useLanguage } from '@/hooks/useLanguage'
import { useTheme } from '@/hooks/useTheme'

interface DeliveryCompany {
  id: number
  name: string
  logo: string
  status: 'active' | 'inactive'
  coverage: 'National' | 'Regional'
  avgDeliveryTime: string
  phone: string
  email: string
  totalDeliveries: number
  successRate: number
  regions: string[]
}

export default function DeliveryCompanyPage() {
  const { t } = useLanguage()
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [showModal, setShowModal] = useState(false)
  const [deliveryCompanies, setDeliveryCompanies] = useState<DeliveryCompany[]>([])
  const [formData, setFormData] = useState({
    name: '',
    coverage: 'National' as 'National' | 'Regional',
    avgDeliveryTime: '',
    phone: '',
    email: '',
    status: 'active' as 'active' | 'inactive',
    regions: ''
  })

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('deliveryCompanies')
    if (stored) {
      setDeliveryCompanies(JSON.parse(stored))
    } else {
      // Initial data
      const initialData = [
        {
          id: 1,
          name: 'Express Delivery TN',
          logo: 'ED',
          status: 'active' as 'active' | 'inactive',
          coverage: 'National' as 'National' | 'Regional',
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
          status: 'active' as 'active' | 'inactive',
          coverage: 'Regional' as 'National' | 'Regional',
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
          status: 'inactive' as 'active' | 'inactive',
          coverage: 'National' as 'National' | 'Regional',
          avgDeliveryTime: '72h',
          phone: '+216 75 987 654',
          email: 'support@quicktransport.tn',
          totalDeliveries: 420,
          successRate: 94.8,
          regions: ['Sfax', 'Gabès', 'Médenine']
        }
      ]
      setDeliveryCompanies(initialData)
      localStorage.setItem('deliveryCompanies', JSON.stringify(initialData))
    }
  }, [])

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newCompany: DeliveryCompany = {
      id: Date.now(),
      name: formData.name,
      logo: getInitials(formData.name),
      status: formData.status,
      coverage: formData.coverage,
      avgDeliveryTime: formData.avgDeliveryTime,
      phone: formData.phone,
      email: formData.email,
      totalDeliveries: 0,
      successRate: 0,
      regions: formData.regions.split(',').map(r => r.trim()).filter(r => r)
    }
    const updated = [...deliveryCompanies, newCompany]
    setDeliveryCompanies(updated)
    localStorage.setItem('deliveryCompanies', JSON.stringify(updated))
    setShowModal(false)
    setFormData({ name: '', coverage: 'National', avgDeliveryTime: '', phone: '', email: '', status: 'active', regions: '' })
  }

  const activeCount = deliveryCompanies.filter(c => c.status === 'active').length
  const totalDeliveries = deliveryCompanies.reduce((sum, c) => sum + c.totalDeliveries, 0)
  const avgSuccessRate = deliveryCompanies.length > 0 
    ? (deliveryCompanies.reduce((sum, c) => sum + c.successRate, 0) / deliveryCompanies.length).toFixed(1)
    : '0'

  return (
    <ProtectedRoute allowedRoles={['shop_owner']}>
      <DashboardLayout userRole="shop_owner">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">{t('delivery.title')}</h1>
              <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                {t('delivery.subtitle')}
              </p>
            </div>
            <button 
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <TruckIcon className="w-5 h-5" />
              {t('delivery.addPartner')}
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className={`p-6 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-white'} border ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>{t('delivery.totalPartners')}</p>
                  <p className="text-3xl font-bold mt-1">{deliveryCompanies.length}</p>
                </div>
                <TruckIcon className={`w-12 h-12 ${isDark ? 'text-slate-600' : 'text-gray-400'}`} />
              </div>
            </div>

            <div className={`p-6 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-white'} border ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>{t('team.active')}</p>
                  <p className="text-3xl font-bold mt-1 text-green-500">{activeCount}</p>
                </div>
                <CheckCircleIcon className="w-12 h-12 text-green-500" />
              </div>
            </div>

            <div className={`p-6 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-white'} border ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>{t('delivery.totalDeliveries')}</p>
                  <p className="text-3xl font-bold mt-1">{totalDeliveries.toLocaleString()}</p>
                </div>
                <div className={`w-12 h-12 rounded-full ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'} flex items-center justify-center`}>
                  <span className="text-blue-500 font-bold">📦</span>
                </div>
              </div>
            </div>

            <div className={`p-6 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-white'} border ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>{t('delivery.avgSuccessRate')}</p>
                  <p className="text-3xl font-bold mt-1 text-green-500">{avgSuccessRate}%</p>
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
                          {company.status === 'active' ? t('team.active') : t('team.inactive')}
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
                    {t('delivery.viewDetails')}
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  <div className={`p-4 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <MapPinIcon className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-gray-600'}`} />
                      <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>{t('delivery.coverage')}</span>
                    </div>
                    <p className="font-semibold">{company.coverage === 'National' ? t('delivery.national') : t('delivery.regional')}</p>
                  </div>

                  <div className={`p-4 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <ClockIcon className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-gray-600'}`} />
                      <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>{t('delivery.avgDelivery')}</span>
                    </div>
                    <p className="font-semibold">{company.avgDeliveryTime}</p>
                  </div>

                  <div className={`p-4 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <TruckIcon className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-gray-600'}`} />
                      <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>{t('delivery.deliveries')}</span>
                    </div>
                    <p className="font-semibold">{company.totalDeliveries.toLocaleString()}</p>
                  </div>

                  <div className={`p-4 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircleIcon className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-gray-600'}`} />
                      <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>{t('delivery.successRate')}</span>
                    </div>
                    <p className="font-semibold text-green-500">{company.successRate}%</p>
                  </div>
                </div>

                <div className="mt-4">
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'} mb-2`}>{t('delivery.coverageRegions')}:</p>
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

          {/* Add Partner Modal */}
          {showModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className={`rounded-lg ${isDark ? 'bg-slate-800' : 'bg-white'} max-w-md w-full p-6 max-h-[90vh] overflow-y-auto`}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold">{t('delivery.addPartner')}</h2>
                  <button onClick={() => setShowModal(false)} className={`p-2 rounded-lg ${isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-100'}`}>
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                      {t('shops.shopName')}
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
                      {t('delivery.coverage')}
                    </label>
                    <select
                      value={formData.coverage}
                      onChange={(e) => setFormData({ ...formData, coverage: e.target.value as 'National' | 'Regional' })}
                      className={`w-full px-4 py-2 rounded-lg border ${isDark ? 'bg-slate-700 border-slate-600' : 'bg-white border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    >
                      <option value="National">{t('delivery.national')}</option>
                      <option value="Regional">{t('delivery.regional')}</option>
                    </select>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                      {t('delivery.avgDelivery')}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="24-48h"
                      value={formData.avgDeliveryTime}
                      onChange={(e) => setFormData({ ...formData, avgDeliveryTime: e.target.value })}
                      className={`w-full px-4 py-2 rounded-lg border ${isDark ? 'bg-slate-700 border-slate-600' : 'bg-white border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                      {t('delivery.coverageRegions')}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Tunis, Sfax, Sousse"
                      value={formData.regions}
                      onChange={(e) => setFormData({ ...formData, regions: e.target.value })}
                      className={`w-full px-4 py-2 rounded-lg border ${isDark ? 'bg-slate-700 border-slate-600' : 'bg-white border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                    <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                      Separate regions with commas
                    </p>
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
