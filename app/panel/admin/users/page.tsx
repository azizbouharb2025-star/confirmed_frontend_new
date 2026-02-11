'use client'

import { useState, useEffect } from 'react'
import { UsersIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { useLanguage } from '@/hooks/useLanguage'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import logger from '@/lib/logger'

interface User {
  _id: string
  name?: string
  firstName?: string
  lastName?: string
  email: string
  role: string
  isActive: boolean
  lastLogin: string
  shop?: { name: string; _id: string }
  shopId?: { name: string; subscriptionId?: { plan: string } } | string
  stats?: { totalOrders?: number; totalCalls?: number; confirmationRate?: number }
  subscription?: { plan: string; status?: string; features?: Record<string, unknown> }
  subscriptionId?: { plan: string } | string
}

type SubscriptionPlan = 'starter' | 'pro' | 'business' | 'enterprise'

/**
 * Resolve subscription plan from user object.
 * Backend may return it as user.subscription.plan, user.subscriptionId.plan,
 * or nested through user.shopId.subscriptionId.plan
 */
function getUserPlan(user: User): string {
  // Direct subscription field
  if (user.subscription?.plan) return user.subscription.plan
  // Populated subscriptionId on user
  if (user.subscriptionId && typeof user.subscriptionId === 'object' && user.subscriptionId.plan) {
    return user.subscriptionId.plan
  }
  // Populated through shop
  if (user.shopId && typeof user.shopId === 'object' && 'subscriptionId' in user.shopId) {
    const sub = user.shopId.subscriptionId
    if (sub && typeof sub === 'object' && sub.plan) return sub.plan
  }
  return 'starter'
}

/**
 * Get display name from user object (handles both name and firstName/lastName)
 */
function getUserName(user: User): string {
  if (user.name) return user.name
  if (user.firstName || user.lastName) return `${user.firstName || ''} ${user.lastName || ''}`.trim()
  return user.email
}

/**
 * Get shop name from user object (handles both shop and shopId as object)
 */
function getShopName(user: User): string {
  if (user.shop?.name) return user.shop.name
  if (user.shopId && typeof user.shopId === 'object' && 'name' in user.shopId) return user.shopId.name
  return '-'
}

export default function UsersManagement() {
  const { t } = useLanguage()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')

  const fetchUsers = async () => {
    try {
      const response = await api.get(`/api/admin/users?page=1&limit=50&role=${roleFilter !== 'all' ? roleFilter : ''}`)
      setUsers(response.data.users)
    } catch (error) {
      logger.error('Failed to fetch users:', error, 'Admin')
    } finally {
      setLoading(false)
    }
  }

  const toggleUserStatus = async (userId: string) => {
    try {
      await api.patch(`/api/admin/users/${userId}/toggle-status`, {})
      fetchUsers()
    } catch (error) {
      logger.error('Failed to toggle user status:', error, 'Admin')
    }
  }

  const updateUserSubscription = async (userId: string, plan: SubscriptionPlan) => {
    try {
      logger.debug('Updating subscription for user:', { userId, plan }, 'Admin')
      await api.patch(`/api/admin/users/${userId}/subscription`, { plan })
      toast.success(`Subscription updated to ${plan}`)
      // Re-fetch users from server to get the actual persisted state
      fetchUsers()
    } catch (error) {
      logger.error('Failed to update subscription:', error, 'Admin')
      const err = error as { response?: { data?: { message?: string } }; message?: string }
      const errorMsg = err.response?.data?.message || err.message || 'Failed to update subscription'
      toast.error(errorMsg)
    }
  }

  useEffect(() => {
    fetchUsers()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleFilter])

  const filteredUsers = users.filter(user => {
    const name = getUserName(user).toLowerCase()
    const search = searchTerm.toLowerCase()
    return name.includes(search) || (user.email || '').toLowerCase().includes(search)
  })

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <DashboardLayout userRole="admin">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold">{t('page.userManagement')}</h1>
            <p className="text-sm dark:text-slate-400 light:text-gray-600 mt-1">{t('page.userManagementDesc')}</p>
          </div>

          <div className="card p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 dark:text-slate-400 light:text-gray-400" />
                <input
                  type="text"
                  placeholder={t('common.search')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border dark:bg-slate-900 dark:border-slate-700 light:bg-white light:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-4 py-2 rounded-lg border dark:bg-slate-900 dark:border-slate-700 light:bg-white light:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">{t('filter.allRoles')}</option>
                <option value="admin">Admin</option>
                <option value="operator">Operator</option>
                <option value="shop_owner">Shop Owner</option>
              </select>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="p-4 border-b dark:border-slate-800 light:border-gray-200">
              <h2 className="font-semibold flex items-center gap-2">
                <UsersIcon className="h-5 w-5" />
                Users ({filteredUsers.length})
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
                      <th className="px-4 py-3 text-left text-sm font-medium">{t('table.email')}</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">{t('table.role')}</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Subscription</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">{t('table.shop')}</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">{t('table.stats')}</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">{t('table.status')}</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">{t('table.actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-slate-800 light:divide-gray-200">
                    {filteredUsers.map((user) => (
                      <tr key={user._id} className="dark:hover:bg-slate-800/50 light:hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-sm">{getUserName(user)}</td>
                        <td className="px-4 py-3 text-sm dark:text-slate-400 light:text-gray-600">{user.email}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-500">
                            {user.role.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {user.role === 'shop_owner' ? (
                            <select
                              value={getUserPlan(user)}
                              onChange={(e) => {
                                e.stopPropagation()
                                updateUserSubscription(user._id, e.target.value as SubscriptionPlan)
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="px-2 py-1 text-xs rounded border dark:bg-slate-900 dark:border-slate-700 light:bg-white light:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                            >
                              <option value="starter">Starter</option>
                              <option value="pro">Pro</option>
                              <option value="business">Business</option>
                              <option value="enterprise">Enterprise</option>
                            </select>
                          ) : (
                            <span className="text-xs dark:text-slate-400 light:text-gray-500">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">{getShopName(user)}</td>
                        <td className="px-4 py-3 text-xs">
                          {user.stats?.totalOrders && <div>Orders: {user.stats.totalOrders}</div>}
                          {user.stats?.totalCalls && <div>Calls: {user.stats.totalCalls}</div>}
                          {user.stats?.confirmationRate && <div>Rate: {user.stats.confirmationRate.toFixed(1)}%</div>}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            user.isActive ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                          }`}>
                            {user.isActive ? t('status.active') : t('status.inactive')}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => toggleUserStatus(user._id)}
                            className="text-sm text-blue-500 hover:text-blue-600"
                          >
                            {user.isActive ? t('action.deactivate') : t('action.activate')}
                          </button>
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
