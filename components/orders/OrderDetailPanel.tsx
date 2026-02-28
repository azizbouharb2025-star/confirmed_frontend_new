'use client'

import React, { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { clsx } from 'clsx'
import type { Order, OrderStatus, CallHistoryEntry } from '@/types/order'
import StatusBadge, { getTranslatedStatusLabels } from '@/components/ui/StatusBadge'
import { useLanguage } from '@/hooks/useLanguage'
import type { TranslationKey } from '@/lib/i18n'
import FeedbackDisplay from './FeedbackDisplay'

/**
 * OrderDetailPanel Component
 * Slide-over panel showing complete order information
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 7.1, 7.6
 * Property 10: Order detail displays all required sections
 * Property 11: Call history displays required fields
 */

export interface OrderDetailPanelProps {
  order: Order | null
  isOpen: boolean
  onClose: () => void
}

/**
 * Format currency value
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-TN', {
    style: 'currency',
    currency: 'TND',
  }).format(amount)
}

/**
 * Format date/time for display
 */
function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Format call duration in minutes and seconds
 */
function formatDuration(seconds?: number): string {
  if (!seconds) return '-'
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}


/**
 * Order status progression for timeline
 */
const STATUS_PROGRESSION: OrderStatus[] = [
  'pending',
  'assigned',
  'in_progress',
  'confirmed',
]

/**
 * Get the call result display label and color
 */
function getCallResultDisplay(result: CallHistoryEntry['result']): { label: string; color: string } {
  const resultMap: Record<CallHistoryEntry['result'], { label: string; color: string }> = {
    confirmed: { label: 'Confirmed', color: 'text-green-600 dark:text-green-400' },
    rejected: { label: 'Rejected', color: 'text-red-600 dark:text-red-400' },
    no_answer: { label: 'No Answer', color: 'text-yellow-600 dark:text-yellow-400' },
    busy: { label: 'Busy', color: 'text-orange-600 dark:text-orange-400' },
    voicemail: { label: 'Voicemail', color: 'text-blue-600 dark:text-blue-400' },
  }
  return resultMap[result]
}

/**
 * Check if order detail has all required sections
 * Used for property testing (Property 10)
 */
export function hasRequiredSections(order: Order): {
  hasCustomerInfo: boolean
  hasOrderItems: boolean
  hasDeliveryAddress: boolean
  hasCallHistory: boolean
} {
  return {
    hasCustomerInfo: Boolean(order.clientInfo && order.clientInfo.name && order.clientInfo.phone),
    hasOrderItems: Boolean(order.items && order.items.length > 0),
    hasDeliveryAddress: Boolean(order.deliveryInfo?.address || order.clientInfo?.address),
    hasCallHistory: Boolean(order.callHistory),
  }
}

/**
 * Check if call history entry has all required fields
 * Used for property testing (Property 11)
 */
export function hasRequiredCallHistoryFields(entry: CallHistoryEntry): {
  hasOperatorName: boolean
  hasTimestamp: boolean
  hasOutcome: boolean
  hasNotes: boolean
} {
  return {
    hasOperatorName: Boolean(entry.operatorName || entry.operatorId),
    hasTimestamp: Boolean(entry.timestamp),
    hasOutcome: Boolean(entry.result),
    hasNotes: true, // Notes field is always present (can be empty)
  }
}


/**
 * Section Header Component
 */
function SectionHeader({ title }: { title: string }) {
  return (
    <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-3">
      {title}
    </h3>
  )
}

/**
 * Customer Information Section
 * Displays customer name, phone, email
 */
function CustomerInfoSection({ order, t }: { order: Order; t: (key: TranslationKey) => string }) {
  const { clientInfo } = order
  
  return (
    <div className="py-4 border-b border-gray-200 dark:border-slate-700" data-testid="customer-info-section">
      <SectionHeader title={t('orderDetail.customerInfo')} />
      <dl className="space-y-2">
        <div className="flex justify-between">
          <dt className="text-sm text-gray-500 dark:text-slate-400">{t('orderDetail.customerName')}</dt>
          <dd className="text-sm font-medium text-gray-900 dark:text-white">{clientInfo.name}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-sm text-gray-500 dark:text-slate-400">{t('orderDetail.customerPhone')}</dt>
          <dd className="text-sm font-medium text-gray-900 dark:text-white">{clientInfo.phone}</dd>
        </div>
        {clientInfo.email && (
          <div className="flex justify-between">
            <dt className="text-sm text-gray-500 dark:text-slate-400">{t('orderDetail.customerEmail')}</dt>
            <dd className="text-sm font-medium text-gray-900 dark:text-white">{clientInfo.email}</dd>
          </div>
        )}
      </dl>
    </div>
  )
}

/**
 * Order Items Section
 * Displays list of items with quantity and price
 */
function OrderItemsSection({ order, t }: { order: Order; t: (key: TranslationKey) => string }) {
  return (
    <div className="py-4 border-b border-gray-200 dark:border-slate-700" data-testid="order-items-section">
      <SectionHeader title={t('orderDetail.orderItems')} />
      <ul className="space-y-3">
        {order.items.map((item, index) => (
          <li key={`${item.productId}-${index}`} className="flex justify-between items-start">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{item.name}</p>
              {item.variant && (
                <p className="text-xs text-gray-500 dark:text-slate-400">{item.variant}</p>
              )}
              <p className="text-xs text-gray-500 dark:text-slate-400">{t('orderDetail.qty')}: {item.quantity}</p>
            </div>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {formatCurrency(item.price * item.quantity)}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-4 pt-3 border-t border-gray-200 dark:border-slate-700 flex justify-between">
        <span className="text-sm font-semibold text-gray-900 dark:text-white">{t('orderDetail.total')}</span>
        <span className="text-sm font-semibold text-gray-900 dark:text-white">
          {formatCurrency(order.totalAmount)}
        </span>
      </div>
    </div>
  )
}


/**
 * Delivery Address Section
 * Displays delivery address if available
 */
function DeliveryAddressSection({ order, t }: { order: Order; t: (key: TranslationKey) => string }) {
  const address = order.deliveryInfo?.address || order.clientInfo?.address
  
  if (!address) {
    return null
  }
  
  return (
    <div className="py-4 border-b border-gray-200 dark:border-slate-700" data-testid="delivery-address-section">
      <SectionHeader title={t('orderDetail.deliveryAddress')} />
      <address className="text-sm text-gray-700 dark:text-slate-300 not-italic">
        <p>{address.street}</p>
        <p>{address.city}, {address.state} {address.zipCode}</p>
        <p>{address.country}</p>
      </address>
      {order.deliveryInfo?.courier && (
        <div className="mt-3">
          <p className="text-xs text-gray-500 dark:text-slate-400">
            {t('orderDetail.courier')}: <span className="font-medium">{order.deliveryInfo.courier}</span>
          </p>
          {order.deliveryInfo.trackingNumber && (
            <p className="text-xs text-gray-500 dark:text-slate-400">
              {t('orderDetail.tracking')}: <span className="font-medium">{order.deliveryInfo.trackingNumber}</span>
            </p>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Call History Section
 * Displays timeline of call attempts with operator, timestamp, outcome, notes
 * Property 11: Call history displays required fields
 */
function CallHistorySection({ order, t }: { order: Order; t: (key: TranslationKey) => string }) {
  if (!order.callHistory || order.callHistory.length === 0) {
    return (
      <div className="py-4 border-b border-gray-200 dark:border-slate-700" data-testid="call-history-section">
        <SectionHeader title={t('orderDetail.callHistory')} />
        <p className="text-sm text-gray-500 dark:text-slate-400">{t('orderDetail.noCallHistory')}</p>
      </div>
    )
  }
  
  return (
    <div className="py-4 border-b border-gray-200 dark:border-slate-700" data-testid="call-history-section">
      <SectionHeader title={t('orderDetail.callHistory')} />
      <div className="space-y-4">
        {order.callHistory.map((entry, index) => {
          const resultDisplay = getCallResultDisplay(entry.result)
          return (
            <div
              key={`${entry.timestamp}-${index}`}
              className="relative pl-6 pb-4 last:pb-0"
              data-testid="call-history-entry"
            >
              {/* Timeline connector */}
              {index < order.callHistory.length - 1 && (
                <div className="absolute left-2 top-3 bottom-0 w-0.5 bg-gray-200 dark:bg-slate-700" />
              )}
              {/* Timeline dot */}
              <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-gray-200 dark:bg-slate-700 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-slate-500" />
              </div>
              
              <div className="space-y-1">
                {/* Operator name */}
                <p className="text-sm font-medium text-gray-900 dark:text-white" data-testid="call-operator">
                  {entry.operatorName || `Operator ${entry.operatorId}`}
                  <span className="ml-2 text-xs text-gray-500 dark:text-slate-400">
                    ({entry.callType === 'ai' ? t('orderDetail.aiCall') : t('orderDetail.humanCall')})
                  </span>
                </p>
                
                {/* Timestamp */}
                <p className="text-xs text-gray-500 dark:text-slate-400" data-testid="call-timestamp">
                  {formatDateTime(entry.timestamp)}
                  {entry.duration && ` • ${formatDuration(entry.duration)}`}
                </p>
                
                {/* Outcome */}
                <p className={clsx('text-sm font-medium', resultDisplay.color)} data-testid="call-outcome">
                  {resultDisplay.label}
                </p>
                
                {/* Notes */}
                {entry.notes && (
                  <p className="text-sm text-gray-600 dark:text-slate-400 mt-1" data-testid="call-notes">
                    {entry.notes}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}


/**
 * Status Timeline Section
 * Displays order status progression with current status highlighted
 * Requirements: 4.4
 */
function StatusTimelineSection({ order, t }: { order: Order; t: (key: TranslationKey) => string }) {
  const currentStatusIndex = STATUS_PROGRESSION.indexOf(order.status)
  const isTerminalStatus = order.status === 'rejected' || order.status === 'cancelled'
  const translatedLabels = getTranslatedStatusLabels(t)
  
  return (
    <div className="py-4" data-testid="status-timeline-section">
      <SectionHeader title={t('orderDetail.statusTimeline')} />
      <div className="flex items-center justify-between">
        {STATUS_PROGRESSION.map((status, index) => {
          const isCompleted = !isTerminalStatus && currentStatusIndex >= index
          const isCurrent = order.status === status
          
          return (
            <Fragment key={status}>
              {/* Status node */}
              <div className="flex flex-col items-center">
                <div
                  className={clsx(
                    'w-8 h-8 rounded-full flex items-center justify-center',
                    isCurrent
                      ? 'bg-[#ADFF2F] ring-4 ring-[#ADFF2F]/30'
                      : isCompleted
                      ? 'bg-green-500'
                      : 'bg-gray-200 dark:bg-slate-700'
                  )}
                  data-testid={`status-node-${status}`}
                  data-current={isCurrent}
                  data-completed={isCompleted}
                >
                  {isCompleted && !isCurrent && (
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {isCurrent && (
                    <div className="w-3 h-3 rounded-full bg-gray-900" />
                  )}
                </div>
                <span
                  className={clsx(
                    'mt-2 text-xs font-medium',
                    isCurrent
                      ? 'text-gray-900 dark:text-white'
                      : isCompleted
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-gray-400 dark:text-slate-500'
                  )}
                >
                  {translatedLabels[status]}
                </span>
              </div>
              
              {/* Connector line */}
              {index < STATUS_PROGRESSION.length - 1 && (
                <div
                  className={clsx(
                    'flex-1 h-0.5 mx-2',
                    !isTerminalStatus && currentStatusIndex > index
                      ? 'bg-green-500'
                      : 'bg-gray-200 dark:bg-slate-700'
                  )}
                />
              )}
            </Fragment>
          )
        })}
      </div>
      
      {/* Terminal status indicator */}
      {isTerminalStatus && (
        <div className="mt-4 flex items-center justify-center">
          <StatusBadge status={order.status} size="md" />
        </div>
      )}
    </div>
  )
}


/**
 * Close button icon
 */
function CloseIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

/**
 * OrderDetailPanel Component
 * Main slide-over panel for displaying order details
 */
export default function OrderDetailPanel({
  order,
  isOpen,
  onClose,
}: OrderDetailPanelProps) {
  const { t } = useLanguage()

  if (!order) {
    return null
  }

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-300"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-300"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                  <div className="flex h-full flex-col bg-white dark:bg-slate-800 shadow-xl">
                    {/* Header */}
                    <div className="px-4 py-4 sm:px-6 border-b border-gray-200 dark:border-slate-700">
                      <div className="flex items-start justify-between">
                        <div>
                          <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
                            {t('orderDetail.order')} {order.orderId}
                          </Dialog.Title>
                          <div className="mt-1 flex items-center gap-2">
                            <StatusBadge status={order.status} size="sm" />
                            <span className="text-sm text-gray-500 dark:text-slate-400">
                              {formatDateTime(order.createdAt)}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="rounded-md text-gray-400 hover:text-gray-500 dark:text-slate-400 dark:hover:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#ADFF2F]"
                          onClick={onClose}
                          data-testid="close-panel-button"
                        >
                          <span className="sr-only">{t('orderDetail.close')}</span>
                          <CloseIcon />
                        </button>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto px-4 sm:px-6" data-testid="order-detail-content">
                      <CustomerInfoSection order={order} t={t} />
                      <OrderItemsSection order={order} t={t} />
                      <DeliveryAddressSection order={order} t={t} />
                      <CallHistorySection order={order} t={t} />
                      
                      {/* Feedback Section */}
                      <div className="py-4 border-b border-gray-200 dark:border-slate-700">
                        <SectionHeader title={t('feedback.callFeedback')} />
                        <FeedbackDisplay orderId={order._id} />
                      </div>
                      
                      <StatusTimelineSection order={order} t={t} />
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}
