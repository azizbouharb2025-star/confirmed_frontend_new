'use client'

/**
 * LogisticsExportModal
 *
 * Allows the user to export selected orders to a logistics provider format.
 * Supported:  generic, intigo, aramex, rapid_poste, yalidine, custom
 * Coming soon: (none)
 */

import React, { useState } from 'react'
import { orderService } from '@/services/orderService'
import intigoDeliveryService, {
  type IntigoDryRunPreview,
} from '@/services/intigoDeliveryService'

// ─── Types ───────────────────────────────────────────────────────────────────

export type LogisticsProvider =
  | 'generic'
  | 'intigo'
  | 'colissimo'
  | 'aramex'
  | 'rapid_poste'
  | 'yalidine'
  | 'custom'

type FileType = 'csv' | 'xlsx'

/** Column key as expected by the backend */
export type CustomExportColumn =
  | 'customerName'
  | 'phone'
  | 'address'
  | 'region'
  | 'city'
  | 'product'
  | 'quantity'
  | 'amount'
  | 'aiScore'
  | 'riskLevel'
  | 'orderDate'

interface ProviderOption {
  id: LogisticsProvider
  label: string
  enabled: boolean
}

interface ColumnOption {
  key: CustomExportColumn
  label: string
}

// ─── Constants ───────────────────────────────────────────────────────────────

const PROVIDERS: ProviderOption[] = [
  { id: 'generic',     label: 'Generic',     enabled: true },
  { id: 'intigo',      label: 'Intigo',      enabled: true },
  { id: 'colissimo',   label: 'Colissimo',   enabled: true },
  { id: 'aramex',      label: 'Aramex',      enabled: true },
  { id: 'rapid_poste', label: 'Rapid Poste', enabled: true },
  { id: 'yalidine',    label: 'Yalidine',    enabled: true },
  { id: 'custom',      label: 'Custom',      enabled: true },
]

/** All available custom columns in display order */
const ALL_COLUMNS: ColumnOption[] = [
  { key: 'customerName', label: 'Nom' },
  { key: 'phone',        label: 'Téléphone' },
  { key: 'address',      label: 'Adresse' },
  { key: 'region',       label: 'Région' },
  { key: 'city',         label: 'Ville' },
  { key: 'product',      label: 'Produit' },
  { key: 'quantity',     label: 'Quantité' },
  { key: 'amount',       label: 'Montant' },
  { key: 'aiScore',      label: 'Score IA' },
  { key: 'riskLevel',    label: 'Niveau de risque' },
  { key: 'orderDate',    label: 'Date de commande' },
]

/** Default selected columns for custom export */
const DEFAULT_CUSTOM_COLUMNS: CustomExportColumn[] = [
  'customerName',
  'phone',
  'address',
  'city',
  'product',
  'amount',
]

// ─── Helper ───────────────────────────────────────────────────────────────────

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a   = document.createElement('a')
  a.href     = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ─── Sub-component: Custom Column Selector ───────────────────────────────────

interface ColumnSelectorProps {
  selected:  CustomExportColumn[]
  onChange:  (cols: CustomExportColumn[]) => void
  disabled:  boolean
}

function ColumnSelector({ selected, onChange, disabled }: ColumnSelectorProps) {
  const selectedSet = new Set(selected)

  /** Keys not yet in selected list */
  const available = ALL_COLUMNS.filter(c => !selectedSet.has(c.key))

  const addColumn = (key: CustomExportColumn) => {
    onChange([...selected, key])
  }

  const removeColumn = (key: CustomExportColumn) => {
    onChange(selected.filter(k => k !== key))
  }

  const moveUp = (index: number) => {
    if (index === 0) return
    const next = [...selected]
    ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
    onChange(next)
  }

  const moveDown = (index: number) => {
    if (index === selected.length - 1) return
    const next = [...selected]
    ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
    onChange(next)
  }

  const labelOf = (key: CustomExportColumn) =>
    ALL_COLUMNS.find(c => c.key === key)?.label ?? key

  return (
    <div className="space-y-3">
      {/* Selected columns list */}
      <div>
        <p className="text-xs font-medium dark:text-slate-400 text-gray-500 mb-1.5 uppercase tracking-wide">
          Colonnes sélectionnées ({selected.length})
        </p>
        {selected.length === 0 ? (
          <p className="text-xs dark:text-slate-500 text-gray-400 italic py-2">
            Aucune colonne sélectionnée
          </p>
        ) : (
          <ul className="space-y-1">
            {selected.map((key, idx) => (
              <li
                key={key}
                className="flex items-center gap-1 px-2 py-1.5 rounded-lg dark:bg-slate-800 bg-gray-50 border dark:border-slate-700 border-gray-200"
              >
                {/* Order badge */}
                <span className="w-5 text-center text-xs dark:text-slate-500 text-gray-400 font-mono shrink-0">
                  {idx + 1}
                </span>
                {/* Label */}
                <span className="flex-1 text-sm dark:text-white text-gray-900">
                  {labelOf(key)}
                </span>
                {/* Move up */}
                <button
                  type="button"
                  onClick={() => moveUp(idx)}
                  disabled={disabled || idx === 0}
                  className="p-1 rounded dark:hover:bg-slate-700 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label="Monter"
                  title="Monter"
                >
                  <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                {/* Move down */}
                <button
                  type="button"
                  onClick={() => moveDown(idx)}
                  disabled={disabled || idx === selected.length - 1}
                  className="p-1 rounded dark:hover:bg-slate-700 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label="Descendre"
                  title="Descendre"
                >
                  <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                {/* Remove */}
                <button
                  type="button"
                  onClick={() => removeColumn(key)}
                  disabled={disabled}
                  className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label={`Supprimer ${labelOf(key)}`}
                  title="Supprimer"
                >
                  <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Available columns to add */}
      {available.length > 0 && (
        <div>
          <p className="text-xs font-medium dark:text-slate-400 text-gray-500 mb-1.5 uppercase tracking-wide">
            Ajouter une colonne
          </p>
          <div className="flex flex-wrap gap-1.5">
            {available.map(col => (
              <button
                key={col.key}
                type="button"
                onClick={() => addColumn(col.key)}
                disabled={disabled}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border-2 border-dashed dark:border-slate-600 border-gray-300 dark:text-slate-300 text-gray-600 dark:hover:border-blue-500 hover:border-blue-400 dark:hover:text-blue-400 hover:text-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                {col.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export interface LogisticsExportModalProps {
  isOpen:   boolean
  onClose:  () => void
  /** IDs of the orders to include in the export. Empty array = all shop orders. */
  orderIds: string[]
}

export default function LogisticsExportModal({
  isOpen,
  onClose,
  orderIds,
}: LogisticsExportModalProps) {
  const [provider,       setProvider]       = useState<LogisticsProvider>('generic')
  const [fileType,       setFileType]       = useState<FileType>('csv')
  const [customColumns,  setCustomColumns]  = useState<CustomExportColumn[]>(DEFAULT_CUSTOM_COLUMNS)
  const [isLoading,      setIsLoading]      = useState(false)
  const [errorMsg,       setErrorMsg]       = useState<string | null>(null)
  const [successMsg,     setSuccessMsg]     = useState<string | null>(null)

  const [intigoPreview, setIntigoPreview] =
    useState<IntigoDryRunPreview | null>(null)

  const [isIntigoPreviewing, setIsIntigoPreviewing] =
    useState(false)

  const isIntigo = provider === 'intigo'
  const isBusy = isLoading || isIntigoPreviewing

  const intigoReady =
    intigoPreview?.ready || []

  const intigoReview =
    intigoPreview?.reviewBlocked ||
    intigoPreview?.review ||
    []

  const intigoDuplicate =
    intigoPreview?.duplicate || []

  const intigoInvalid =
    intigoPreview?.invalid || []

  if (!isOpen) return null

  const handleClose = () => {
    if (isBusy) return
    setErrorMsg(null)
    setSuccessMsg(null)
    setIntigoPreview(null)
    onClose()
  }

  const handleProviderChange = (id: LogisticsProvider) => {
    setProvider(id)
    setErrorMsg(null)
    setSuccessMsg(null)
    setIntigoPreview(null)
  }

  const isCustom = provider === 'custom'

  const handleIntigoPreview = async () => {
    if (orderIds.length === 0) {
      setErrorMsg(
        'Sélectionnez au moins une commande avant l’analyse Intigo.'
      )
      return
    }

    setIsIntigoPreviewing(true)
    setErrorMsg(null)
    setSuccessMsg(null)
    setIntigoPreview(null)

    try {
      const preview =
        await intigoDeliveryService.previewOrders(orderIds)

      setIntigoPreview(preview)
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Erreur lors de l'analyse Intigo"
      )
    } finally {
      setIsIntigoPreviewing(false)
    }
  }

  const handleExport = async () => {
    // Validate custom columns before hitting the API
    if (isCustom && customColumns.length === 0) {
      setErrorMsg('Veuillez sélectionner au moins une colonne.')
      return
    }

    setIsLoading(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    try {
      const blob = await orderService.exportLogistics(
        orderIds,
        provider,
        fileType,
        isCustom ? customColumns : undefined
      )
      const filename = `${provider}-export.${fileType}`
      triggerDownload(blob, filename)
      setSuccessMsg(`Export téléchargé : ${filename}`)
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Erreur lors de l'export"
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 dark:bg-black/60 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="dark:bg-slate-900 bg-white rounded-xl shadow-2xl border dark:border-slate-700 border-gray-200 max-w-md w-full max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b dark:border-slate-700 border-gray-200 shrink-0">
          <div>
            <h2 className="text-lg font-semibold dark:text-white text-gray-900">
              Export Logistique
            </h2>
            <p className="text-sm dark:text-slate-400 text-gray-500 mt-0.5">
              {orderIds.length > 0
                ? `${orderIds.length} commande(s) sélectionnée(s)`
                : 'Toutes les commandes'}
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="p-2 rounded-lg dark:hover:bg-slate-800 hover:bg-gray-100 transition-colors disabled:opacity-50"
            aria-label="Fermer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">

          {/* Error / Success */}
          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-600 dark:text-green-400 text-sm">
              {successMsg}
            </div>
          )}

          {/* Provider selection */}
          <div>
            <label className="block text-sm font-medium mb-2 dark:text-white text-gray-900">
              Partenaire logistique
            </label>
            <div className="grid grid-cols-1 gap-2">
              {PROVIDERS.map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  disabled={!opt.enabled || isBusy}
                  onClick={() => opt.enabled && handleProviderChange(opt.id)}
                  className={[
                    'flex items-center justify-between w-full px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all',
                    opt.enabled
                      ? provider === opt.id
                        ? 'border-blue-500 dark:bg-blue-500/10 bg-blue-50 dark:text-blue-400 text-blue-600'
                        : 'dark:border-slate-600 border-gray-300 dark:text-white text-gray-900 dark:hover:border-slate-500 hover:border-gray-400'
                      : 'dark:border-slate-700 border-gray-200 dark:text-slate-600 text-gray-400 cursor-not-allowed opacity-60',
                  ].join(' ')}
                >
                  <span>{opt.label}</span>
                  {!opt.enabled && (
                    <span className="text-xs dark:text-slate-500 text-gray-400 font-normal">
                      Bientôt disponible
                    </span>
                  )}
                  {opt.enabled && provider === opt.id && (
                    <svg className="w-4 h-4 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414L8.414 15 3.293 9.879a1 1 0 011.414-1.414L8.414 12.172l6.879-6.879a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>


          {isIntigo && (
            <div className="space-y-4">
              <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-4">
                <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">
                  Connexion API Intigo
                </p>

                <p className="mt-1 text-xs text-blue-700/80 dark:text-blue-300/80">
                  Confirmed vérifie les commandes avant tout envoi.
                  Cette étape ne crée aucun colis chez Intigo.
                </p>
              </div>

              {intigoPreview && (
                <div className="space-y-4 rounded-xl border border-gray-200 p-4 dark:border-slate-700">

                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                      Résultat de l&apos;analyse Intigo
                    </h3>

                    <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                      {intigoPreview.summary?.selected ?? orderIds.length}
                      {' '}commande(s) analysée(s)
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg bg-green-500/10 p-3 text-green-600 dark:text-green-400">
                      <p className="text-xs font-semibold">Prêtes</p>
                      <p className="mt-1 text-xl font-bold">{intigoReady.length}</p>
                    </div>

                    <div className="rounded-lg bg-amber-500/10 p-3 text-amber-600 dark:text-amber-400">
                      <p className="text-xs font-semibold">À vérifier</p>
                      <p className="mt-1 text-xl font-bold">{intigoReview.length}</p>
                    </div>

                    <div className="rounded-lg bg-blue-500/10 p-3 text-blue-600 dark:text-blue-400">
                      <p className="text-xs font-semibold">Déjà envoyées</p>
                      <p className="mt-1 text-xl font-bold">{intigoDuplicate.length}</p>
                    </div>

                    <div className="rounded-lg bg-red-500/10 p-3 text-red-600 dark:text-red-400">
                      <p className="text-xs font-semibold">Invalides</p>
                      <p className="mt-1 text-xl font-bold">{intigoInvalid.length}</p>
                    </div>
                  </div>

                  {intigoReady.map((item, index) => (
                    <div
                      key={item.orderId || `ready-${index}`}
                      className="rounded-lg border border-green-500/20 bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-400"
                    >
                      <div className="flex justify-between gap-3">
                        <span className="font-semibold">
                          Commande #{item.confirmedId ?? '—'}
                        </span>
                        <span>Prête</span>
                      </div>
                    </div>
                  ))}

                  {intigoReview.map((item, index) => (
                    <div
                      key={item.orderId || `review-${index}`}
                      className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400"
                    >
                      <div className="flex justify-between gap-3">
                        <span className="font-semibold">
                          Commande #{item.confirmedId ?? '—'}
                        </span>
                        <span>À vérifier</span>
                      </div>

                      {[...(item.warnings || []), ...(item.errors || [])]
                        .map((message, i) => (
                          <p key={`${message}-${i}`} className="mt-1 text-xs">
                            • {message}
                          </p>
                        ))}
                    </div>
                  ))}

                  {intigoDuplicate.map((item, index) => (
                    <div
                      key={item.orderId || `duplicate-${index}`}
                      className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-3 text-sm text-blue-700 dark:text-blue-400"
                    >
                      <div className="flex justify-between gap-3">
                        <span className="font-semibold">
                          Commande #{item.confirmedId ?? '—'}
                        </span>
                        <span>Déjà envoyée</span>
                      </div>

                      {item.externalId && (
                        <p className="mt-2 text-xs">
                          N° de suivi :{' '}
                          <span className="font-mono font-semibold">
                            {item.externalId}
                          </span>
                        </p>
                      )}
                    </div>
                  ))}

                  {intigoInvalid.map((item, index) => (
                    <div
                      key={item.orderId || `invalid-${index}`}
                      className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-400"
                    >
                      <div className="flex justify-between gap-3">
                        <span className="font-semibold">
                          Commande #{item.confirmedId ?? '—'}
                        </span>
                        <span>Invalide</span>
                      </div>

                      {(item.errors || []).map((message, i) => (
                        <p key={`${message}-${i}`} className="mt-1 text-xs">
                          • {message}
                        </p>
                      ))}
                    </div>
                  ))}

                  <div className="rounded-lg bg-gray-50 p-3 text-xs text-gray-500 dark:bg-slate-800 dark:text-slate-400">
                    Aucun colis n&apos;a été créé.
                    Aucun envoi réel n&apos;a été déclenché.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Custom column selector — only shown when provider === custom */}
          {isCustom && (
            <div className="p-4 rounded-lg dark:bg-slate-800/50 bg-gray-50 border dark:border-slate-700 border-gray-200">
              <p className="text-sm font-medium mb-3 dark:text-white text-gray-900">
                Colonnes à exporter
              </p>
              <ColumnSelector
                selected={customColumns}
                onChange={setCustomColumns}
                disabled={isLoading}
              />
              {customColumns.length === 0 && (
                <p className="mt-2 text-xs text-red-500">
                  Sélectionnez au moins une colonne pour exporter.
                </p>
              )}
            </div>
          )}

          {/* File type selection */}
          {!isIntigo && (
            <div>
            <label className="block text-sm font-medium mb-2 dark:text-white text-gray-900">
              Format du fichier
            </label>
            <div className="flex gap-3">
              {(['csv', 'xlsx'] as FileType[]).map(ft => (
                <button
                  key={ft}
                  type="button"
                  disabled={isLoading}
                  onClick={() => setFileType(ft)}
                  className={[
                    'flex-1 px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition-all uppercase',
                    fileType === ft
                      ? 'border-blue-500 dark:bg-blue-500/10 bg-blue-50 dark:text-blue-400 text-blue-600'
                      : 'dark:border-slate-600 border-gray-300 dark:text-white text-gray-900 dark:hover:border-slate-500 hover:border-gray-400',
                    isLoading ? 'opacity-50 cursor-not-allowed' : '',
                  ].join(' ')}
                >
                  {ft}
                </button>
              ))}
            </div>
          </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t dark:border-slate-700 border-gray-200 shrink-0">
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className="flex-1 px-4 py-3 dark:bg-slate-800 bg-white dark:text-white text-gray-700 border-2 dark:border-slate-700 border-gray-300 rounded-lg hover:opacity-80 transition-opacity font-medium disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={
              isIntigo
                ? handleIntigoPreview
                : handleExport
            }
            disabled={
              isBusy ||
              (isIntigo && orderIds.length === 0) ||
              (isCustom && customColumns.length === 0)
            }
            className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
          >
            {isBusy ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />

                {isIntigo
                  ? 'Analyse en cours…'
                  : 'Export en cours…'}
              </>
            ) : isIntigo ? (
              <>Analyser pour Intigo</>
            ) : (
              <>Exporter</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
