'use client'

import { useMemo, useState } from 'react'
import type { Order } from '@/types/order'

type FeedbackFilter = 'all' | 'human' | 'ai'
type Impact = 'positive' | 'neutral' | 'negative'

type OperatorRef = {
  _id?: string
  firstName?: string
  lastName?: string
  name?: string
  email?: string
}

type StructuredFeedback = {
  toneSignals?: string[]
  confirmationLevel?: string
  priceBehavior?: string
  productDoubts?: string
  deliveryInformation?: string
  engagementLevel?: string
  receptionIntent?: string
  notes?: string
}

type CallEntry = {
  _id?: string
  operatorId?: string | OperatorRef
  operatorName?: string
  callType?: 'human' | 'ai'
  timestamp?: string
  duration?: number
  result?: string
  notes?: string
  feedback?: StructuredFeedback
}

type Criterion = {
  label: string
  value: string
  impact: Impact
}

const toneMap: Record<string, Criterion> = {
  polite: {
    label: 'Ton et énergie',
    value: 'Poli et courtois',
    impact: 'positive',
  },
  confident: {
    label: 'Ton et énergie',
    value: 'Confiant',
    impact: 'positive',
  },
  enthusiastic: {
    label: 'Ton et énergie',
    value: 'Enthousiaste',
    impact: 'positive',
  },
  quick_response: {
    label: 'Ton et énergie',
    value: 'Réponse rapide',
    impact: 'positive',
  },
  hesitant: {
    label: 'Ton et énergie',
    value: 'Hésitant',
    impact: 'neutral',
  },
  distracted: {
    label: 'Ton et énergie',
    value: 'Distrait',
    impact: 'negative',
  },
  long_pauses: {
    label: 'Ton et énergie',
    value: 'Longues pauses',
    impact: 'negative',
  },
  rude: {
    label: 'Ton et énergie',
    value: 'Impoli',
    impact: 'negative',
  },
  aggressive: {
    label: 'Ton et énergie',
    value: 'Agressif',
    impact: 'negative',
  },
  nervous: {
    label: 'Ton et énergie',
    value: 'Ton nerveux',
    impact: 'negative',
  },
  low_interest: {
    label: 'Ton et énergie',
    value: 'Semble peu intéressé',
    impact: 'negative',
  },
}

const confirmationMap: Record<string, Criterion> = {
  very_firm: {
    label: 'Niveau de confirmation',
    value: 'Confirmation très ferme',
    impact: 'positive',
  },
  normal: {
    label: 'Niveau de confirmation',
    value: 'Confirmation normale',
    impact: 'positive',
  },
  weak: {
    label: 'Niveau de confirmation',
    value: 'Confirmation faible',
    impact: 'negative',
  },
}

const priceMap: Record<string, Criterion> = {
  no_issue: {
    label: 'Comportement face au prix',
    value: 'Aucun commentaire sur le prix',
    impact: 'positive',
  },
  asks_discount: {
    label: 'Comportement face au prix',
    value: 'Demande une réduction',
    impact: 'neutral',
  },
  insists_discount: {
    label: 'Comportement face au prix',
    value: 'Insiste pour obtenir une réduction',
    impact: 'negative',
  },
  strong_negotiation: {
    label: 'Comportement face au prix',
    value: 'Négocie fortement le prix',
    impact: 'negative',
  },
}

const productMap: Record<string, Criterion> = {
  none: {
    label: 'Doutes sur le produit',
    value: 'Aucun doute',
    impact: 'positive',
  },
  asks_question: {
    label: 'Doutes sur le produit',
    value: 'Pose une question sur le produit',
    impact: 'neutral',
  },
  multiple_doubts: {
    label: 'Doutes sur le produit',
    value: 'Exprime plusieurs doutes',
    impact: 'negative',
  },
  compares_seller: {
    label: 'Doutes sur le produit',
    value: 'Compare avec un autre vendeur',
    impact: 'negative',
  },
}

const deliveryMap: Record<string, Criterion> = {
  complete_quick: {
    label: 'Informations de livraison',
    value: 'Adresse complète fournie immédiatement',
    impact: 'positive',
  },
  clear_precise: {
    label: 'Informations de livraison',
    value: 'Adresse claire et précise',
    impact: 'positive',
  },
  partial: {
    label: 'Informations de livraison',
    value: 'Adresse incomplète',
    impact: 'neutral',
  },
  vague: {
    label: 'Informations de livraison',
    value: 'Adresse vague',
    impact: 'negative',
  },
  difficulty: {
    label: 'Informations de livraison',
    value: 'Difficulté à fournir les informations',
    impact: 'negative',
  },
  refuses_details: {
    label: 'Informations de livraison',
    value: 'Refuse ou évite de communiquer les détails',
    impact: 'negative',
  },
}

const engagementMap: Record<string, Criterion> = {
  very_engaged: {
    label: "Niveau d'engagement",
    value: 'Très engagé',
    impact: 'positive',
  },
  interested: {
    label: "Niveau d'engagement",
    value: 'Intéressé',
    impact: 'positive',
  },
  passive: {
    label: "Niveau d'engagement",
    value: 'Passif',
    impact: 'neutral',
  },
  low_involvement: {
    label: "Niveau d'engagement",
    value: 'Peu impliqué',
    impact: 'negative',
  },
  distracted: {
    label: "Niveau d'engagement",
    value: 'Distrait',
    impact: 'negative',
  },
}

const receptionMap: Record<string, Criterion> = {
  wants_fast_delivery: {
    label: 'Intention de réception',
    value: 'Souhaite une livraison rapide',
    impact: 'positive',
  },
  clearly_confirms_receipt: {
    label: 'Intention de réception',
    value: 'Confirme clairement la réception',
    impact: 'positive',
  },
  asks_delivery_info: {
    label: 'Intention de réception',
    value: 'Demande des informations sur la livraison',
    impact: 'positive',
  },
  uncertain_receipt: {
    label: 'Intention de réception',
    value: 'Réception incertaine',
    impact: 'negative',
  },
  does_not_know_when: {
    label: 'Intention de réception',
    value: 'Ne sait pas quand il pourra réceptionner',
    impact: 'negative',
  },
}

function getOperatorName(entry: CallEntry): string {
  if (entry.callType === 'ai') {
    return 'Agent IA CONFIRMED'
  }

  if (entry.operatorName?.trim()) {
    return entry.operatorName.trim()
  }

  if (
    entry.operatorId &&
    typeof entry.operatorId === 'object'
  ) {
    const name = [
      entry.operatorId.firstName,
      entry.operatorId.lastName,
    ]
      .filter(Boolean)
      .join(' ')
      .trim()

    return (
      name ||
      entry.operatorId.name ||
      'Opérateur CONFIRMED'
    )
  }

  // Ne jamais afficher un ObjectId technique.
  return 'Opérateur CONFIRMED'
}

function formatDate(value?: string): string {
  if (!value) return 'Date non renseignée'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Date non renseignée'
  }

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
    .format(date)
    .replace(',', ' à')
}

function formatDuration(duration?: number): string {
  if (
    typeof duration !== 'number' ||
    !Number.isFinite(duration) ||
    duration <= 0
  ) {
    return 'Durée non renseignée'
  }

  const totalSeconds = Math.round(duration)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `Durée : ${String(minutes).padStart(2, '0')} min ${String(
    seconds
  ).padStart(2, '0')} s`
}

function resultLabel(result?: string): string {
  const map: Record<string, string> = {
    confirmed: 'Commande confirmée',
    cancelled: 'Commande annulée',
    rejected: 'Commande annulée',
    unavailable: 'Client indisponible',
    unreachable: 'Client indisponible',
    no_answer: 'Aucune réponse',
    invalid_number: 'Numéro invalide',
    postponed: 'À rappeler',
    callback: 'À rappeler',
  }

  return result ? map[result] || 'Appel traité' : 'Appel traité'
}

function resultClasses(result?: string): string {
  if (result === 'confirmed') {
    return 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
  }

  if (
    result === 'cancelled' ||
    result === 'rejected' ||
    result === 'invalid_number'
  ) {
    return 'border-red-500/20 bg-red-500/10 text-red-400'
  }

  return 'border-amber-500/20 bg-amber-500/10 text-amber-400'
}

function impactLabel(impact: Impact): string {
  if (impact === 'positive') return 'Impact positif'
  if (impact === 'negative') return 'Impact négatif'
  return 'Point de vigilance'
}

function impactClasses(impact: Impact): string {
  if (impact === 'positive') {
    return 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
  }

  if (impact === 'negative') {
    return 'border-red-500/20 bg-red-500/10 text-red-400'
  }

  return 'border-amber-500/20 bg-amber-500/10 text-amber-400'
}

function getCriteria(
  feedback?: StructuredFeedback
): Criterion[] {
  if (!feedback) return []

  const criteria: Criterion[] = []

  for (const signal of feedback.toneSignals || []) {
    if (toneMap[signal]) {
      criteria.push(toneMap[signal])
    }
  }

  const values = [
    [feedback.confirmationLevel, confirmationMap],
    [feedback.priceBehavior, priceMap],
    [feedback.productDoubts, productMap],
    [feedback.deliveryInformation, deliveryMap],
    [feedback.engagementLevel, engagementMap],
    [feedback.receptionIntent, receptionMap],
  ] as const

  for (const [value, map] of values) {
    if (value && map[value]) {
      criteria.push(map[value])
    }
  }

  return criteria
}

function hasStructuredFeedback(
  feedback?: StructuredFeedback
): boolean {
  if (!feedback) return false

  return Boolean(
    (feedback.toneSignals &&
      feedback.toneSignals.length > 0) ||
    feedback.confirmationLevel ||
    feedback.priceBehavior ||
    feedback.productDoubts ||
    feedback.deliveryInformation ||
    feedback.engagementLevel ||
    feedback.receptionIntent
  )
}

function buildSummary(criteria: Criterion[]): string {
  if (criteria.length === 0) {
    return ''
  }

  const positives = criteria.filter(
    item => item.impact === 'positive'
  )

  const negatives = criteria.filter(
    item => item.impact === 'negative'
  )

  const warnings = criteria.filter(
    item => item.impact === 'neutral'
  )

  if (
    positives.length >= negatives.length + 2 &&
    negatives.length <= 1
  ) {
    return [
      "L'échange présente plusieurs signaux favorables.",
      positives.length
        ? `Les éléments positifs principaux sont : ${positives
            .slice(0, 3)
            .map(item => item.value.toLowerCase())
            .join(', ')}.`
        : '',
      negatives.length
        ? `Un point de vigilance a toutefois été identifié : ${negatives[0].value.toLowerCase()}.`
        : warnings.length
          ? `Un point mérite une attention particulière : ${warnings[0].value.toLowerCase()}.`
          : 'Aucune réserve comportementale importante n’a été détectée.',
      'Le niveau de confiance de cet échange est globalement élevé.',
    ]
      .filter(Boolean)
      .join(' ')
  }

  if (negatives.length >= 2) {
    return [
      "L'échange présente plusieurs signaux de vigilance.",
      `Les principaux points détectés sont : ${negatives
        .slice(0, 3)
        .map(item => item.value.toLowerCase())
        .join(', ')}.`,
      positives.length
        ? `Un élément favorable reste présent : ${positives[0].value.toLowerCase()}.`
        : '',
      'Le niveau de confiance de cette confirmation doit être considéré avec prudence.',
    ]
      .filter(Boolean)
      .join(' ')
  }

  return [
    "L'échange présente un profil globalement modéré.",
    positives.length
      ? `Signal favorable : ${positives[0].value.toLowerCase()}.`
      : '',
    negatives.length
      ? `Point de vigilance : ${negatives[0].value.toLowerCase()}.`
      : warnings.length
        ? `Point à surveiller : ${warnings[0].value.toLowerCase()}.`
        : '',
    'La décision doit être appréciée avec les autres informations de la commande.',
  ]
    .filter(Boolean)
    .join(' ')
}

function CallCard({ entry }: { entry: CallEntry }) {
  const criteria = getCriteria(entry.feedback)
  const summary = buildSummary(criteria)
  const isHuman = entry.callType !== 'ai'

  return (
    <article
      className={`rounded-2xl border p-4 ${
        isHuman
          ? 'border-blue-500/20 bg-blue-500/[0.04]'
          : 'border-purple-500/20 bg-purple-500/[0.04]'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
              isHuman
                ? 'bg-blue-500/15 text-blue-400'
                : 'bg-purple-500/15 text-purple-400'
            }`}
          >
            {isHuman ? 'OP' : 'IA'}
          </div>

          <div className="min-w-0">
            <p className="font-semibold text-gray-900 dark:text-white">
              {getOperatorName(entry)}
            </p>

            <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-xs text-gray-500 dark:text-slate-400">
              <span>{formatDate(entry.timestamp)}</span>
              <span>•</span>
              <span>{formatDuration(entry.duration)}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <span
            className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
              isHuman
                ? 'border-blue-500/20 bg-blue-500/10 text-blue-400'
                : 'border-purple-500/20 bg-purple-500/10 text-purple-400'
            }`}
          >
            {isHuman ? '👤 Appel opérateur' : '🤖 Appel IA'}
          </span>

          <span
            className={`rounded-full border px-2.5 py-1 text-xs font-medium ${resultClasses(
              entry.result
            )}`}
          >
            {resultLabel(entry.result)}
          </span>
        </div>
      </div>

      {criteria.length > 0 ? (
        <>
          <div className="mt-5">
            <h5 className="text-sm font-semibold text-gray-900 dark:text-white">
              Analyse comportementale
            </h5>

            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {criteria.map((criterion, index) => (
                <div
                  key={`${criterion.label}-${criterion.value}-${index}`}
                  className="rounded-xl border border-gray-200 bg-white/50 p-3 dark:border-slate-700 dark:bg-slate-900/40"
                >
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-slate-500">
                    {criterion.label}
                  </p>

                  <p className="mt-1 text-sm font-medium text-gray-900 dark:text-slate-100">
                    {criterion.value}
                  </p>

                  <span
                    className={`mt-2 inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${impactClasses(
                      criterion.impact
                    )}`}
                  >
                    {impactLabel(criterion.impact)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {summary && (
            <div className="mt-4 rounded-xl border border-purple-500/20 bg-purple-500/[0.06] p-4">
              <p className="text-sm font-semibold text-purple-500 dark:text-purple-300">
                Résumé IA
              </p>

              <p className="mt-2 text-sm leading-6 text-gray-700 dark:text-slate-300">
                {summary}
              </p>
            </div>
          )}

          <div className="mt-4">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              Impact sur le Score IA
            </p>

            <div className="mt-2 flex flex-wrap gap-2">
              {criteria.map((criterion, index) => (
                <span
                  key={`impact-${criterion.value}-${index}`}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${impactClasses(
                    criterion.impact
                  )}`}
                >
                  <span>
                    {criterion.impact === 'positive'
                      ? '✓'
                      : criterion.impact === 'negative'
                        ? '!'
                        : '•'}
                  </span>
                  {criterion.value}
                </span>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50/70 p-3 dark:border-slate-700 dark:bg-slate-900/40">
          <p className="text-sm text-gray-600 dark:text-slate-400">
            {entry.notes
              ? entry.notes
              : 'Analyse comportementale non disponible pour cet ancien appel.'}
          </p>
        </div>
      )}

      {entry.feedback?.notes && (
        <div className="mt-4 border-t border-gray-200 pt-3 dark:border-slate-700">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-slate-500">
            Note opérateur
          </p>
          <p className="mt-1 text-sm text-gray-700 dark:text-slate-300">
            {entry.feedback.notes}
          </p>
        </div>
      )}
    </article>
  )
}

export default function CallFeedbackAnalysis({
  order,
}: {
  order: Order
}) {
  const [filter, setFilter] =
    useState<FeedbackFilter>('all')

  const entries = useMemo(
    () =>
      ([...(order.callHistory || [])] as CallEntry[])
        .filter(entry => {
          // Les simples tentatives restent dans
          // l'Historique des appels.
          // Retour d'appel = analyse structurée réelle.
          if (entry.callType === 'ai') {
            return true
          }

          return hasStructuredFeedback(
            entry.feedback
          )
        })
        .sort(
          (a, b) =>
            new Date(
              b.timestamp || 0
            ).getTime() -
            new Date(
              a.timestamp || 0
            ).getTime()
        ),
    [order.callHistory]
  )

  const humanCount = entries.filter(
    entry => entry.callType !== 'ai'
  ).length

  const aiCount = entries.filter(
    entry => entry.callType === 'ai'
  ).length

  const displayed = entries.filter(entry => {
    if (filter === 'human') {
      return entry.callType !== 'ai'
    }

    if (filter === 'ai') {
      return entry.callType === 'ai'
    }

    return true
  })

  if (entries.length === 0) {
    return (
      <p className="py-3 text-sm text-gray-500 dark:text-slate-400">
        Aucun retour d&apos;appel structuré disponible pour cette commande.
      </p>
    )
  }

  return (
    <div className="space-y-4 py-3">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
            filter === 'all'
              ? 'bg-[#ADFF2F] text-slate-950'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
          }`}
        >
          Tous ({entries.length})
        </button>

        <button
          type="button"
          onClick={() => setFilter('ai')}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
            filter === 'ai'
              ? 'bg-purple-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
          }`}
        >
          IA ({aiCount})
        </button>

        <button
          type="button"
          onClick={() => setFilter('human')}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
            filter === 'human'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
          }`}
        >
          Opérateur humain ({humanCount})
        </button>
      </div>

      {displayed.length > 0 ? (
        <div className="space-y-3">
          {displayed.map((entry, index) => (
            <CallCard
              key={
                entry._id ||
                `${entry.timestamp || 'call'}-${index}`
              }
              entry={entry}
            />
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-gray-200 p-4 text-sm text-gray-500 dark:border-slate-700 dark:text-slate-400">
          Aucun retour correspondant à ce filtre.
        </p>
      )}
    </div>
  )
}
