'use client'

import { useState, useEffect } from 'react'
import { PlusIcon, ArrowPathIcon, CubeIcon, BuildingStorefrontIcon, ChevronDownIcon, XMarkIcon, CheckCircleIcon, ExclamationCircleIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { useLanguage } from '@/hooks/useLanguage'
import Link from 'next/link'
import api from '@/lib/api'
import logger from '@/lib/logger'
import { formatCurrency } from '@/lib/formatCurrency'
import ProductImageDisplay from '@/components/products/ProductImageDisplay'
import ProductImageUpload from '@/components/products/ProductImageUpload'
import ProductPerformanceTab from '@/components/products/ProductPerformanceTab'

interface Product {
  _id: string
  name: string
  description: string
  price: number
    deliveryFee?: number
  sku: string
  category: string
  images: string[]
  imageUrl?: string // NEW: Primary image URL
  imageUploadedAt?: string // NEW: Image upload timestamp
  url: string
  platform?: string
    syncMethod?: 'manual' | 'auto_sync'
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
    deliveryFee: string
  sku: string
  category: string
  images: string[]
  url: string
}

const stripHtml = (value?: string) => {
  if (!value) return ''

  return value
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/p>/gi, ' ')
    .replace(/<\/div>/gi, ' ')
    .replace(/<\/li>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim()
}

const initialFormData: FormData = {
  name: '',
  description: '',
  price: '',
    deliveryFee: '',
  sku: '',
  category: '',
  images: [''],
  url: ''
}


export default function ProductsPage() {
  const { t } = useLanguage()
  const [activeTab, setActiveTab] = useState<'products' | 'performance'>('products')
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
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null)
  const [removeCurrentImage, setRemoveCurrentImage] = useState(false)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const [deletingProduct, setDeletingProduct] = useState(false)

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

  const fetchProducts = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true)
      }

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

      // During a silent refresh, preserve the currently displayed products.
      if (!silent) {
        setProducts([])
      }
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    if (!selectedShop) return

    const interval = window.setInterval(() => {
      /*
       * Silent background refresh.
       * Do not disturb an active edit, save, sync or deletion.
       */
      if (
        !showModal &&
        !saving &&
        !syncing &&
        !deletingProduct &&
        !productToDelete
      ) {
        void fetchProducts(true)
      }
    }, 30000)

    return () => window.clearInterval(interval)

    // fetchProducts intentionally excluded to avoid recreating
    // the interval on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedShop,
    showModal,
    saving,
    syncing,
    deletingProduct,
    productToDelete,
  ])

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}
    if (!formData.name.trim()) errors.name = t('products.nameRequired')
    if (!formData.price || parseFloat(formData.price) <= 0) errors.price = t('products.priceRequired')

    if (
      formData.deliveryFee === '' ||
      Number.isNaN(parseFloat(formData.deliveryFee)) ||
      parseFloat(formData.deliveryFee) < 0
    ) {
      errors.deliveryFee = 'Les frais de livraison sont obligatoires et doivent être supérieurs ou égaux à 0.'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setSaving(true)
    setError(null)

    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        deliveryFee: parseFloat(formData.deliveryFee),
        sku: formData.sku.trim(),
        category: formData.category.trim(),
        productLink: formData.url.trim()
      }

      let response

      if (editingProduct) {
        response = await api.put(
          `/api/products/shop/${selectedShop}/product/${editingProduct._id}`,
          payload
        )
      } else {
        response = await api.post(
          `/api/products/shop/${selectedShop}`,
          payload
        )
      }

      let savedProduct = response.data
      const productId = savedProduct._id || savedProduct.id

      if (!productId) {
        throw new Error('Identifiant du produit introuvable.')
      }

      // Nouvelle image ou remplacement
      if (selectedImageFile) {
        const imageData = new window.FormData()
        imageData.append('image', selectedImageFile)

        const imageResponse = await api.post(
          `/api/products/shop/${selectedShop}/product/${productId}/image`,
          imageData
        )

        savedProduct = {
          ...savedProduct,
          imageUrl: imageResponse.data.imageUrl,
          imageUploadedAt: imageResponse.data.uploadedAt
        }
      }
      // Suppression de l'image existante
      else if (
        editingProduct &&
        removeCurrentImage &&
        editingProduct.imageUrl
      ) {
        await api.delete(
          `/api/products/shop/${selectedShop}/product/${productId}/image`
        )

        savedProduct = {
          ...savedProduct,
          imageUrl: undefined,
          imageUploadedAt: undefined
        }
      }

      if (editingProduct) {
        setProducts(prev =>
          prev.map(product =>
            product._id === editingProduct._id
              ? savedProduct
              : product
          )
        )

        setSuccess('Produit mis à jour avec succès.')
      } else {
        setProducts(prev => [savedProduct, ...prev])
        setSuccess('Produit ajouté avec succès.')
      }

      closeModal()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      const requestError = err as {
        message?: string
        response?: {
          data?: {
            error?: string
          }
        }
      }

      setError(
        requestError.response?.data?.error ||
        requestError.message ||
        'Impossible d’enregistrer le produit.'
      )

      // Synchroniser l'interface si la création/modification a réussi
      // mais que l'upload d'image a échoué.
      await fetchProducts()
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
        const newProducts = response.data.syncResults?.newProducts || 0
        setSuccess(
          `${newProducts} produit${newProducts > 1 ? 's' : ''} synchronisé${newProducts > 1 ? 's' : ''} avec succès.`
        )
        fetchProducts()
        setTimeout(() => setSuccess(null), 3000)
      } else if (response.data.error) {
        setError(response.data.error)
      }
    } catch (err) {
      const syncError = err as {
        message?: string
        response?: {
          data?: {
            error?: string
            message?: string
          }
        }
      }

      setError(
        syncError.response?.data?.error ||
        syncError.response?.data?.message ||
        syncError.message ||
        t('products.syncNotAvailable')
      )
    } finally {
      setSyncing(false)
    }
  }

  const handleDelete = (product: Product) => {
    setProductToDelete(product)
  }

  const confirmDeleteProduct = async () => {
    if (!productToDelete) return

    setDeletingProduct(true)
    setError(null)

    try {
      await api.delete(
        `/api/products/shop/${selectedShop}/product/${productToDelete._id}`
      )

      setProducts(prev =>
        prev.filter(product => product._id !== productToDelete._id)
      )

      setProductToDelete(null)
      setSuccess('Produit supprimé avec succès.')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      const requestError = err as { message?: string }

      setError(
        requestError.message ||
        'Impossible de supprimer le produit.'
      )
    } finally {
      setDeletingProduct(false)
    }
  }

  const openEditModal = (product: Product) => {
    setEditingProduct(product)
    setSelectedImageFile(null)
    setRemoveCurrentImage(false)
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      deliveryFee: (product.deliveryFee ?? 0).toString(),
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
    setSelectedImageFile(null)
    setRemoveCurrentImage(false)
    setFormData(initialFormData)
    setFormErrors({})
  }

  const filteredProducts = products.filter(p => {
    if (filter === 'manual') return p.syncMethod === 'manual'
    if (filter === 'synced') return p.syncMethod === 'auto_sync'
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

              {/* Sync Button - only show on products tab */}
              {activeTab === 'products' && (
                <button
                  onClick={handleSync}
                  disabled={syncing || !selectedShop}
                  className="flex items-center gap-2 px-4 py-2 dark:bg-slate-800 light:bg-white border dark:border-slate-700 light:border-gray-300 rounded-lg hover:opacity-80 transition-opacity disabled:opacity-50"
                >
                  <ArrowPathIcon className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
                  {syncing ? t('products.syncing') : t('products.syncNow')}
                </button>
              )}

              {/* Add Product Button - only show on products tab */}
              {activeTab === 'products' && (
                <button
                  onClick={() => setShowModal(true)}
                  disabled={!selectedShop}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  <PlusIcon className="w-5 h-5" />
                  {t('products.addManual')}
                </button>
              )}
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 border-b dark:border-slate-700 light:border-gray-200">
            <button
              onClick={() => setActiveTab('products')}
              className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                activeTab === 'products'
                  ? 'text-blue-500'
                  : 'dark:text-slate-400 light:text-gray-600 hover:dark:text-white hover:light:text-gray-900'
              }`}
            >
              {t('products.productsTab')}
              {activeTab === 'products' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('performance')}
              className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                activeTab === 'performance'
                  ? 'text-blue-500'
                  : 'dark:text-slate-400 light:text-gray-600 hover:dark:text-white hover:light:text-gray-900'
              }`}
            >
              {t('products.performance')}
              {activeTab === 'performance' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"></div>
              )}
            </button>
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

          {/* Tab Content */}
          {activeTab === 'products' ? (
            <>
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
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {filteredProducts.map((product) => (
                    <div
                      key={product._id}
                      className="card p-4"
                    >
                      <div className="flex gap-4">

                        {/* Miniature du produit */}
                        <div className="shrink-0">
                          <ProductImageDisplay
                            imageUrl={
                              product.imageUrl ||
                              product.images?.[0]
                            }
                            productName={product.name}
                            size="small"
                          />
                        </div>

                        {/* Informations */}
                        <div className="min-w-0 flex-1">

                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h3 className="font-semibold truncate dark:text-white light:text-gray-900">
                                {product.name}
                              </h3>

                              <p className="mt-1 text-sm line-clamp-2 dark:text-slate-400 light:text-gray-600">
                                {stripHtml(product.description) ||
                                  t('products.noDescription')}
                              </p>
                            </div>

                            {/* Actions toujours visibles */}
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() =>
                                  openEditModal(product)
                                }
                                title="Modifier"
                                className="p-2 rounded-lg dark:bg-slate-800 light:bg-gray-100 hover:text-blue-500 transition-colors"
                              >
                                <PencilIcon className="w-4 h-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  handleDelete(product)
                                }
                                title="Supprimer"
                                className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Badges */}
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${
                                product.syncMethod === 'manual'
                                  ? 'bg-purple-500/10 text-purple-500'
                                  : 'bg-green-500/10 text-green-500'
                              }`}
                            >
                              {product.syncMethod === 'manual'
                                ? t('products.manual')
                                : t('products.synced')}
                            </span>

                            {product.category && (
                              <span className="text-xs px-2 py-1 rounded-full dark:bg-slate-800 light:bg-gray-100 dark:text-slate-300 light:text-gray-600">
                                {product.category}
                              </span>
                            )}

                            {product.sku && (
                              <span className="text-xs px-2 py-1 rounded-full dark:bg-slate-800 light:bg-gray-100 dark:text-slate-400 light:text-gray-500">
                                SKU : {product.sku}
                              </span>
                            )}
                          </div>

                          {/* Prix et livraison */}
                          <div className="mt-4 pt-3 border-t dark:border-slate-700 light:border-gray-200 flex items-end justify-between gap-4">
                            <div>
                              <p className="text-xs dark:text-slate-400 light:text-gray-500">
                                Prix
                              </p>

                              <p className="text-lg font-bold text-blue-500">
                                {formatCurrency(product.price)}
                              </p>
                            </div>

                            <div className="text-right">
                              <p className="text-xs dark:text-slate-400 light:text-gray-500">
                                Frais de livraison
                              </p>

                              <p className="text-sm font-semibold dark:text-white light:text-gray-900">
                                {formatCurrency(
                                  product.deliveryFee ?? 0
                                )}
                              </p>
                            </div>
                          </div>

                          {product.inventory && (
                            <div className="mt-2 text-xs dark:text-slate-400 light:text-gray-500">
                              {t('products.stock')} :{' '}
                              {product.inventory.quantity}{' '}
                              {product.inventory.inStock
                                ? '✓'
                                : '✗'}
                            </div>
                          )}

                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            /* Performance Tab */
            <ProductPerformanceTab shopId={selectedShop} />
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
                      placeholder="Ex. Souris sans fil"
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
                      placeholder="Décrivez brièvement le produit..."
                    />
                  </div>

                  {/* Product Image */}
                  <div>
                    <ProductImageUpload
                      currentImageUrl={
                        removeCurrentImage
                          ? undefined
                          : editingProduct?.imageUrl
                      }
                      productName={
                        formData.name ||
                        editingProduct?.name ||
                        'Produit'
                      }
                      selectedFile={selectedImageFile}
                      removalPending={removeCurrentImage}
                      onFileSelect={(file) => {
                        setSelectedImageFile(file)

                        if (file) {
                          setRemoveCurrentImage(false)
                        }
                      }}
                      onRemoveCurrent={() => {
                        setSelectedImageFile(null)
                        setRemoveCurrentImage(true)
                      }}
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

                  {/* Delivery Fee */}
                  <div>
                    <label className="block text-sm font-semibold mb-2 dark:text-white light:text-gray-900">
                      Frais de livraison (DT) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.001"
                      value={formData.deliveryFee}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, deliveryFee: e.target.value }))
                        setFormErrors(prev => ({ ...prev, deliveryFee: '' }))
                      }}
                      className={inputClass('deliveryFee')}
                      placeholder="8.000"
                    />
                    {formErrors.deliveryFee && (
                      <p className="text-red-500 text-xs mt-1">
                        {formErrors.deliveryFee}
                      </p>
                    )}
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-semibold mb-2 dark:text-white light:text-gray-900">{t('products.category')}</label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      className={inputClass('category')}
                      placeholder="Ex. Informatique"
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
                      placeholder="https://monsite.tn/produit/..."
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
          {productToDelete && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
              <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden">

                <div className="p-6">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
                    <TrashIcon className="h-6 w-6 text-red-500" />
                  </div>

                  <h2 className="text-xl font-semibold text-white">
                    Supprimer ce produit ?
                  </h2>

                  <p className="mt-3 text-sm leading-6 text-slate-400">
                    Cette action est définitive et supprimera ce produit de votre catalogue.
                  </p>

                  <div className="mt-5 rounded-xl border border-slate-700 bg-slate-800 p-4">
                    <p className="truncate font-medium text-white">
                      {productToDelete.name}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 border-t border-slate-700 p-6">
                  <button
                    type="button"
                    onClick={() => setProductToDelete(null)}
                    disabled={deletingProduct}
                    className="flex-1 rounded-lg border border-slate-600 px-4 py-3 font-medium text-white hover:bg-slate-800 disabled:opacity-50"
                  >
                    Annuler
                  </button>

                  <button
                    type="button"
                    onClick={confirmDeleteProduct}
                    disabled={deletingProduct}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-3 font-medium text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {deletingProduct ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Suppression...
                      </>
                    ) : (
                      <>
                        <TrashIcon className="h-5 w-5" />
                        Supprimer
                      </>
                    )}
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
