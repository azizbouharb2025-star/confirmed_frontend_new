'use client'

import { useState, useEffect } from 'react'
import { BuildingStorefrontIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { useLanguage } from '@/hooks/useLanguage'
import api from '@/lib/api'
import logger from '@/lib/logger'

interface Shop {
  _id: string
  name: string
  domain: string
  platform: string
  isActive: boolean
  subscriptionId: {
    plan: string
    status: string
  }
  createdAt: string
}

export default function ShopsManagement() {
  const { t } = useLanguage()
  const [shops, setShops] = useState<Shop[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  const fetchShops = async () => {
    try {
      const response = await api.get('/api/shops')
      setShops(response.data)
    } catch (error) {
      logger.error('Failed to fetch shops:', error, 'Admin')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchShops()
  }, [])

  const filteredShops = shops.filter(shop =>
    shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shop.domain.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <DashboardLayout userRole="admin">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold">{t('page.shopManagement')}</h1>
            <p className="text-sm dark:text-slate-400 light:text-gray-600 mt-1">{t('page.shopManagementDesc')}</p>
          </div>

          <div className="card p-4">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 dark:text-slate-400 light:text-gray-400" />
              <input
                type="text"
                placeholder="Search shops..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border dark:bg-slate-900 dark:border-slate-700 light:bg-white light:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="p-4 border-b dark:border-slate-800 light:border-gray-200">
              <h2 className="font-semibold flex items-center gap-2">
                <BuildingStorefrontIcon className="h-5 w-5" />
                Shops ({filteredShops.length})
              </h2>
            </div>

            {loading ? (
              <div className="p-4 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse p-4 rounded-lg dark:bg-slate-800 light:bg-gray-100" />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="dark:bg-slate-800 light:bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium">{t('table.name')}</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">{t('table.domain')}</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">{t('table.platform')}</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">{t('table.subscription')}</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">{t('table.status')}</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">{t('table.created')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-slate-800 light:divide-gray-200">
                    {filteredShops.map((shop) => (
                      <tr key={shop._id} className="dark:hover:bg-slate-800/50 light:hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-sm">{shop.name}</td>
                        <td className="px-4 py-3 text-sm dark:text-slate-400 light:text-gray-600">{shop.domain}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-500">
                            {shop.platform}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            shop.subscriptionId?.plan === 'enterprise' ? 'bg-purple-500/10 text-purple-500' :
                            shop.subscriptionId?.plan === 'premium' ? 'bg-blue-500/10 text-blue-500' :
                            'bg-gray-500/10 text-gray-500'
                          }`}>
                            {shop.subscriptionId?.plan || 'free'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            shop.isActive ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                          }`}>
                            {shop.isActive ? t('status.active') : t('status.inactive')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm dark:text-slate-400 light:text-gray-600">
                          {new Date(shop.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
