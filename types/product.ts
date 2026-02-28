/**
 * Product type definitions
 */

export interface Product {
  _id: string
  shopId: string
  name: string
  description?: string
  price: number
  sku?: string
  category?: string
  images?: string[] // Legacy field for multiple images
  imageUrl?: string // NEW: Single primary image URL
  imageUploadedAt?: string // NEW: Timestamp of image upload
  url?: string
  platform: string
  isActive: boolean
  inventory?: {
    quantity: number
    inStock: boolean
  }
  createdAt?: string
  updatedAt?: string
}

export interface ProductImageUploadResponse {
  imageUrl: string
  uploadedAt: string
}

export interface ProductImageDeleteResponse {
  success: boolean
  message: string
}
