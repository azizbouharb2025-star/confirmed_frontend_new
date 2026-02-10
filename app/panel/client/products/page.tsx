'use client'

import { useState, useEffect } from 'react'
import { PlusIcon, ArrowPathIcon, CubeIcon, BuildingStorefrontIcon, ChevronDownIcon, XMarkIcon, CheckCircleIcon, ExclamationCircleIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { useLanguage } from '@/hooks/useLanguage'
import Link from 'next/link'
import api from '@/lib/api'
import logger from '@/lib/logger'

interface Product {
  _id: string
  name: string
  description: string
  price: number
  sku: string
  category: string
  images: string[]
  url: string
  platform: string
  isActive: boolean
  inventory?: { quantity: number; inStock: boolean }
}

interface Shop {
  _id: string
  name: string
  platform: string
}

interface FormData {
  name: string
  description: string
  price: string
  sku: string
  category: string
  images: string[]
  url: string
}

const initialFormData: FormData = {
  name: '',
  description: '',
  price: '',
  sku: '',
  category: '',
  images: [''],
  url: ''
}


export default function ProductsPage() {
  const { t } = useLanguage()
  const [showModal, setShowModal] = useState(false)
  const [filter, setFilter] = useState('all')
  const [products, setProducts] = useState<Product[]>([])
  const [selectedShop, setSelectedShop] = useState('')
  const [shops, setShops] = useState<Shop[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  useEffect(() => {
    fetchShops()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (selectedShop) {
      fetchProducts()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedShop])

  const fetchShops = async () => {
    try {
      const response = await api.get('/api/shops')
      const shopList = Array.isArray(response.data) ? response.data : response.data?.shops || []
      setShops(shopList)
      if (shopList.length > 0 && !selectedShop) {
        setSelectedShop(shopList[0]._id)
      }
    } catch (err) {
      logger.error('Failed to fetch shops:', err, 'Products')
    } finally {
      setLoading(false)
    }
  }

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/api/products/shop/${selectedShop}`)
      // Handle 404 or HTML error responses
      if (response.data?.products) {
        setProducts(response.data.products)
      } else if (Array.isArray(response.data)) {
        setProducts(response.data)
      } else {
        setProducts([])
      }
    } catch (err) {
      logger.error('Failed to fetch products:', err, 'Products')
      setProducts([]) // Reset to empty on error
    } finally {
      setLoading(false)
    }
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}
    if (!formData.name.trim()) errors.name = t('products.nameRequired')
    if (!formData.price || parseFloat(formData.price) <= 0) errors.price = t('products.priceRequired')
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return
    setSaving(true)
    setError(null)

    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        sku: formData.sku,
        category: formData.category,
        images: formData.images.filter(img => img.trim()),
        url: formData.url,
        shopId: selectedShop
      }

      let response
      if (editingProduct) {
        response = await api.patch(`/api/products/${editingProduct._id}`, payload)
      } else {
        response = await api.post(`/api/products/shop/${selectedShop}`, payload)
      }

      if (response.data._id || response.data.id) {
        if (editingProduct) {
          setProducts(prev => prev.map(p => p._id === editingProduct._id ? response.data : p))
          setSuccess(t('products.updateSuccess'))
        } else {
          setProducts(prev => [...prev, response.data])
          setSuccess(t('products.createSuccess'))
        }
        closeModal()
        setTimeout(() => setSuccess(null), 3000)
      } else if (response.data.error || response.data.message) {
        setError(response.data.error || response.data.message)
      }
    } catch {
      const errorMsg = t('products.failedSave')
      setError(errorMsg)
    } finally {
      setSaving(false)
    }
  }

  const handleSync = async () => {
    if (!selectedShop) return
    setSyncing(true)
    setError(null)

    try {
      const shop = shops.find(s => s._id === selectedShop)
      const response = await api.post(`/api/products/shop/${selectedShop}/sync`, { 
        platform: shop?.platform || 'shopify'
      })
      
      if (response.data.syncResults || response.data.message) {
        setSuccess(`Synced ${response.data.syncResults?.newProducts || 0} new products`)
        fetchProducts()
        setTimeout(() => setSuccess(null), 3000)
      } else if (response.data.error) {
        setError(response.data.error)
      }
    } catch {
      setError(t('products.syncNotAvailable'))
    } finally {
      setSyncing(false)
    }
  }

  const handleDelete = async (productId: string) => {
    if (!confirm(t('products.confirmDelete'))) return
    
    try {
      await api.post(`/api/products/${productId}`, { _method: 'DELETE' })
      setProducts(prev => prev.filter(p => p._id !== productId))
      setSuccess(t('products.deleteSuccess'))
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      const error = err as { message?: string }
      setError(error.message || t('products.failedDelete'))
    }
  }

  const openEditModal = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      sku: product.sku || '',
      category: product.category || '',
      images: product.images?.length ? product.images : [''],
      url: product.url || ''
    })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingProduct(null)
    setFormData(initialFormData)
    setFormErrors({})
  }

  const filteredProducts = products.filter(p => {
    if (filter === 'manual') return p.platform === 'manual'
    if (filter === 'synced') return p.platform !== 'manual'
    return true
  })

  const inputClass = (field: string) => `w-full px-4 py-3 rounded-lg dark:bg-slate-800 light:bg-gray-50 border-2 ${
    formErrors[field] ? 'border-red-500' : 'dark:border-slate-600 light:border-gray-300 focus:border-blue-500'
  } dark:text-white light:text-gray-900 placeholder:opacity-50 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all`


  // No shops - show create shop prompt
  if (!loading && shops.length === 0) {
    return (
      <ProtectedRoute allowedRoles={['shop_owner']}>
        <DashboardLayout userRole="shop_owner">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="card p-12 text-center max-w-md">
              <BuildingStorefrontIcon className="w-16 h-16 mx-auto dark:text-slate-600 light:text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">{t('products.noShopTitle')}</h3>
              <p className="dark:text-slate-400 light:text-gray-600 mb-6">{t('products.noShopDesc')}</p>
              <Link href="/panel/client/shops" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium">
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
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold">{t('products.title')}</h1>
              <p className="text-sm dark:text-slate-400 light:text-gray-600 mt-1">{t('products.subtitle')}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {/* Shop Selector */}
              <div className="relative">
                <select
                  value={selectedShop}
                  onChange={(e) => setSelectedShop(e.target.value)}
                  className="appearance-none pl-4 pr-10 py-2.5 rounded-lg dark:bg-slate-800 light:bg-white border-2 dark:border-slate-700 light:border-gray-300 dark:text-white light:text-gray-900 font-medium outline-none focus:border-blue-500 transition-colors cursor-pointer"
                >
                  {shops.map((shop) => (
                    <option key={shop._id} value={shop._id}>{shop.name}</option>
                  ))}
                </select>
                <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 dark:text-slate-400 light:text-gray-500 pointer-events-none" />
              </div>

              {/* Sync Button */}
              <button
                onClick={handleSync}
                disabled={syncing || !selectedShop}
                className="flex items-center gap-2 px-4 py-2 dark:bg-slate-800 light:bg-white border dark:border-slate-700 light:border-gray-300 rounded-lg hover:opacity-80 transition-opacity disabled:opacity-50"
              >
                <ArrowPathIcon className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? t('products.syncing') : t('products.syncNow')}
              </button>

              {/* Add Product Button */}
              <button
                onClick={() => setShowModal(true)}
                disabled={!selectedShop}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                <PlusIcon className="w-5 h-5" />
                {t('products.addManual')}
              </button>
            </div>
          </div>

          {/* Alerts */}
          {success && (
            <div className="flex items-center gap-2 p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-500">
              <CheckCircleIcon className="w-5 h-5" />
              {success}
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500">
              <ExclamationCircleIcon className="w-5 h-5" />
              {error}
              <button onClick={() => setError(null)} className="ml-auto"><XMarkIcon className="w-4 h-4" /></button>
            </div>
          )}

          {/* Filter Tabs */}
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
                {f === 'all' ? t('products.all') : f === 'manual' ? t('products.manual') : t('products.synced')} {filter === f && `(${filteredProducts.length})`}
              </button>
            ))}
          </div>


          {/* Content */}
          {loading ? (
            <div className="card p-12 text-center">
              <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="dark:text-slate-400 light:text-gray-600">{t('common.loadingProducts')}</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="card p-12 text-center">
              <CubeIcon className="w-16 h-16 mx-auto dark:text-slate-600 light:text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t('products.noProducts')}</h3>
              <p className="dark:text-slate-400 light:text-gray-600 mb-6">{t('products.addFirst')}</p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => setShowModal(true)} className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                  {t('products.addManual')}
                </button>
                <button onClick={handleSync} disabled={syncing} className="px-6 py-2 dark:bg-slate-800 light:bg-gray-100 rounded-lg hover:opacity-80 transition-opacity disabled:opacity-50">
                  {syncing ? t('products.syncing') : t('products.syncNow')}
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map((product) => (
                <div key={product._id} className="card overflow-hidden group">
                  {/* Product Image */}
                  <div className="relative h-48 bg-slate-800">
                    {product.images?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <CubeIcon className="w-16 h-16 dark:text-slate-600 light:text-gray-400" />
                      </div>
                    )}
                    {/* Actions Overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button onClick={() => openEditModal(product)} className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors">
                        <PencilIcon className="w-5 h-5 text-white" />
                      </button>
                      <button onClick={() => handleDelete(product._id)} className="p-2 bg-red-500/50 rounded-lg hover:bg-red-500/70 transition-colors">
                        <TrashIcon className="w-5 h-5 text-white" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Product Info */}
                  <div className="p-4">
                    <h3 className="font-semibold mb-1 truncate">{product.name}</h3>
                    <p className="text-sm dark:text-slate-400 light:text-gray-600 mb-3 line-clamp-2">{product.description || t('products.noDescription')}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-blue-500">${product.price.toFixed(2)}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        product.platform === 'manual' 
                          ? 'bg-purple-500/10 text-purple-500' 
                          : 'bg-green-500/10 text-green-500'
                      }`}>
                        {product.platform === 'manual' ? t('products.manual') : t('products.synced')}
                      </span>
                    </div>
                    {product.inventory && (
                      <div className="mt-2 text-xs dark:text-slate-400 light:text-gray-500">
                        {t('products.stock')}: {product.inventory.quantity} {product.inventory.inStock ? '✓' : '✗'}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}


          {/* Add/Edit Product Modal */}
          {showModal && (
            <div className="fixed inset-0 dark:bg-black/60 light:bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="dark:bg-slate-900 light:bg-white rounded-xl shadow-2xl border dark:border-slate-700 light:border-gray-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b dark:border-slate-700 light:border-gray-200">
                  <h2 className="text-xl font-semibold dark:text-white light:text-gray-900">
                    {editingProduct ? t('page.editProduct') : t('products.addManual')}
                  </h2>
                  <button onClick={closeModal} className="p-2 rounded-lg dark:hover:bg-slate-800 light:hover:bg-gray-100 transition-colors">
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-semibold mb-2 dark:text-white light:text-gray-900">{t('products.name')} *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => { setFormData(prev => ({ ...prev, name: e.target.value })); setFormErrors(prev => ({ ...prev, name: '' })) }}
                      className={inputClass('name')}
                      placeholder="Wireless Headphones"
                    />
                    {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-semibold mb-2 dark:text-white light:text-gray-900">{t('products.description')}</label>
                    <textarea
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className={inputClass('description')}
                      placeholder="High-quality wireless headphones..."
                    />
                  </div>

                  {/* Price & SKU */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2 dark:text-white light:text-gray-900">{t('products.price')} *</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => { setFormData(prev => ({ ...prev, price: e.target.value })); setFormErrors(prev => ({ ...prev, price: '' })) }}
                        className={inputClass('price')}
                        placeholder="99.99"
                      />
                      {formErrors.price && <p className="text-red-500 text-xs mt-1">{formErrors.price}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2 dark:text-white light:text-gray-900">{t('products.sku')}</label>
                      <input
                        type="text"
                        value={formData.sku}
                        onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                        className={inputClass('sku')}
                        placeholder="WH-001"
                      />
                    </div>
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-semibold mb-2 dark:text-white light:text-gray-900">{t('products.category')}</label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      className={inputClass('category')}
                      placeholder="Electronics"
                    />
                  </div>

                  {/* Image URL */}
                  <div>
                    <label className="block text-sm font-semibold mb-2 dark:text-white light:text-gray-900">{t('products.imageUrl')}</label>
                    <input
                      type="url"
                      value={formData.images[0] || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, images: [e.target.value] }))}
                      className={inputClass('images')}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>

                  {/* Product URL */}
                  <div>
                    <label className="block text-sm font-semibold mb-2 dark:text-white light:text-gray-900">{t('products.productLink')}</label>
                    <input
                      type="url"
                      value={formData.url}
                      onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                      className={inputClass('url')}
                      placeholder="https://mystore.com/products/..."
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="flex gap-3 p-6 border-t dark:border-slate-700 light:border-gray-200">
                  <button type="button" onClick={closeModal} className="flex-1 px-4 py-3 dark:bg-slate-800 light:bg-white dark:text-white light:text-gray-700 border-2 dark:border-slate-700 light:border-gray-300 rounded-lg hover:opacity-80 transition-opacity font-medium">
                    {t('shops.cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={saving}
                    className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                        {t('products.saving')}
                      </>
                    ) : editingProduct ? t('products.update') : t('shops.save')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
