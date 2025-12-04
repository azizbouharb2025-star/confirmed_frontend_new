'use client'

import { useState } from 'react'
import { PlusIcon, ArrowPathIcon, CubeIcon, BuildingStorefrontIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { useLanguage } from '@/hooks/useLanguage'
import Link from 'next/link'

export default function ProductsPage() {
  const { t } = useLanguage()
  const [showModal, setShowModal] = useState(false)
  const [autoSync, setAutoSync] = useState(false)
  const [filter, setFilter] = useState('all')
  const [products, setProducts] = useState<any[]>([])
  const [selectedShop, setSelectedShop] = useState('')
  const [shops, setShops] = useState<any[]>([])
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    sku: '',
    category: '',
    imageUrl: '',
    productLink: ''
  })

  if (shops.length === 0) {
    return (
      <ProtectedRoute allowedRoles={['shop_owner']}>
        <DashboardLayout userRole="shop_owner">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="card p-12 text-center max-w-md">
              <BuildingStorefrontIcon className="w-16 h-16 mx-auto dark:text-slate-600 light:text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">{t('products.noShopTitle')}</h3>
              <p className="dark:text-slate-400 light:text-gray-600 mb-6">{t('products.noShopDesc')}</p>
              <Link
                href="/panel/client/shops"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
              >
                <PlusIcon className="w-5 h-5" />
                {t('products.createShop')}
              </Link>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={['shop_owner']}>
      <DashboardLayout userRole="shop_owner">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">{t('products.title')}</h1>
              <p className="text-sm dark:text-slate-400 light:text-gray-600 mt-1">{t('products.subtitle')}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <select
                  value={selectedShop}
                  onChange={(e) => setSelectedShop(e.target.value)}
                  className="appearance-none pl-4 pr-10 py-2.5 rounded-lg dark:bg-slate-800 light:bg-white border-2 dark:border-slate-700 light:border-gray-300 dark:text-white light:text-gray-900 font-medium outline-none focus:border-blue-500 transition-colors cursor-pointer"
                >
                  <option value="">{t('products.selectShop')}</option>
                  {shops.map((shop) => (
                    <option key={shop._id} value={shop._id}>{shop.name}</option>
                  ))}
                </select>
                <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 dark:text-slate-400 light:text-gray-500 pointer-events-none" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoSync}
                  onChange={(e) => setAutoSync(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-sm font-medium">{t('products.autoSync')}</span>
              </label>
              <button
                className="flex items-center gap-2 px-4 py-2 dark:bg-slate-800 light:bg-white border dark:border-slate-700 light:border-gray-300 rounded-lg hover:opacity-80 transition-opacity"
              >
                <ArrowPathIcon className="w-5 h-5" />
                {t('products.syncNow')}
              </button>
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <PlusIcon className="w-5 h-5" />
                {t('products.addManual')}
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            {['all', 'manual', 'synced'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === f
                    ? 'bg-blue-500 text-white'
                    : 'dark:bg-slate-800 light:bg-gray-100 dark:text-slate-300 light:text-gray-700 hover:opacity-80'
                }`}
              >
                {t(`products.${f}`)}
              </button>
            ))}
          </div>

          {products.length === 0 ? (
            <div className="card p-12 text-center">
              <CubeIcon className="w-16 h-16 mx-auto dark:text-slate-600 light:text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t('products.noProducts')}</h3>
              <p className="dark:text-slate-400 light:text-gray-600 mb-6">{t('products.addFirst')}</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowModal(true)}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  {t('products.addManual')}
                </button>
                <button className="px-6 py-2 dark:bg-slate-800 light:bg-gray-100 rounded-lg hover:opacity-80 transition-opacity">
                  {t('products.syncNow')}
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => (
                <div key={product.id} className="card p-4">
                  <img src={product.imageUrl} alt={product.name} className="w-full h-48 object-cover rounded-lg mb-3" />
                  <h3 className="font-semibold mb-1">{product.name}</h3>
                  <p className="text-sm dark:text-slate-400 light:text-gray-600 mb-2 line-clamp-2">{product.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-blue-500">${product.price}</span>
                    <span className="text-xs px-2 py-1 rounded-full dark:bg-slate-800 light:bg-gray-100">
                      {product.syncMethod === 'manual' ? t('products.manual') : t('products.synced')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {showModal && (
            <div className="fixed inset-0 dark:bg-black/60 light:bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="dark:bg-slate-900 light:bg-white rounded-xl shadow-2xl border dark:border-slate-700 light:border-gray-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b dark:border-slate-700 light:border-gray-200">
                  <h2 className="text-xl font-semibold dark:text-white light:text-gray-900">{t('products.addManual')}</h2>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2 dark:text-white light:text-gray-900">{t('products.name')}</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full px-4 py-3 rounded-lg dark:bg-slate-800 light:bg-white border-2 dark:border-slate-600 light:border-gray-300 dark:text-white light:text-gray-900 dark:placeholder:text-slate-500 light:placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                        placeholder="Wireless Headphones"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2 dark:text-white light:text-gray-900">{t('products.description')}</label>
                      <textarea
                        rows={3}
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        className="w-full px-4 py-3 rounded-lg dark:bg-slate-800 light:bg-white border-2 dark:border-slate-600 light:border-gray-300 dark:text-white light:text-gray-900 dark:placeholder:text-slate-500 light:placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                        placeholder="High-quality wireless headphones..."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold mb-2 dark:text-white light:text-gray-900">{t('products.price')}</label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.price}
                          onChange={(e) => setFormData({...formData, price: e.target.value})}
                          className="w-full px-4 py-3 rounded-lg dark:bg-slate-800 light:bg-white border-2 dark:border-slate-600 light:border-gray-300 dark:text-white light:text-gray-900 dark:placeholder:text-slate-500 light:placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                          placeholder="99.99"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2 dark:text-white light:text-gray-900">{t('products.sku')}</label>
                        <input
                          type="text"
                          value={formData.sku}
                          onChange={(e) => setFormData({...formData, sku: e.target.value})}
                          className="w-full px-4 py-3 rounded-lg dark:bg-slate-800 light:bg-white border-2 dark:border-slate-600 light:border-gray-300 dark:text-white light:text-gray-900 dark:placeholder:text-slate-500 light:placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                          placeholder="WH-001"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2 dark:text-white light:text-gray-900">{t('products.category')}</label>
                      <input
                        type="text"
                        value={formData.category}
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                        className="w-full px-4 py-3 rounded-lg dark:bg-slate-800 light:bg-white border-2 dark:border-slate-600 light:border-gray-300 dark:text-white light:text-gray-900 dark:placeholder:text-slate-500 light:placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                        placeholder="Electronics"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2 dark:text-white light:text-gray-900">{t('products.imageUrl')}</label>
                      <input
                        type="url"
                        value={formData.imageUrl}
                        onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                        className="w-full px-4 py-3 rounded-lg dark:bg-slate-800 light:bg-white border-2 dark:border-slate-600 light:border-gray-300 dark:text-white light:text-gray-900 dark:placeholder:text-slate-500 light:placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2 dark:text-white light:text-gray-900">{t('products.productLink')}</label>
                      <input
                        type="url"
                        value={formData.productLink}
                        onChange={(e) => setFormData({...formData, productLink: e.target.value})}
                        className="w-full px-4 py-3 rounded-lg dark:bg-slate-800 light:bg-white border-2 dark:border-slate-600 light:border-gray-300 dark:text-white light:text-gray-900 dark:placeholder:text-slate-500 light:placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                        placeholder="https://mystore.com/products/..."
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-6 border-t dark:border-slate-700 light:border-gray-200 mt-6">
                    <button
                      onClick={() => setShowModal(false)}
                      className="flex-1 px-4 py-3 dark:bg-slate-800 light:bg-white dark:text-white light:text-gray-700 border-2 dark:border-slate-700 light:border-gray-300 rounded-lg hover:opacity-80 transition-opacity font-medium"
                    >
                      {t('shops.cancel')}
                    </button>
                    <button className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium">
                      {t('shops.save')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
