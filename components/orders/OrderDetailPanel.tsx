'use client'

import React, { Fragment, useEffect, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { clsx } from 'clsx'
import type { Order, OrderStatus, CallHistoryEntry } from '@/types/order'
import StatusBadge, { getTranslatedStatusLabels } from '@/components/ui/StatusBadge'
import { useLanguage } from '@/hooks/useLanguage'
import type { TranslationKey } from '@/lib/i18n'
import CallFeedbackAnalysis from './CallFeedbackAnalysis'
import AIScoreColumn from '@/components/orders/AIScoreColumn'
import { formatCurrency } from '@/lib/formatCurrency'
import deliveryTrackingService, {
  type DeliveryShipmentTracking,
} from '@/services/deliveryTrackingService'

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
 * Format date/time for display
 */
function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('fr-FR', {
    year: 'numeric',
    month: 'long',
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
function getCallResultDisplay(
  result: CallHistoryEntry['result']
): { label: string; color: string } {
  const resultMap: Record<
    NonNullable<CallHistoryEntry['result']>,
    { label: string; color: string }
  > = {
    confirmed: {
      label: 'Confirmée',
      color: 'text-green-600 dark:text-green-400',
    },
    rejected: {
      label: 'Refusée',
      color: 'text-red-600 dark:text-red-400',
    },
    no_answer: {
      label: 'Pas de réponse',
      color: 'text-yellow-600 dark:text-yellow-400',
    },
    busy: {
      label: 'Occupé',
      color: 'text-orange-600 dark:text-orange-400',
    },
    unreachable: {
      label: 'Injoignable',
      color: 'text-red-600 dark:text-red-400',
    },
    callback_requested: {
      label: 'Souhaite être rappelé',
      color: 'text-blue-600 dark:text-blue-400',
    },
    interrupted: {
      label: 'Appel interrompu',
      color: 'text-orange-600 dark:text-orange-400',
    },
    other: {
      label: 'Autre',
      color: 'text-gray-600 dark:text-gray-400',
    },
    voicemail: {
      label: 'Messagerie',
      color: 'text-purple-600 dark:text-purple-400',
    },
  }

  if (!result) {
    return {
      label: 'Non renseigné',
      color: 'text-gray-500 dark:text-gray-400',
    }
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
    <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-1.5">
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
    <div className="py-2.5 border-b border-gray-200 dark:border-slate-700" data-testid="customer-info-section">
      <SectionHeader title={t('orderDetail.customerInfo')} />
      <dl className="space-y-1">
        <div className="grid grid-cols-[140px_1fr] gap-2 items-start">
          <dt className="text-sm text-gray-500 dark:text-slate-400">{t('orderDetail.customerName')}</dt>
          <dd className="text-sm font-medium text-gray-900 dark:text-white text-right break-words">{clientInfo.name}</dd>
        </div>
        <div className="grid grid-cols-[140px_1fr] gap-2 items-start">
          <dt className="text-sm text-gray-500 dark:text-slate-400">{t('orderDetail.customerPhone')}</dt>
          <dd className="text-sm font-medium text-gray-900 dark:text-white text-right break-words">{clientInfo.phone}</dd>
        </div>
        {clientInfo.email && (
          <div className="grid grid-cols-[140px_1fr] gap-2 items-start">
            <dt className="text-sm text-gray-500 dark:text-slate-400">{t('orderDetail.customerEmail')}</dt>
            <dd className="text-sm font-medium text-gray-900 dark:text-white text-right break-all">{clientInfo.email}</dd>
          </div>
        )}
      </dl>
    </div>
  )
}

/**
 * AI Score Section
 * Displays the confidence score generated by the backend scoring engine.
 */
function AIScoreSection({ order }: { order: Order }) {
  const [showAiDetails, setShowAiDetails] = useState(false)

  if (typeof order.aiScore !== 'number') {
    return null
  }

  const riskConfig = {
    critical: {
      label: 'Critique',
      badge: 'bg-red-200 text-red-800 dark:bg-red-950/40 dark:text-red-300',
      bar: 'bg-red-700',
    },
    high: {
      label: 'Élevé',
      badge: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
      bar: 'bg-red-500',
    },
    medium: {
      label: 'Modéré',
      badge: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400',
      bar: 'bg-orange-500',
    },
    low: {
      label: 'Faible',
      badge: 'bg-lime-100 text-lime-700 dark:bg-lime-500/15 dark:text-lime-400',
      bar: 'bg-lime-500',
    },
    very_low: {
      label: 'Très faible',
      badge: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400',
      bar: 'bg-green-600',
    },
  } as const

  const decisionConfig = {
    accept: {
      label: 'Expédition recommandée',
      className: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400',
    },
    review: {
      label: 'Décision du vendeur',
      className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400',
    },
    reject: {
      label: 'Expédition déconseillée',
      className: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
    },
  } as const

  const risk = order.riskLevel ? riskConfig[order.riskLevel] : null
  const decision = order.aiDecision ? decisionConfig[order.aiDecision] : null

  const formatFactorValue = (
    value: string | number | boolean | null
  ): string => {
    if (value === null || value === '') return '-'
    if (typeof value === 'boolean') return value ? 'Oui' : 'Non'
    return String(value)
  }

  return (
    <div
      className="py-2.5 border-b border-gray-200 dark:border-slate-700"
      data-testid="ai-score-section"
    >
      <SectionHeader title="Analyse IA" />

      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-slate-700 dark:bg-slate-900/50">
        <div className="space-y-1">
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-slate-400">
              Score IA
            </p>

            <AIScoreColumn
              score={order.aiScore}
              showDetails={false}
              size="lg"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {risk && (
              <div>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  Niveau de risque
                </p>
                <span
                  className={clsx(
                    'mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold',
                    risk.badge
                  )}
                >
                  {risk.label}
                </span>
              </div>
            )}

            {decision && (
              <div>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  Décision IA
                </p>
                <span
                  className={clsx(
                    'mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold',
                    decision.className
                  )}
                >
                  {decision.label}
                </span>
              </div>
            )}
          </div>
        </div>

        {order.aiScoredAt && (
          <div className="mt-2 border-t border-gray-200 pt-2 dark:border-slate-700">
            <p className="text-xs text-gray-500 dark:text-slate-400">
              Analyse effectuée le
            </p>
            <p className="mt-0.5 text-sm font-medium text-gray-900 dark:text-white">
              {formatDateTime(order.aiScoredAt)}
            </p>
          </div>
        )}

          <button
            type="button"
            onClick={() => setShowAiDetails((current) => !current)}
            className="mt-2 flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-left text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700/70"
            aria-expanded={showAiDetails}
          >
            <span>{showAiDetails ? 'Masquer les détails IA' : 'Voir les détails IA'}</span>
            <svg
              className={clsx(
                'h-4 w-4 transition-transform duration-200',
                showAiDetails && 'rotate-180'
              )}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {showAiDetails && (
            <div className="mt-2">
          {order.addressFindings && order.addressFindings.length > 0 && (
            <div className="mt-2 border-t border-gray-200 pt-2 dark:border-slate-700">
              <div className="mb-2">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  Qualité de l’adresse
                </p>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">
                  Constats IA basés sur les informations d’adresse disponibles.
                </p>
              </div>

              <div className="space-y-1">
                {order.addressFindings.map((finding) => {
                  const isPositive = finding.level === 'positive'
                  const isAlert = finding.level === 'alert'

                  const levelLabel = isPositive
                    ? 'Positif'
                    : isAlert
                      ? 'Alerte'
                      : 'Neutre'

                  const impactLabel =
                    finding.impact === 'positive'
                      ? 'Impact positif'
                      : finding.impact === 'negative'
                        ? 'Impact négatif'
                        : 'Impact neutre'

                  return (
                    <div
                      key={finding.key}
                      className={clsx(
                        'rounded-lg border px-2.5 py-2',
                        isPositive &&
                          'border-green-200 bg-green-50/60 dark:border-green-500/20 dark:bg-green-500/5',
                        isAlert &&
                          'border-red-200 bg-red-50/60 dark:border-red-500/20 dark:bg-red-500/5',
                        !isPositive &&
                          !isAlert &&
                          'border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-800'
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start">

                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {finding.description}
                            </p>
                            <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">
                              {impactLabel}
                            </p>
                          </div>
                        </div>

                        <span
                          className={clsx(
                            'shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold',
                            isPositive &&
                              'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400',
                            isAlert &&
                              'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
                            !isPositive &&
                              !isAlert &&
                              'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-300'
                          )}
                        >
                          {levelLabel}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {order.regionFindings && order.regionFindings.length > 0 && (
            <div className="mt-2 border-t border-gray-200 pt-2 dark:border-slate-700">
              <div className="mb-2">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  Zone géographique
                </p>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">
                  Constats IA basés sur l’historique CONFIRMED de la zone.
                </p>
              </div>

              <div className="space-y-1">
                {order.regionFindings.map((finding) => {
                  const isPositive = finding.level === 'positive'
                  const isAlert = finding.level === 'alert'

                  const levelLabel = isPositive
                    ? 'Positif'
                    : isAlert
                      ? 'Alerte'
                      : 'Neutre'

                  const impactLabel =
                    finding.impact === 'positive'
                      ? 'Impact positif'
                      : finding.impact === 'negative'
                        ? 'Impact négatif'
                        : 'Impact neutre'

                  return (
                    <div
                      key={finding.key}
                      className={clsx(
                        'rounded-lg border px-2.5 py-2',
                        isPositive &&
                          'border-green-200 bg-green-50/60 dark:border-green-500/20 dark:bg-green-500/5',
                        isAlert &&
                          'border-red-200 bg-red-50/60 dark:border-red-500/20 dark:bg-red-500/5',
                        !isPositive &&
                          !isAlert &&
                          'border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-800'
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start">

                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {finding.description}
                            </p>

                            <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">
                              {impactLabel}
                            </p>
                          </div>
                        </div>

                        <span
                          className={clsx(
                            'shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold',
                            isPositive &&
                              'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400',
                            isAlert &&
                              'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
                            !isPositive &&
                              !isAlert &&
                              'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-300'
                          )}
                        >
                          {levelLabel}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {order.orderValueFindings && order.orderValueFindings.length > 0 && (
            <div className="mt-2 border-t border-gray-200 pt-2 dark:border-slate-700">
              <div className="mb-2">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  Valeur de la commande
                </p>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">
                  Constats IA basés sur le montant actuel et l’historique disponible.
                </p>
              </div>

              <div className="space-y-1">
                {order.orderValueFindings.map((finding) => {
                  const isPositive = finding.level === 'positive'
                  const isAlert = finding.level === 'alert'

                  const levelLabel = isPositive
                    ? 'Positif'
                    : isAlert
                      ? 'Alerte'
                      : 'Neutre'

                  const impactLabel =
                    finding.impact === 'positive'
                      ? 'Impact positif'
                      : finding.impact === 'negative'
                        ? 'Impact négatif'
                        : 'Impact neutre'

                  return (
                    <div
                      key={finding.key}
                      className={clsx(
                        'rounded-lg border px-2.5 py-2',
                        isPositive &&
                          'border-green-200 bg-green-50/60 dark:border-green-500/20 dark:bg-green-500/5',
                        isAlert &&
                          'border-red-200 bg-red-50/60 dark:border-red-500/20 dark:bg-red-500/5',
                        !isPositive &&
                          !isAlert &&
                          'border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-800'
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start">

                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {finding.description}
                            </p>

                            <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">
                              {impactLabel}
                            </p>
                          </div>
                        </div>

                        <span
                          className={clsx(
                            'shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold',
                            isPositive &&
                              'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400',
                            isAlert &&
                              'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
                            !isPositive &&
                              !isAlert &&
                              'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-300'
                          )}
                        >
                          {levelLabel}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {order.orderTimeFindings && order.orderTimeFindings.length > 0 && (
            <div className="mt-2 border-t border-gray-200 pt-2 dark:border-slate-700">
              <div className="mb-2">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  Heure de commande
                </p>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">
                  Constats IA basés sur les habitudes horaires observées.
                </p>
              </div>

              <div className="space-y-1">
                {order.orderTimeFindings.map((finding) => {
                  const isPositive = finding.level === 'positive'
                  const isAlert = finding.level === 'alert'

                  const levelLabel = isPositive
                    ? 'Positif'
                    : isAlert
                      ? 'Alerte'
                      : 'Neutre'

                  const impactLabel =
                    finding.impact === 'positive'
                      ? 'Impact positif'
                      : finding.impact === 'negative'
                        ? 'Impact négatif'
                        : 'Impact neutre'

                  return (
                    <div
                      key={finding.key}
                      className={clsx(
                        'rounded-lg border px-2.5 py-2',
                        isPositive &&
                          'border-green-200 bg-green-50/60 dark:border-green-500/20 dark:bg-green-500/5',
                        isAlert &&
                          'border-red-200 bg-red-50/60 dark:border-red-500/20 dark:bg-red-500/5',
                        !isPositive &&
                          !isAlert &&
                          'border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-800'
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start">

                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {finding.description}
                            </p>
                            <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">
                              {impactLabel}
                            </p>
                          </div>
                        </div>

                        <span
                          className={clsx(
                            'shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold',
                            isPositive &&
                              'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400',
                            isAlert &&
                              'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
                            !isPositive &&
                              !isAlert &&
                              'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-300'
                          )}
                        >
                          {levelLabel}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {order.customerFindings && order.customerFindings.length > 0 && (
            <div className="mt-2 border-t border-gray-200 pt-2 dark:border-slate-700">
              <div className="mb-2">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  Historique du client
                </p>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">
                  Constats IA basés sur l’historique CONFIRMED du client.
                </p>
              </div>

              <div className="space-y-1">
                {order.customerFindings.map((finding) => {
                  const isPositive = finding.level === 'positive'
                  const isAlert = finding.level === 'alert'

                  const levelLabel = isPositive
                    ? 'Positif'
                    : isAlert
                      ? 'Alerte'
                      : 'Neutre'

                  const impactLabel =
                    finding.impact === 'positive'
                      ? 'Impact positif'
                      : finding.impact === 'negative'
                        ? 'Impact négatif'
                        : 'Impact neutre'

                  return (
                    <div
                      key={finding.key}
                      className={clsx(
                        'rounded-lg border px-2.5 py-2',
                        isPositive &&
                          'border-green-200 bg-green-50/60 dark:border-green-500/20 dark:bg-green-500/5',
                        isAlert &&
                          'border-red-200 bg-red-50/60 dark:border-red-500/20 dark:bg-red-500/5',
                        !isPositive &&
                          !isAlert &&
                          'border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-800'
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start">

                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {finding.description}
                            </p>

                            <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">
                              {impactLabel}
                            </p>
                          </div>
                        </div>

                        <span
                          className={clsx(
                            'shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold',
                            isPositive &&
                              'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400',
                            isAlert &&
                              'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
                            !isPositive &&
                              !isAlert &&
                              'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-300'
                          )}
                        >
                          {levelLabel}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        {order.customerHistory && (
          <div className="mt-2 border-t border-gray-200 pt-2 dark:border-slate-700">
            <div className="mb-2">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                Historique client
              </p>

              {order.customerHistory.isNewCustomer && (
                <p className="mt-0.5 text-xs text-orange-600 dark:text-orange-400">
                  Nouveau client — historique encore limité.
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-lg bg-gray-50 p-3 dark:bg-slate-800">
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  Commandes
                </p>
                <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                  {order.customerHistory.totalOrders}
                </p>
              </div>

              <div className="rounded-lg bg-green-50 p-3 dark:bg-green-500/5">
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  Livraisons réussies
                </p>
                <p className="mt-1 text-lg font-semibold text-green-700 dark:text-green-400">
                  {order.customerHistory.successfulDeliveries}
                </p>
              </div>

              <div className="rounded-lg bg-red-50 p-3 dark:bg-red-500/5">
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  Échecs
                </p>
                <p className="mt-1 text-lg font-semibold text-red-700 dark:text-red-400">
                  {order.customerHistory.failedDeliveries}
                </p>
              </div>

              <div className="rounded-lg bg-gray-50 p-3 dark:bg-slate-800">
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  Taux de réussite
                </p>
                <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                  {order.customerHistory.successRate !== null
                    ? `${order.customerHistory.successRate}%`
                    : '—'}
                </p>
              </div>

              <div className="rounded-lg bg-gray-50 p-3 dark:bg-slate-800">
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  Client depuis
                </p>
                <p className="mt-0.5 text-sm font-medium text-gray-900 dark:text-white">
                  {order.customerHistory.customerSince
                    ? new Date(order.customerHistory.customerSince).toLocaleDateString('fr-FR', {
                        month: 'long',
                        year: 'numeric',
                      })
                    : '—'}
                </p>
              </div>

              <div className="rounded-lg bg-gray-50 p-3 dark:bg-slate-800">
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  Dernière commande
                </p>
                <p className="mt-0.5 text-sm font-medium text-gray-900 dark:text-white">
                  {order.customerHistory.lastOrderAt
                    ? formatDateTime(order.customerHistory.lastOrderAt)
                    : '—'}
                </p>
              </div>
            </div>
          </div>
        )}

        {order.aiSummary && (
          <div className="mt-2 border-t border-gray-200 pt-2 dark:border-slate-700">
            <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 dark:border-blue-500/20 dark:bg-blue-500/5">
              <div className="mb-3">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  Résumé IA
                </p>
              </div>

              <p className="text-sm leading-6 text-gray-700 dark:text-slate-300">
                {order.aiSummary.introduction}
              </p>

              {order.aiSummary.positiveFactors.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-green-700 dark:text-green-400">
                    Éléments favorables
                  </p>

                  <ul className="mt-2 space-y-1.5">
                    {order.aiSummary.positiveFactors.map((factor, index) => (
                      <li
                        key={`${factor.key}-${index}`}
                        className="flex items-start gap-2 text-sm text-gray-700 dark:text-slate-300"
                      >
                        <span className="mt-0.5 font-bold text-green-600 dark:text-green-400">
                          ✓
                        </span>
                        <span>
                          {factor.label} — {formatFactorValue(factor.value)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {order.aiSummary.warningFactors.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-red-700 dark:text-red-400">
                    Points de vigilance
                  </p>

                  <ul className="mt-2 space-y-1.5">
                    {order.aiSummary.warningFactors.map((factor, index) => (
                      <li
                        key={`${factor.key}-${index}`}
                        className="flex items-start gap-2 text-sm text-gray-700 dark:text-slate-300"
                      >
                        <span className="mt-0.5 font-bold text-red-600 dark:text-red-400">
                          ⚠
                        </span>
                        <span>
                          {factor.label} — {formatFactorValue(factor.value)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-4 border-t border-blue-200 pt-3 dark:border-blue-500/20">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {order.aiSummary.conclusion}
                </p>

                <p className="mt-2 text-sm text-gray-700 dark:text-slate-300">
                  Recommandation :{' '}
                  <span className="font-semibold">
                    {order.aiSummary.recommendation}
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}

            </div>
          )}

      </div>
    </div>

  )
}

/**
 * Order Items Section
 * Displays list of items with quantity and price
 */
function OrderItemsSection({ order, t }: { order: Order; t: (key: TranslationKey) => string }) {
  return (
    <div className="py-2.5 border-b border-gray-200 dark:border-slate-700" data-testid="order-items-section">
      <SectionHeader title={t('orderDetail.orderItems')} />
      <ul className="space-y-1.5">
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
      <div className="mt-2 pt-2 border-t border-gray-200 dark:border-slate-700 flex justify-between">
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
  const governorate = address?.state || order.region || ''
  
  if (!address) {
    return null
  }
  
  return (
    <div className="py-2.5 border-b border-gray-200 dark:border-slate-700" data-testid="delivery-address-section">
      <SectionHeader title={t('orderDetail.deliveryAddress')} />
      <dl className="space-y-1 text-sm">
        {address.street && (
          <div className="grid grid-cols-[110px_1fr] gap-2 items-start">
            <dt className="text-gray-500 dark:text-slate-400">Adresse</dt>
            <dd className="text-right text-gray-700 dark:text-slate-300 break-words">
              {address.street}
            </dd>
          </div>
        )}

        {address.city && (
          <div className="grid grid-cols-[110px_1fr] gap-2 items-start">
            <dt className="text-gray-500 dark:text-slate-400">Ville</dt>
            <dd className="text-right text-gray-700 dark:text-slate-300">
              {address.city}
            </dd>
          </div>
        )}

        <div className="grid grid-cols-[110px_1fr] gap-2 items-start">
          <dt className="text-gray-500 dark:text-slate-400">Gouvernorat</dt>
          <dd className="text-right font-medium text-gray-900 dark:text-white">
            {governorate || '—'}
          </dd>
        </div>

        {address.district && (
          <div className="grid grid-cols-[110px_1fr] gap-2 items-start">
            <dt className="text-gray-500 dark:text-slate-400">Délégation</dt>
            <dd className="text-right text-gray-700 dark:text-slate-300">
              {address.district}
            </dd>
          </div>
        )}

        {address.zipCode && (
          <div className="grid grid-cols-[110px_1fr] gap-2 items-start">
            <dt className="text-gray-500 dark:text-slate-400">Code postal</dt>
            <dd className="text-right text-gray-700 dark:text-slate-300">
              {address.zipCode}
            </dd>
          </div>
        )}

        {address.country && (
          <div className="grid grid-cols-[110px_1fr] gap-2 items-start">
            <dt className="text-gray-500 dark:text-slate-400">Pays</dt>
            <dd className="text-right text-gray-700 dark:text-slate-300">
              {address.country}
            </dd>
          </div>
        )}
      </dl>
    </div>
  )
}


function formatDeliveryProviderName(
  provider?: string | null
): string {
  if (!provider) {
    return '—'
  }

  return provider
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map(
      part =>
        part.charAt(0).toUpperCase() +
        part.slice(1).toLowerCase()
    )
    .join(' ')
}

/**
 * Suivi logistique générique.
 *
 * Les données proviennent uniquement de DeliveryShipment
 * dans Confirmed. Aucun appel direct Intigo / transporteur
 * n'est effectué depuis le navigateur.
 */
function DeliveryTrackingSection({
  order,
  t,
}: {
  order: Order
  t: (key: TranslationKey) => string
}) {
  const [
    tracking,
    setTracking,
  ] = useState<DeliveryShipmentTracking[]>([])

  const [
    isLoading,
    setIsLoading,
  ] = useState(true)

  const [
    error,
    setError,
  ] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    setTracking([])
    setError(null)
    setIsLoading(true)

    deliveryTrackingService
      .getOrderTracking(order._id)
      .then(items => {
        if (active) {
          setTracking(items)
        }
      })
      .catch(() => {
        if (active) {
          setError(
            'Le suivi transporteur est momentanément indisponible.'
          )
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [order._id])

  const fallbackProvider =
    order.deliveryInfo?.carrier ||
    order.deliveryInfo?.courier ||
    null

  const fallbackTrackingNumber =
    order.deliveryInfo?.trackingNumber ||
    null

  const displayEntries =
    tracking.length > 0
      ? tracking.map(item => ({
          key:
            item.shipmentId,

          provider:
            item.provider,

          trackingNumber:
            item.trackingNumber,

          providerStatusCode:
            item.providerStatusCode,

          providerStatusLabel:
            item.providerStatusLabel,

          lastSyncedAt:
            item.lastSyncedAt,
        }))
      : (
          fallbackProvider ||
          fallbackTrackingNumber
        )
        ? [
            {
              key:
                `order-${order._id}`,

              provider:
                fallbackProvider,

              trackingNumber:
                fallbackTrackingNumber,

              providerStatusCode:
                null,

              providerStatusLabel:
                null,

              lastSyncedAt:
                null,
            },
          ]
        : []

  if (
    !isLoading &&
    displayEntries.length === 0 &&
    !error
  ) {
    return null
  }

  if (
    isLoading &&
    displayEntries.length === 0
  ) {
    return null
  }

  return (
    <div
      className="py-2.5 border-b border-gray-200 dark:border-slate-700"
      data-testid="delivery-tracking-section"
    >
      <SectionHeader title="Suivi de livraison" />

      <div className="space-y-3">
        {displayEntries.map(
          entry => {
            const status =
              entry.providerStatusLabel ||
              (
                entry.providerStatusCode != null
                  ? String(
                      entry.providerStatusCode
                    )
                  : null
              )

            return (
              <dl
                key={entry.key}
                className="space-y-1 text-sm"
              >
                <div className="grid grid-cols-[140px_1fr] gap-2 items-start">
                  <dt className="text-gray-500 dark:text-slate-400">
                    {t('orderDetail.courier')}
                  </dt>

                  <dd className="text-right font-medium text-gray-900 dark:text-white">
                    {formatDeliveryProviderName(
                      entry.provider
                    )}
                  </dd>
                </div>

                {entry.trackingNumber && (
                  <div className="grid grid-cols-[140px_1fr] gap-2 items-start">
                    <dt className="text-gray-500 dark:text-slate-400">
                      {t('orderDetail.tracking')}
                    </dt>

                    <dd className="text-right font-mono text-gray-900 dark:text-white break-all">
                      {entry.trackingNumber}
                    </dd>
                  </div>
                )}

                {status && (
                  <div className="grid grid-cols-[140px_1fr] gap-2 items-start">
                    <dt className="text-gray-500 dark:text-slate-400">
                      Statut transporteur
                    </dt>

                    <dd className="text-right font-medium text-gray-900 dark:text-white">
                      {status}

                      {entry.providerStatusLabel &&
                        entry.providerStatusCode != null && (
                          <span className="ml-1 text-xs font-normal text-gray-500 dark:text-slate-400">
                            ({String(
                              entry.providerStatusCode
                            )})
                          </span>
                        )}
                    </dd>
                  </div>
                )}

                {entry.lastSyncedAt && (
                  <div className="grid grid-cols-[140px_1fr] gap-2 items-start">
                    <dt className="text-gray-500 dark:text-slate-400">
                      Dernière synchronisation
                    </dt>

                    <dd className="text-right text-gray-700 dark:text-slate-300">
                      {formatDateTime(
                        entry.lastSyncedAt
                      )}
                    </dd>
                  </div>
                )}
              </dl>
            )
          }
        )}

        {isLoading && (
          <p className="text-xs text-gray-500 dark:text-slate-400">
            Actualisation du suivi…
          </p>
        )}

        {error && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            {error}
          </p>
        )}
      </div>
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
      <div
        className="py-2.5 border-b border-gray-200 dark:border-slate-700"
        data-testid="call-history-section"
      >
        <SectionHeader title={t('orderDetail.callHistory')} />
        <p className="text-sm text-gray-500 dark:text-slate-400">
          {t('orderDetail.noCallHistory')}
        </p>
      </div>
    )
  }

  
  return (
    <div className="py-2.5 border-b border-gray-200 dark:border-slate-700" data-testid="call-history-section">
      <SectionHeader title={t('orderDetail.callHistory')} />
      <div className="space-y-1">
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
                  {entry.operatorName ||
                      (typeof entry.operatorId === 'object' && entry.operatorId
                        ? [entry.operatorId.firstName, entry.operatorId.lastName]
                            .filter(Boolean)
                            .join(' ') ||
                          entry.operatorId.name ||
                          entry.operatorId.email ||
                          'Opérateur'
                        : `Operator ${entry.operatorId}`)}
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
                <Dialog.Panel className="pointer-events-auto w-screen max-w-xl sm:max-w-2xl">
                  <div className="flex h-full flex-col bg-white dark:bg-slate-800 shadow-xl">
                    {/* Header */}
                    <div className="px-4 py-3 sm:px-5 border-b border-gray-200 dark:border-slate-700">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <Dialog.Title className="text-lg font-bold text-gray-900 dark:text-white break-all">
                            {t('orderDetail.order')} #{order.confirmedId}
                          </Dialog.Title>
                          <div className="mt-0.5 flex items-center gap-2">
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
                    <div className="flex-1 overflow-y-auto px-4 sm:px-5" data-testid="order-detail-content">
                      <CustomerInfoSection order={order} t={t} />
                      <CallHistorySection order={order} t={t} />
                      <OrderItemsSection order={order} t={t} />
                      <DeliveryAddressSection order={order} t={t} />
                      <DeliveryTrackingSection order={order} t={t} />
                      <AIScoreSection order={order} />
                      
                      {/* Retour d'appel structuré */}
                      <div className="py-2.5 border-b border-gray-200 dark:border-slate-700">
                        <SectionHeader title="Retour d'appel" />
                        <CallFeedbackAnalysis order={order} />
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
