'use client'

import React, { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { clsx } from 'clsx'
import type { Order, OrderStatus, CallHistoryEntry } from '@/types/order'
import StatusBadge, { getTranslatedStatusLabels } from '@/components/ui/StatusBadge'
import { useLanguage } from '@/hooks/useLanguage'
import type { TranslationKey } from '@/lib/i18n'
import CallFeedbackAnalysis from './CallFeedbackAnalysis'
import AIScoreColumn from '@/components/orders/AIScoreColumn'
import { formatCurrency } from '@/lib/formatCurrency'
import { canDisplayOrderAI } from '@/lib/orderStatus'

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
  onEdit?: () => void
  showAdminContext?: boolean
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
    <div className="mb-3 flex items-center gap-2.5">
      <span className="h-5 w-1 rounded-full bg-[#ADFF2F] shadow-[0_0_12px_rgba(173,255,47,0.28)]" />

      <h3 className="text-[11px] font-bold uppercase tracking-[0.11em] text-slate-600 dark:text-slate-300">
        {title}
      </h3>
    </div>
  )
}

/**
 * Customer Information Section/**
 * Customer Information Section
 * Displays customer name, phone, email
 */
function CustomerInfoSection({ order, t }: { order: Order; t: (key: TranslationKey) => string }) {
  const { clientInfo } = order

  return (
    <section
      className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm dark:border-slate-700/80 dark:bg-slate-900/70"
      data-testid="customer-info-section"
    >
      <SectionHeader title={t('orderDetail.customerInfo')} />

      <div className="grid gap-2.5 sm:grid-cols-2">
        <div className="rounded-xl bg-slate-50 px-3.5 py-3 dark:bg-slate-800/70 sm:col-span-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400 dark:text-slate-500">
            {t('orderDetail.customerName')}
          </p>

          <p className="mt-1 text-base font-bold text-slate-950 dark:text-white">
            {clientInfo.name}
          </p>
        </div>

        <div className="rounded-xl bg-slate-50 px-3.5 py-3 dark:bg-slate-800/70">
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400 dark:text-slate-500">
            {t('orderDetail.customerPhone')}
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
            {clientInfo.phone}
          </p>
        </div>

        {clientInfo.email && (
          <div className="min-w-0 rounded-xl bg-slate-50 px-3.5 py-3 dark:bg-slate-800/70">
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400 dark:text-slate-500">
              {t('orderDetail.customerEmail')}
            </p>

            <p className="mt-1 break-all text-sm font-semibold text-slate-900 dark:text-white">
              {clientInfo.email}
            </p>
          </div>
        )}
      </div>
    </section>
  )
}

/**
 * AI Score Section/**
 * AI Score Section
 * Displays the confidence score generated by the backend scoring engine.
 */
function AIScoreSection({ order }: { order: Order }) {
  const [showAiDetails, setShowAiDetails] = useState(false)

  if (
    !canDisplayOrderAI(order.status) ||
    typeof order.aiScore !== 'number'
  ) {
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

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white via-slate-50/80 to-cyan-50/60 shadow-sm dark:border-slate-700/80 dark:from-slate-900 dark:via-slate-900 dark:to-cyan-950/20">
        <div className="border-b border-slate-200/80 px-4 py-4 dark:border-slate-700/70">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="mb-1.5 flex items-center gap-2">
                <span className="inline-flex h-2 w-2 rounded-full bg-cyan-500 shadow-[0_0_0_4px_rgba(6,182,212,0.10)]" />

                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-700 dark:text-cyan-400">
                  Intelligence Confirmed
                </p>
              </div>

              <p className="text-base font-bold text-gray-950 dark:text-white">
                Analyse de fiabilité
              </p>

              <p className="mt-1 max-w-md text-[11px] leading-5 text-gray-500 dark:text-slate-400">
                Lecture synthétique du niveau de confiance associé à cette commande.
              </p>
            </div>

            <span className="shrink-0 rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-cyan-700 dark:border-cyan-500/20 dark:bg-cyan-500/10 dark:text-cyan-400">
              Confirmed AI
            </span>
          </div>
        </div>

        <div className="p-4">
          <div className="rounded-xl border border-slate-200/80 bg-white/80 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800/60">
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400 dark:text-slate-500">
                  Score de confiance
                </p>

                <p className="mt-1 text-[11px] text-gray-500 dark:text-slate-400">
                  Évaluation globale basée sur les signaux disponibles
                </p>
              </div>

              {decision && (
                <span
                  className={clsx(
                    'hidden rounded-full px-2.5 py-1 text-[10px] font-bold sm:inline-flex',
                    decision.className
                  )}
                >
                  {decision.label}
                </span>
              )}
            </div>

            <AIScoreColumn
              score={order.aiScore}
              showDetails={false}
              size="lg"
            />
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2.5">
            {risk && (
              <div className="rounded-xl border border-slate-200/80 bg-white/60 px-3 py-3 dark:border-slate-700 dark:bg-slate-800/40">
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-400 dark:text-slate-500">
                  Niveau de risque
                </p>

                <div className="mt-2">
                  <span
                    className={clsx(
                      'inline-flex rounded-full px-2.5 py-1 text-xs font-bold',
                      risk.badge
                    )}
                  >
                    {risk.label}
                  </span>
                </div>
              </div>
            )}

            {decision && (
              <div className="rounded-xl border border-slate-200/80 bg-white/60 px-3 py-3 dark:border-slate-700 dark:bg-slate-800/40">
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-400 dark:text-slate-500">
                  Décision IA
                </p>

                <div className="mt-2">
                  <span
                    className={clsx(
                      'inline-flex rounded-full px-2.5 py-1 text-xs font-bold',
                      decision.className
                    )}
                  >
                    {decision.label}
                  </span>
                </div>
              </div>
            )}
          </div>

          {order.aiScoredAt && (
            <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-200/80 pt-3 dark:border-slate-700/70">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  <svg
                    className="h-3.5 w-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.8}
                  >
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5l3 2" />
                  </svg>
                </span>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-400 dark:text-slate-500">
                    Dernière analyse
                  </p>

                  <p className="mt-0.5 text-xs font-medium text-gray-700 dark:text-slate-300">
                    {formatDateTime(order.aiScoredAt)}
                  </p>
                </div>
              </div>

              <span className="text-[10px] font-medium text-gray-400 dark:text-slate-500">
                Mise à jour automatique
              </span>
            </div>
          )}
        </div>

          <button
            type="button"
            onClick={() => setShowAiDetails((current) => !current)}
            className="mx-4 mb-4 flex w-[calc(100%-2rem)] items-center justify-between rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-left text-sm font-semibold text-gray-800 transition hover:border-cyan-200 hover:bg-cyan-50/70 hover:text-cyan-800 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-200 dark:hover:border-cyan-500/30 dark:hover:bg-cyan-500/10 dark:hover:text-cyan-300"
            aria-expanded={showAiDetails}
          >
            <span>
              {showAiDetails ? 'Masquer l’analyse détaillée' : 'Voir l’analyse détaillée'}
            </span>
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
            <div className="mt-3 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
              <div className="border-b border-gray-200 bg-gray-50/80 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/45">
                <p className="text-[13px] font-bold uppercase tracking-[0.04em] text-gray-950 dark:text-white">
                  Qualité de l’adresse
                </p>
                <p className="mt-1 text-[11px] leading-4 text-gray-500 dark:text-slate-400">
                  Constats IA basés sur les informations d’adresse disponibles.
                </p>
              </div>

              <div className="space-y-2.5 p-3">
                {order.addressFindings.map((finding) => {
                  const isPositive = finding.level === 'positive'
                  const isAlert = finding.level === 'alert'

                  const isAddressDetail =
                    finding.key.startsWith('address_detail_')

                  const levelLabel = isAddressDetail
                    ? finding.impact === 'completeness'
                      ? 'Présent'
                      : finding.impact === 'incomplete'
                        ? 'Absent'
                        : 'Non pris en compte'
                    : isPositive
                      ? 'Positif'
                      : isAlert
                        ? 'Alerte'
                        : 'Neutre'

                  const impactLabel = isAddressDetail
                    ? null
                    : finding.impact === 'positive'
                      ? 'Impact positif'
                      : finding.impact === 'negative'
                        ? 'Impact négatif'
                        : 'Impact neutre'

                  if (isAddressDetail) {
                    const detailLabel = finding.description
                      .replace(' renseignée.', '')
                      .replace(' absente.', '')
                      .replace(' — non pris en compte.', '')

                    return (
                      <div
                        key={finding.key}
                        className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-transparent px-3 py-2.5 dark:border-slate-700"
                      >
                        <span className="text-sm font-medium text-gray-800 dark:text-slate-200">
                          {detailLabel}
                        </span>

                        <span
                          className={clsx(
                            'rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ring-black/5 dark:ring-white/10',
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
                    )
                  }

                  return (
                    <div
                      key={finding.key}
                      className={clsx(
                        'rounded-xl border border-l-4 px-3.5 py-3 shadow-sm transition-colors',
                        isPositive &&
                          'border-green-200 border-l-green-500 bg-green-50/80 dark:border-green-500/20 dark:border-l-green-400 dark:bg-green-500/10',
                        isAlert &&
                          'border-red-200 border-l-red-500 bg-red-50/80 dark:border-red-500/20 dark:border-l-red-400 dark:bg-red-500/10',
                        !isPositive &&
                          !isAlert &&
                          'border-gray-200 border-l-slate-400 bg-gray-50/70 dark:border-slate-700 dark:border-l-slate-500 dark:bg-slate-800/70'
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start">

                          <div>
                            <p className="text-sm font-semibold leading-5 text-gray-900 dark:text-white">
                              {finding.description}
                            </p>
                            {impactLabel && (
                              <p className="mt-1 text-[11px] leading-4 text-gray-500 dark:text-slate-400">
                                {impactLabel}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-1.5">

                          <span
                            className={clsx(
                              'rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ring-black/5 dark:ring-white/10',
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
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {order.regionFindings && order.regionFindings.length > 0 && (
            <div className="mt-3 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
              <div className="border-b border-gray-200 bg-gray-50/80 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/45">
                <p className="text-[13px] font-bold uppercase tracking-[0.04em] text-gray-950 dark:text-white">
                  Zone géographique
                </p>
                <p className="mt-1 text-[11px] leading-4 text-gray-500 dark:text-slate-400">
                  Constats IA basés sur la configuration géographique et l’historique disponible.
                </p>
              </div>

              <div className="space-y-2.5 p-3">
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
                        'rounded-xl border border-l-4 px-3.5 py-3 shadow-sm transition-colors',
                        isPositive &&
                          'border-green-200 border-l-green-500 bg-green-50/80 dark:border-green-500/20 dark:border-l-green-400 dark:bg-green-500/10',
                        isAlert &&
                          'border-red-200 border-l-red-500 bg-red-50/80 dark:border-red-500/20 dark:border-l-red-400 dark:bg-red-500/10',
                        !isPositive &&
                          !isAlert &&
                          'border-gray-200 border-l-slate-400 bg-gray-50/70 dark:border-slate-700 dark:border-l-slate-500 dark:bg-slate-800/70'
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start">

                          <div>
                            <p className="text-sm font-semibold leading-5 text-gray-900 dark:text-white">
                              {finding.description}
                            </p>

                            <p className="mt-1 text-[11px] leading-4 text-gray-500 dark:text-slate-400">
                              {impactLabel}
                            </p>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-1.5">

                          <span
                            className={clsx(
                              'rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ring-black/5 dark:ring-white/10',
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
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {order.orderValueFindings && order.orderValueFindings.length > 0 && (
            <div className="mt-3 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
              <div className="border-b border-gray-200 bg-gray-50/80 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/45">
                <p className="text-[13px] font-bold uppercase tracking-[0.04em] text-gray-950 dark:text-white">
                  Valeur de la commande
                </p>
                <p className="mt-1 text-[11px] leading-4 text-gray-500 dark:text-slate-400">
                  Constats IA basés sur le montant actuel et l’historique disponible.
                </p>
              </div>

              <div className="space-y-2.5 p-3">
                {order.orderValueFindings.map((finding) => {
                  const isPositive = finding.level === 'positive'
                  const isAlert = finding.level === 'alert'

                  return (
                    <div
                      key={finding.key}
                      className={clsx(
                        'rounded-xl border border-l-4 px-3.5 py-3 shadow-sm transition-colors',
                        isPositive &&
                          'border-green-200 border-l-green-500 bg-green-50/80 dark:border-green-500/20 dark:border-l-green-400 dark:bg-green-500/10',
                        isAlert &&
                          'border-red-200 border-l-red-500 bg-red-50/80 dark:border-red-500/20 dark:border-l-red-400 dark:bg-red-500/10',
                        !isPositive &&
                          !isAlert &&
                          'border-gray-200 border-l-slate-400 bg-gray-50/70 dark:border-slate-700 dark:border-l-slate-500 dark:bg-slate-800/70'
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-semibold leading-5 text-gray-900 dark:text-white">
                          {finding.description}
                        </p>

                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {order.orderTimeFindings && order.orderTimeFindings.length > 0 && (
            <div className="mt-3 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
              <div className="border-b border-gray-200 bg-gray-50/80 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/45">
                <p className="text-[13px] font-bold uppercase tracking-[0.04em] text-gray-950 dark:text-white">
                  Heure de commande
                </p>
                <p className="mt-1 text-[11px] leading-4 text-gray-500 dark:text-slate-400">
                  Constats IA basés sur les habitudes horaires observées.
                </p>
              </div>

              <div className="space-y-2.5 p-3">
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
                        'rounded-xl border border-l-4 px-3.5 py-3 shadow-sm transition-colors',
                        isPositive &&
                          'border-green-200 border-l-green-500 bg-green-50/80 dark:border-green-500/20 dark:border-l-green-400 dark:bg-green-500/10',
                        isAlert &&
                          'border-red-200 border-l-red-500 bg-red-50/80 dark:border-red-500/20 dark:border-l-red-400 dark:bg-red-500/10',
                        !isPositive &&
                          !isAlert &&
                          'border-gray-200 border-l-slate-400 bg-gray-50/70 dark:border-slate-700 dark:border-l-slate-500 dark:bg-slate-800/70'
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start">

                          <div>
                            <p className="text-sm font-semibold leading-5 text-gray-900 dark:text-white">
                              {finding.description}
                            </p>
                            <p className="mt-1 text-[11px] leading-4 text-gray-500 dark:text-slate-400">
                              {impactLabel}
                            </p>
                          </div>
                        </div>

                        <span
                          className={clsx(
                            'shrink-0 min-w-[42px] rounded-lg px-2.5 py-1.5 text-center text-xs font-extrabold tabular-nums ring-1 ring-inset ring-black/5 shadow-sm dark:ring-white/10',
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
            <div className="mt-3 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
              <div className="border-b border-gray-200 bg-gray-50/80 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/45">
                <p className="text-[13px] font-bold uppercase tracking-[0.04em] text-gray-950 dark:text-white">
                  Constats historiques
                </p>
                <p className="mt-1 text-[11px] leading-4 text-gray-500 dark:text-slate-400">
                  Analyse IA basée sur l’historique CONFIRMED disponible pour ce client.
                </p>
              </div>

              <div className="space-y-2.5 p-3">
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
                        'rounded-xl border border-l-4 px-3.5 py-3 shadow-sm',
                        isPositive &&
                          'border-green-200 border-l-green-500 bg-green-50/70 dark:border-green-500/20 dark:border-l-green-400 dark:bg-green-500/10',
                        isAlert &&
                          'border-red-200 border-l-red-500 bg-red-50/70 dark:border-red-500/20 dark:border-l-red-400 dark:bg-red-500/10',
                        !isPositive &&
                          !isAlert &&
                          'border-gray-200 border-l-slate-400 bg-gray-50/70 dark:border-slate-700 dark:border-l-slate-500 dark:bg-slate-800/70'
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
          <div className="mt-3 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
            <div className="border-b border-gray-200 bg-gray-50/80 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/45">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[13px] font-bold uppercase tracking-[0.04em] text-gray-950 dark:text-white">
                    Historique client
                  </p>
                  <p className="mt-1 text-[11px] text-gray-500 dark:text-slate-400">
                    Données réelles enregistrées dans CONFIRMED.
                  </p>
                </div>

                {order.customerHistory.isNewCustomer && (
                  <span className="shrink-0 rounded-full bg-orange-100 px-2.5 py-1 text-[10px] font-bold text-orange-700 dark:bg-orange-500/15 dark:text-orange-400">
                    Nouveau client
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 p-3 sm:grid-cols-3">
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
          <div className="mt-3">
            <div className="overflow-hidden rounded-2xl border border-cyan-200/80 bg-gradient-to-br from-cyan-50/80 via-white to-emerald-50/60 shadow-sm dark:border-cyan-500/20 dark:from-cyan-950/20 dark:via-slate-900 dark:to-emerald-950/20">
              <div className="flex items-center justify-between gap-3 border-b border-cyan-200/70 px-4 py-3 dark:border-cyan-500/20">
                <div>
                  <p className="text-sm font-bold text-gray-950 dark:text-white">
                    Résumé IA
                  </p>
                  <p className="mt-0.5 text-[11px] text-gray-500 dark:text-slate-400">
                    Analyse contextuelle des informations disponibles sur la commande.
                  </p>
                </div>

                <span className="rounded-full bg-cyan-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-400">
                  Synthèse
                </span>
              </div>

              <p className="px-4 pt-3 text-sm leading-6 text-gray-700 dark:text-slate-300">
                {order.aiSummary.introduction}
              </p>

              {order.aiSummary.positiveFactors.length > 0 && (
                <div className="mt-4 px-4">
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
                <div className="mt-4 px-4">
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

              {order.aiSummary.interpretation && (
                <div className="mx-4 mt-4 rounded-xl border border-cyan-200/80 bg-cyan-50/60 p-3.5 dark:border-cyan-500/20 dark:bg-cyan-950/20">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-cyan-700 dark:text-cyan-400">
                    Analyse contextuelle
                  </p>

                  <p className="mt-1.5 text-sm leading-6 text-gray-800 dark:text-slate-200">
                    {order.aiSummary.interpretation}
                  </p>
                </div>
              )}

              <div className="mx-4 mb-4 mt-4 rounded-xl border border-emerald-200/80 bg-white/70 p-3 dark:border-emerald-500/20 dark:bg-slate-800/70">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                    Conclusion
                  </p>

                  <p className="mt-1.5 text-sm font-medium leading-6 text-gray-900 dark:text-white">
                    {order.aiSummary.conclusion}
                  </p>
                </div>

                <div className="mt-3 border-t border-emerald-200/70 pt-3 dark:border-emerald-500/20">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                    Recommandation
                  </p>

                  <p className="mt-1.5 text-sm font-semibold leading-6 text-gray-900 dark:text-white">
                    {order.aiSummary.recommendation}
                  </p>
                </div>
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
    <section
      className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm dark:border-slate-700/80 dark:bg-slate-900/70"
      data-testid="order-items-section"
    >
      <SectionHeader title={t('orderDetail.orderItems')} />

      <ul className="space-y-2.5">
        {order.items.map((item, index) => (
          <li
            key={`${item.productId}-${index}`}
            className="flex items-start justify-between gap-4 rounded-xl bg-slate-50 px-3.5 py-3 dark:bg-slate-800/70"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold leading-5 text-slate-950 dark:text-white">
                {item.name}
              </p>

              {item.variant && (
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {item.variant}
                </p>
              )}

              <span className="mt-2 inline-flex rounded-full bg-slate-200/70 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                {t('orderDetail.qty')} : {item.quantity}
              </span>
            </div>

            <span className="shrink-0 text-sm font-bold text-slate-950 dark:text-white">
              {formatCurrency(item.price * item.quantity)}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-950 px-4 py-3 text-white dark:bg-slate-800">
        <span className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-300">
          {t('orderDetail.total')}
        </span>

        <span className="text-base font-black text-[#ADFF2F]">
          {formatCurrency(order.totalAmount)}
        </span>
      </div>
    </section>
  )
}


/**
 * Delivery Address Section/**
 * Delivery Address Section
 * Displays delivery address if available
 */
function DeliveryAddressSection({ order, t }: { order: Order; t: (key: TranslationKey) => string }) {
  const address =
    order.deliveryInfo?.address ||
    order.clientInfo?.address

  const governorate =
    address?.state ||
    order.region ||
    ''

  if (!address) {
    return null
  }

  return (
    <section
      className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm dark:border-slate-700/80 dark:bg-slate-900/70"
      data-testid="delivery-address-section"
    >
      <SectionHeader title={t('orderDetail.deliveryAddress')} />

      {address.street && (
        <div className="mb-2.5 rounded-xl bg-slate-50 px-3.5 py-3 dark:bg-slate-800/70">
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400 dark:text-slate-500">
            Adresse
          </p>

          <p className="mt-1 text-sm font-semibold leading-5 text-slate-950 dark:text-white">
            {address.street}
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2.5">
        {address.city && (
          <div className="rounded-xl bg-slate-50 px-3.5 py-3 dark:bg-slate-800/70">
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400 dark:text-slate-500">
              Ville
            </p>

            <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
              {address.city}
            </p>
          </div>
        )}

        <div className="rounded-xl bg-slate-50 px-3.5 py-3 dark:bg-slate-800/70">
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400 dark:text-slate-500">
            Gouvernorat
          </p>

          <p className="mt-1 text-sm font-bold text-slate-950 dark:text-white">
            {governorate || '—'}
          </p>
        </div>

        {address.district && (
          <div className="rounded-xl bg-slate-50 px-3.5 py-3 dark:bg-slate-800/70">
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400 dark:text-slate-500">
              Délégation
            </p>

            <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
              {address.district}
            </p>
          </div>
        )}

        {address.zipCode && (
          <div className="rounded-xl bg-slate-50 px-3.5 py-3 dark:bg-slate-800/70">
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400 dark:text-slate-500">
              Code postal
            </p>

            <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
              {address.zipCode}
            </p>
          </div>
        )}

        {address.country && (
          <div className="rounded-xl bg-slate-50 px-3.5 py-3 dark:bg-slate-800/70">
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400 dark:text-slate-500">
              Pays
            </p>

            <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
              {address.country}
            </p>
          </div>
        )}
      </div>
    </section>
  )
}


/**
 * Call History Section/**
 * Call History Section
 * Displays timeline of call attempts with operator, timestamp, outcome, notes
 * Property 11: Call history displays required fields
 */
function CallHistorySection({ order, t }: { order: Order; t: (key: TranslationKey) => string }) {
  if (!order.callHistory || order.callHistory.length === 0) {
    return (
      <section
        className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm dark:border-slate-700/80 dark:bg-slate-900/70"
        data-testid="call-history-section"
      >
        <SectionHeader title={t('orderDetail.callHistory')} />

        <div className="rounded-xl bg-slate-50 px-3.5 py-4 text-sm text-slate-500 dark:bg-slate-800/70 dark:text-slate-400">
          {t('orderDetail.noCallHistory')}
        </div>
      </section>
    )
  }

  return (
    <section
      className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm dark:border-slate-700/80 dark:bg-slate-900/70"
      data-testid="call-history-section"
    >
      <SectionHeader title={t('orderDetail.callHistory')} />

      <div className="space-y-0">
        {order.callHistory.map((entry, index) => {
          const resultDisplay =
            getCallResultDisplay(entry.result)

          return (
            <div
              key={`${entry.timestamp}-${index}`}
              className="relative pl-8 pb-3 last:pb-0"
              data-testid="call-history-entry"
            >
              {index < order.callHistory.length - 1 && (
                <div className="absolute bottom-0 left-[9px] top-5 w-px bg-slate-200 dark:bg-slate-700" />
              )}

              <div className="absolute left-0 top-4 flex h-[19px] w-[19px] items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm dark:border-slate-600 dark:bg-slate-900">
                <div
                  className={clsx(
                    'h-2 w-2 rounded-full',
                    entry.result === 'confirmed'
                      ? 'bg-emerald-500'
                      : entry.result === 'rejected' ||
                          entry.result === 'unreachable'
                        ? 'bg-red-500'
                        : entry.result === 'no_answer' ||
                            entry.result === 'busy'
                          ? 'bg-amber-500'
                          : 'bg-slate-400'
                  )}
                />
              </div>

              <div className="rounded-xl bg-slate-50 px-3.5 py-3 dark:bg-slate-800/70">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p
                      className="text-sm font-semibold text-slate-950 dark:text-white"
                      data-testid="call-operator"
                    >
                      {entry.operatorName ||
                        (typeof entry.operatorId === 'object' &&
                        entry.operatorId
                          ? [
                              entry.operatorId.firstName,
                              entry.operatorId.lastName,
                            ]
                              .filter(Boolean)
                              .join(' ') ||
                            entry.operatorId.name ||
                            entry.operatorId.email ||
                            'Opérateur'
                          : `Operator ${entry.operatorId}`)}
                    </p>

                    <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                      {entry.callType === 'ai'
                        ? t('orderDetail.aiCall')
                        : t('orderDetail.humanCall')}
                    </p>
                  </div>

                  <span
                    className={clsx(
                      'shrink-0 text-xs font-bold',
                      resultDisplay.color
                    )}
                    data-testid="call-outcome"
                  >
                    {resultDisplay.label}
                  </span>
                </div>

                <p
                  className="mt-2 text-xs text-slate-500 dark:text-slate-400"
                  data-testid="call-timestamp"
                >
                  {formatDateTime(entry.timestamp)}
                  {entry.duration &&
                    ` • ${formatDuration(entry.duration)}`}
                </p>

                {entry.notes && (
                  <p
                    className="mt-2 border-t border-slate-200 pt-2 text-sm leading-5 text-slate-600 dark:border-slate-700 dark:text-slate-300"
                    data-testid="call-notes"
                  >
                    {entry.notes}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}


/**
 * Status Timeline Section/**
 * Status Timeline Section
 * Displays order status progression with current status highlighted
 * Requirements: 4.4
 */
function StatusTimelineSection({ order, t }: { order: Order; t: (key: TranslationKey) => string }) {
  const timelineStatus: OrderStatus =
    order.status === 'assigned'
      ? 'in_progress'
      : order.status === 'rejected'
      ? 'cancelled'
      : order.status

  const normalizeTimelineStatus = (status: OrderStatus): OrderStatus =>
    status === 'assigned'
      ? 'in_progress'
      : status === 'rejected'
      ? 'cancelled'
      : status

  const timelineStatuses = (
    [
      'pending',
      ...(order.statusHistory ?? []).map(entry =>
        normalizeTimelineStatus(entry.status)
      ),
    ] as OrderStatus[]
  ).filter(
    (status, index, statuses) =>
      index === 0 || status !== statuses[index - 1]
  )

  const normalizedCurrentStatus = normalizeTimelineStatus(timelineStatus)

  if (
    timelineStatuses[timelineStatuses.length - 1] !==
    normalizedCurrentStatus
  ) {
    timelineStatuses.push(normalizedCurrentStatus)
  }

  const translatedLabels = getTranslatedStatusLabels(t)
  
  return (
    <section
      className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm dark:border-slate-700/80 dark:bg-slate-900/70"
      data-testid="status-timeline-section"
    >
      <SectionHeader title={t('orderDetail.statusTimeline')} />
      <div className="flex items-center justify-between">
        {timelineStatuses.map((status, index) => {
          const isCompleted = index < timelineStatuses.length - 1
          const isCurrent = index === timelineStatuses.length - 1
          
          return (
            <Fragment key={`${status}-${index}`}>
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
              {index < timelineStatuses.length - 1 && (
                <div
                  className={clsx(
                    'flex-1 h-0.5 mx-2',
                    index < timelineStatuses.length - 1
                      ? 'bg-green-500'
                      : 'bg-gray-200 dark:bg-slate-700'
                  )}
                />
              )}
            </Fragment>
          )
        })}
      </div>
      

    </section>
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
  onEdit,
  showAdminContext = false,
}: OrderDetailPanelProps) {
  const { t } = useLanguage()

  if (!order) {
    return null
  }

  const referenceLabel = (
    value: unknown
  ): string => {
    if (!value) {
      return '—'
    }

    if (
      typeof value === 'string' ||
      typeof value === 'number'
    ) {
      return String(value)
    }

    if (typeof value === 'object') {
      const ref =
        value as Record<
          string,
          unknown
        >

      const firstName =
        typeof ref.firstName === 'string'
          ? ref.firstName
          : ''

      const lastName =
        typeof ref.lastName === 'string'
          ? ref.lastName
          : ''

      const fullName =
        [
          firstName,
          lastName
        ]
          .filter(Boolean)
          .join(' ')
          .trim()

      if (
        typeof ref.name === 'string' &&
        ref.name
      ) {
        return ref.name
      }

      if (fullName) {
        return fullName
      }

      if (
        typeof ref.email === 'string' &&
        ref.email
      ) {
        return ref.email
      }

      if (ref._id) {
        return String(ref._id)
      }
    }

    return '—'
  }

  const adminShop =
    referenceLabel(
      order.shopId
    )

  const adminOperator =
    order.responsibleOperator
      ? referenceLabel(
          order.responsibleOperator
        )
      : 'Non assigné'

  const adminCourier =
    referenceLabel(
      order.courier
    )

  const adminTracking =
    order.deliveryInfo
      ?.trackingNumber ||
    '—'

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
          <div className="fixed inset-0 bg-slate-950/45 backdrop-blur-[2px] transition-opacity" />
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
                <Dialog.Panel className="pointer-events-auto w-screen max-w-xl sm:max-w-2xl xl:max-w-3xl">
                  <div className="flex h-full flex-col border-l border-t-2 border-l-slate-200 border-t-[#ADFF2F] bg-slate-50 shadow-2xl dark:border-l-slate-800 dark:bg-slate-950">
                    {/* Header */}
                    <div className="border-b border-slate-200 bg-white/95 px-4 py-4 shadow-sm backdrop-blur sm:px-5 dark:border-slate-800 dark:bg-slate-900/95">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-lime-600 dark:text-[#ADFF2F]">
                            Détail de la commande
                          </p>

                          <Dialog.Title className="break-all text-xl font-black tracking-tight text-slate-950 dark:text-white">
                            {t('orderDetail.order')} #{order.confirmedId}
                          </Dialog.Title>

                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <StatusBadge status={order.status} size="sm" />

                            <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-600" />

                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                              {formatDateTime(order.createdAt)}
                            </span>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          {showAdminContext && (
                            <div className="basis-full rounded-xl border border-cyan-100 bg-cyan-50/60 p-3 dark:border-cyan-500/20 dark:bg-cyan-500/5">
                              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-cyan-700 dark:text-cyan-400">
                                Contexte Admin
                              </p>

                              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                                <div>
                                  <span className="block text-[10px] text-slate-400">
                                    Boutique
                                  </span>
                                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                                    {adminShop}
                                  </span>
                                </div>

                                <div>
                                  <span className="block text-[10px] text-slate-400">
                                    Opérateur
                                  </span>
                                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                                    {adminOperator}
                                  </span>
                                </div>

                                <div>
                                  <span className="block text-[10px] text-slate-400">
                                    Transporteur
                                  </span>
                                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                                    {adminCourier}
                                  </span>
                                </div>

                                <div>
                                  <span className="block text-[10px] text-slate-400">
                                    Tracking
                                  </span>
                                  <span className="break-all font-mono font-semibold text-slate-800 dark:text-slate-200">
                                    {adminTracking}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}

                          {onEdit && (
                            <button
                              type="button"
                              onClick={onEdit}
                              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-800 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-cyan-500/30 dark:hover:bg-cyan-500/10 dark:hover:text-cyan-300"
                              title="Modifier la commande"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                className="h-3.5 w-3.5"
                              >
                                <path d="M13.586 3.586a2 2 0 012.828 2.828l-8.5 8.5a1 1 0 01-.464.263l-3 1a1 1 0 01-1.265-1.265l1-3a1 1 0 01.263-.464l8.5-8.5.638.638z" />
                              </svg>

                              Modifier
                            </button>
                          )}

                          <button
                            type="button"
                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white"
                            onClick={onClose}
                            data-testid="close-panel-button"
                          >
                            <span className="sr-only">
                              {t('orderDetail.close')}
                            </span>

                            <CloseIcon />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div
                      className="flex-1 space-y-4 overflow-y-auto bg-slate-50/80 px-4 py-4 sm:px-5 sm:py-5 dark:bg-slate-950"
                      data-testid="order-detail-content"
                    >
                      <CustomerInfoSection order={order} t={t} />
                      <OrderItemsSection order={order} t={t} />
                      <DeliveryAddressSection order={order} t={t} />
                      <CallHistorySection order={order} t={t} />
                      <AIScoreSection order={order} />
                      
                      {/* Retour d'appel structuré */}
                      <section className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm dark:border-slate-700/80 dark:bg-slate-900/70">
                        <SectionHeader title="Retour d'appel" />
                        <CallFeedbackAnalysis order={order} />
                      </section>
                      
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
