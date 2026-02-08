'use client';

/**
 * Support Card Generator Page
 * Allows Pro+ sellers to generate QR code support cards for orders
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */

import React, { useState, useCallback, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { WidgetGate } from '@/components/dashboard/WidgetGate';
import QRCodeDisplay from '@/components/complaints/QRCodeDisplay';
import { useSubscription } from '@/hooks/useSubscription';
import { useLanguage } from '@/hooks/useLanguage';
import { supportCardService } from '@/services/supportCardService';
import { orderService } from '@/services/orderService';
import { SupportCard } from '@/types/complaint';
import { Order, DEFAULT_ORDER_FILTERS } from '@/types/order';
import {
  QrCodeIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import logger from '@/lib/logger';

/**
 * Error state interface for generation failures
 * Requirements: 4.4
 */
interface GenerationError {
  message: string;
  orderId?: string;
}

/**
 * SupportCardsPage - QR code support card generator for sellers
 * 
 * Features:
 * - Tier gating for Pro+ access (Requirements: 4.1, 4.2)
 * - Single order QR generation form (Requirements: 4.1)
 * - Bulk order selection and generation (Requirements: 4.2)
 * - QR code display and download (Requirements: 4.3)
 * - Error handling for generation failures (Requirements: 4.4)
 */
export default function SupportCardsPage() {
  const { plan } = useSubscription();
  const { t } = useLanguage();

  // Single order generation state
  const [singleOrderId, setSingleOrderId] = useState('');
  const [singleGenerating, setSingleGenerating] = useState(false);
  const [singleSupportCard, setSingleSupportCard] = useState<SupportCard | null>(null);

  // Bulk generation state
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());
  const [bulkGenerating, setBulkGenerating] = useState(false);
  const [bulkSupportCards, setBulkSupportCards] = useState<SupportCard[]>([]);
  const [bulkProgress, setBulkProgress] = useState<{ current: number; total: number } | null>(null);

  // Order loading state
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderSearch, setOrderSearch] = useState('');

  // Error state - Requirements: 4.4
  const [error, setError] = useState<GenerationError | null>(null);

  /**
   * Fetch orders for bulk selection
   */
  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const result = await orderService.getOrders({
        page: 1,
        limit: 50,
        filters: {
          ...DEFAULT_ORDER_FILTERS,
          search: orderSearch,
        },
      });
      setOrders(result.orders);
    } catch (err) {
      logger.error('Failed to fetch orders:', err, 'SupportCards');
      toast.error('Failed to load orders');
    } finally {
      setOrdersLoading(false);
    }
  }, [orderSearch]);

  // Fetch orders on mount and when search changes
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  /**
   * Generate support card for a single order
   * Requirements: 4.1
   */
  const handleSingleGenerate = useCallback(async () => {
    if (!singleOrderId.trim()) {
      setError({ message: 'Please enter an order ID' });
      return;
    }

    setError(null);
    setSingleGenerating(true);
    setSingleSupportCard(null);

    try {
      const supportCard = await supportCardService.generateSingle(singleOrderId.trim());
      setSingleSupportCard(supportCard);
      toast.success('Support card generated successfully');
    } catch (err) {
      // Requirements: 4.4 - Display specific error messages
      const error = err as { response?: { data?: { message?: string } }; message?: string }
      const errorMessage = error.response?.data?.message || error.message || 'Failed to generate support card';
      setError({ message: errorMessage, orderId: singleOrderId });
      toast.error(errorMessage);
    } finally {
      setSingleGenerating(false);
    }
  }, [singleOrderId]);

  /**
   * Toggle order selection for bulk generation
   */
  const toggleOrderSelection = useCallback((orderId: string) => {
    setSelectedOrderIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  }, []);

  /**
   * Select all visible orders
   */
  const selectAllOrders = useCallback(() => {
    setSelectedOrderIds(new Set(orders.map((o) => o.orderId)));
  }, [orders]);

  /**
   * Clear all selections
   */
  const clearSelection = useCallback(() => {
    setSelectedOrderIds(new Set());
  }, []);

  /**
   * Generate support cards for selected orders in bulk
   * Requirements: 4.2
   */
  const handleBulkGenerate = useCallback(async () => {
    if (selectedOrderIds.size === 0) {
      setError({ message: 'Please select at least one order' });
      return;
    }

    setError(null);
    setBulkGenerating(true);
    setBulkSupportCards([]);
    setBulkProgress({ current: 0, total: selectedOrderIds.size });

    try {
      const orderIds = Array.from(selectedOrderIds);
      const supportCards = await supportCardService.generateBulk(orderIds);
      setBulkSupportCards(supportCards);
      setBulkProgress({ current: supportCards.length, total: orderIds.length });
      toast.success(`Generated ${supportCards.length} support cards`);
    } catch (err) {
      // Requirements: 4.4 - Handle API errors gracefully
      const error = err as { response?: { data?: { message?: string } }; message?: string }
      const errorMessage = error.response?.data?.message || error.message || 'Failed to generate support cards';
      setError({ message: errorMessage });
      toast.error(errorMessage);
    } finally {
      setBulkGenerating(false);
      setBulkProgress(null);
    }
  }, [selectedOrderIds]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <DashboardLayout userRole="shop_owner">
      <WidgetGate
        requiredPlan="pro"
        currentPlan={plan}
        featureName="Support Card Generator"
        featureDescription="Generate QR code support cards for orders to enable easy customer complaint submission"
      >
        <div className="p-6 space-y-8">
          {/* Page Header */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Support Card Generator
            </h1>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
              Generate QR code support cards for your orders
            </p>
          </div>

          {/* Error Display - Requirements: 4.4 */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800 dark:text-red-200">
                  Generation Failed
                </p>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  {error.message}
                  {error.orderId && ` (Order: ${error.orderId})`}
                </p>
              </div>
              <button
                onClick={clearError}
                className="text-red-500 hover:text-red-700 dark:hover:text-red-300"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Single Order Generation - Requirements: 4.1 */}
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Single Order Generation
            </h2>
            <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
              Generate a support card for a specific order by entering its ID.
            </p>

            <div className="flex gap-3">
              <div className="flex-1">
                <input
                  type="text"
                  value={singleOrderId}
                  onChange={(e) => setSingleOrderId(e.target.value)}
                  placeholder="Enter Order ID (e.g., ORD-12345)"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={singleGenerating}
                />
              </div>
              <button
                onClick={handleSingleGenerate}
                disabled={singleGenerating || !singleOrderId.trim()}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
              >
                {singleGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <QrCodeIcon className="w-5 h-5" />
                    Generate
                  </>
                )}
              </button>
            </div>

            {/* Single QR Code Display */}
            {singleSupportCard && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-slate-700">
                <QRCodeDisplay supportCard={singleSupportCard} />
              </div>
            )}
          </div>

          {/* Bulk Order Generation - Requirements: 4.2 */}
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Bulk Generation
            </h2>
            <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
              Select multiple orders to generate support cards in bulk.
            </p>

            {/* Search and Actions */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  placeholder="Search orders..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={selectAllOrders}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
                >
                  Select All
                </button>
                <button
                  onClick={clearSelection}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Order Selection List */}
            <div className="border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden mb-4">
              <div className="max-h-64 overflow-y-auto">
                {ordersLoading ? (
                  <div className="p-8 text-center">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-sm text-gray-500 dark:text-slate-400">Loading orders...</p>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-sm text-gray-500 dark:text-slate-400">No orders found</p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-slate-700/50 sticky top-0">
                      <tr>
                        <th className="w-12 px-4 py-3 text-left">
                          <span className="sr-only">Select</span>
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                          Order ID
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                      {orders.map((order) => (
                        <tr
                          key={order._id}
                          onClick={() => toggleOrderSelection(order.orderId)}
                          className={`cursor-pointer transition-colors ${
                            selectedOrderIds.has(order.orderId)
                              ? 'bg-blue-50 dark:bg-blue-900/20'
                              : 'hover:bg-gray-50 dark:hover:bg-slate-700/50'
                          }`}
                        >
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedOrderIds.has(order.orderId)}
                              onChange={() => toggleOrderSelection(order.orderId)}
                              className="w-4 h-4 text-blue-600 border-gray-300 dark:border-slate-600 rounded focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                            {order.orderId}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-slate-300">
                            {order.clientInfo.name}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              order.status === 'confirmed'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                : order.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                : 'bg-gray-100 text-gray-800 dark:bg-slate-700 dark:text-slate-300'
                            }`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500 dark:text-slate-400">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Generate Button with Progress */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500 dark:text-slate-400">
                {selectedOrderIds.size} order{selectedOrderIds.size !== 1 ? 's' : ''} selected
              </p>
              <button
                onClick={handleBulkGenerate}
                disabled={bulkGenerating || selectedOrderIds.size === 0}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
              >
                {bulkGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {bulkProgress
                      ? `Generating ${bulkProgress.current}/${bulkProgress.total}...`
                      : 'Generating...'}
                  </>
                ) : (
                  <>
                    <QrCodeIcon className="w-5 h-5" />
                    Generate Support Cards
                  </>
                )}
              </button>
            </div>

            {/* Bulk QR Codes Display - Requirements: 4.3 */}
            {bulkSupportCards.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    Generated {bulkSupportCards.length} support cards
                  </span>
                </div>
                <QRCodeDisplay supportCards={bulkSupportCards} />
              </div>
            )}
          </div>
        </div>
      </WidgetGate>
    </DashboardLayout>
  );
}
