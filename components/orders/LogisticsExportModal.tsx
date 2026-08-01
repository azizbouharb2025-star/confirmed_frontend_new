'use client'

/**
 * LogisticsExportModal
 *
 * Allows the user to export selected orders to a logistics provider format.
 * Supported:  generic, intigo, aramex, rapid_poste, yalidine
 * Coming soon: custom
 */

import React, { useState } from 'react'
import { orderService } from '@/services/orderService'

// ─── Types ──────────────────────────────────────────────────────────────────

type Provider = 'generic' | 'intigo' | 'aramex' | 'rapid_poste' | 'yalidine' | 'custom'
type FileType = 'csv' | 'xlsx'

interface ProviderOption {
  id: Provider
  label: string
  enabled: boolean
}

// ─── Constants ───────────────────────────────────────────────────────────────

const PROVIDERS: ProviderOption[] = [
  { id: 'generic',     label: 'Generic',      enabled: true  },
  { id: 'intigo',      label: 'Intigo',        enabled: true  },
  { id: 'aramex',      label: 'Aramex',        enabled: true  },
  { id: 'rapid_poste', label: 'Rapid Poste',   enabled: true  },
  { id: 'yalidine',    label: 'Yalidine',       enabled: true  },
  { id: 'custom',      label: 'Custom',        enabled: false },
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

// ─── Component ────────────────────────────────────────────────────────────────

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
  const [provider,   setProvider]   = useState<Provider>('generic')
  const [fileType,   setFileType]   = useState<FileType>('csv')
  const [isLoading,  setIsLoading]  = useState(false)
  const [errorMsg,   setErrorMsg]   = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  if (!isOpen) return null

  const handleClose = () => {
    if (isLoading) return
    setErrorMsg(null)
    setSuccessMsg(null)
    onClose()
  }

  const handleExport = async () => {
    setIsLoading(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    try {
      const blob     = await orderService.exportLogistics(orderIds, provider, fileType)
      const filename = `${provider}-export.${fileType}`
      triggerDownload(blob, filename)
      setSuccessMsg(`Export téléchargé : ${filename}`)
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Erreur lors de l\'export'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 dark:bg-black/60 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="dark:bg-slate-900 bg-white rounded-xl shadow-2xl border dark:border-slate-700 border-gray-200 max-w-md w-full">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b dark:border-slate-700 border-gray-200">
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

        {/* Body */}
        <div className="p-6 space-y-5">

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
                  disabled={!opt.enabled || isLoading}
                  onClick={() => opt.enabled && setProvider(opt.id)}
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

          {/* File type selection */}
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
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t dark:border-slate-700 border-gray-200">
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
            onClick={handleExport}
            disabled={isLoading}
            className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                Export en cours…
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Exporter
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
