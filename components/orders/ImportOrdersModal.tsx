'use client'
import React, { useState, useCallback, useRef } from 'react'
import { clsx } from 'clsx'
import { useLanguage } from '@/hooks/useLanguage'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.confirmed.tn'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB
const ALLOWED_EXTENSIONS = ['.xlsx', '.csv']
const ALLOWED_MIME = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'text/csv',
  'text/plain',
  'application/csv',
]

// ─── Types ────────────────────────────────────────────────────────────────────

interface PreviewRow {
  rowIndex: number
  clientName: string
  clientPhone: string
  productName: string
  region: string
  totalAmount: string
  address: string
  status: 'valid' | 'warning' | 'rejected' | 'duplicate_ignored'
  isDuplicate: boolean
  warnings: string[]
  errors: string[]
}

interface AnalyzeResult {
  success: boolean
  dryRun: boolean
  fileName: string
  totalDetected: number
  totalValid: number
  totalRejected: number
  totalDuplicates: number
  columnMapping: Record<string, string>
  headers: string[]
  insights: string[]
  previewRows: PreviewRow[]
}

interface ImportOrdersModalProps {
  isOpen: boolean
  onClose: () => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem('auth-storage')
    if (!raw) return null
    return JSON.parse(raw)?.state?.token ?? null
  } catch {
    return null
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function validateFile(file: File): string | null {
  const ext = '.' + file.name.split('.').pop()?.toLowerCase()
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return `Format non supporté. Utilisez XLSX ou CSV.`
  }
  if (file.size > MAX_FILE_SIZE) {
    return `Fichier trop volumineux (max ${formatBytes(MAX_FILE_SIZE)}).`
  }
  return null
}

const FIELD_LABELS: Record<string, string> = {
  clientName: 'Nom Client',
  clientPhone: 'Téléphone',
  region: 'Région',
  city: 'Ville',
  address: 'Adresse',
  totalAmount: 'Montant',
  productName: 'Produit',
  quantity: 'Quantité',
  orderId: 'N° Commande',
  notes: 'Notes',
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: PreviewRow['status'] }) {
  const cfg = {
    valid: { label: '✓ Valide', cls: 'bg-green-500/10 text-green-500 border-green-500/20' },
    warning: { label: '⚠ Vérification', cls: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
    rejected: { label: '✗ Rejetée', cls: 'bg-red-500/10 text-red-500 border-red-500/20' },
    duplicate_ignored: { label: 'Doublon', cls: 'bg-gray-500/10 text-gray-400 border-gray-500/20' },
  }[status] ?? { label: status, cls: 'bg-gray-500/10 text-gray-400 border-gray-500/20' }

  return (
    <span className={clsx('inline-block text-xs px-2 py-0.5 rounded border font-medium', cfg.cls)}>
      {cfg.label}
    </span>
  )
}

function SummaryCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={clsx('rounded-lg border p-3 text-center', color)}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs mt-0.5 opacity-80">{label}</p>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ImportOrdersModal({ isOpen, onClose }: ImportOrdersModalProps) {
  const { t } = useLanguage()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [result, setResult] = useState<AnalyzeResult | null>(null)

  const reset = useCallback(() => {
    setFile(null)
    setFileError(null)
    setApiError(null)
    setResult(null)
    setLoading(false)
    setIsDragging(false)
  }, [])

  const handleClose = useCallback(() => {
    reset()
    onClose()
  }, [reset, onClose])

  const handleFileAccepted = useCallback((accepted: File) => {
    const err = validateFile(accepted)
    if (err) {
      setFileError(err)
      setFile(null)
      return
    }
    setFileError(null)
    setApiError(null)
    setResult(null)
    setFile(accepted)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) handleFileAccepted(dropped)
  }, [handleFileAccepted])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0]
    if (picked) handleFileAccepted(picked)
    e.target.value = ''
  }, [handleFileAccepted])

  const handleAnalyze = useCallback(async () => {
    if (!file) return
    setLoading(true)
    setApiError(null)
    setResult(null)

    try {
      const token = getAuthToken()
      const form = new FormData()
      form.append('file', file)

      const response = await fetch(`${API_BASE_URL}/api/orders/import/preview`, {
        method: 'POST',
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: form,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.error || `Erreur ${response.status}`)
      }

      setResult(data as AnalyzeResult)
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Erreur inattendue')
    } finally {
      setLoading(false)
    }
  }, [file])

  if (!isOpen) return null

  const mappedFields = result ? Object.keys(result.columnMapping) : []

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
    >
      <div className="dark:bg-slate-900 bg-white rounded-xl shadow-2xl border dark:border-slate-700 border-gray-200 w-full max-w-3xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b dark:border-slate-700 border-gray-200 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold dark:text-white text-gray-900">
                {t('import.title')}
              </h2>
              <p className="text-xs dark:text-slate-400 text-gray-500">{t('import.subtitle')}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg dark:hover:bg-slate-800 hover:bg-gray-100 transition-colors dark:text-slate-400 text-gray-500"
            aria-label="Fermer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-6">

          {/* Drop zone */}
          <div
            role="button"
            tabIndex={0}
            aria-label="Zone de dépôt de fichier"
            className={clsx(
              'relative rounded-xl border-2 border-dashed transition-colors cursor-pointer',
              'flex flex-col items-center justify-center gap-3 py-10 px-6 text-center',
              isDragging
                ? 'border-blue-500 bg-blue-500/5'
                : file
                  ? 'border-green-500/50 dark:bg-green-500/5 bg-green-50'
                  : fileError
                    ? 'border-red-500/50 dark:bg-red-500/5 bg-red-50'
                    : 'dark:border-slate-600 border-gray-300 dark:hover:border-blue-500/50 hover:border-blue-400 dark:bg-slate-800/30 bg-gray-50'
            )}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click() }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.csv"
              className="hidden"
              onChange={handleInputChange}
            />

            {file ? (
              <>
                <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium dark:text-white text-gray-900">{file.name}</p>
                  <p className="text-sm dark:text-slate-400 text-gray-500">{formatBytes(file.size)}</p>
                </div>
                <p className="text-xs dark:text-slate-500 text-gray-400">Cliquer pour changer de fichier</p>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full dark:bg-slate-700 bg-gray-100 flex items-center justify-center">
                  <svg className="w-6 h-6 dark:text-slate-400 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium dark:text-white text-gray-900">{t('import.dropzone')}</p>
                  <p className="text-sm dark:text-slate-400 text-gray-500 mt-1">{t('import.formats')}</p>
                </div>
              </>
            )}
          </div>

          {/* File validation error */}
          {fileError && (
            <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {fileError}
            </div>
          )}

          {/* API error */}
          {apiError && (
            <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span><strong>Erreur :</strong> {apiError}</span>
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-5">

              {/* File meta */}
              <div className="flex items-center gap-3 px-4 py-3 dark:bg-slate-800 bg-gray-50 rounded-lg">
                <svg className="w-5 h-5 text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="font-medium dark:text-white text-gray-900 truncate">{result.fileName}</p>
                  <p className="text-sm dark:text-slate-400 text-gray-500">
                    {result.totalDetected} {t('import.linesDetected')}
                  </p>
                </div>
              </div>

              {/* Summary cards */}
              <div className="grid grid-cols-4 gap-3">
                <SummaryCard
                  label={t('import.totalDetected')}
                  value={result.totalDetected}
                  color="dark:bg-slate-800 bg-gray-50 dark:border-slate-700 border-gray-200 dark:text-white text-gray-900"
                />
                <SummaryCard
                  label={t('import.totalValid')}
                  value={result.totalValid}
                  color="dark:bg-green-500/10 bg-green-50 dark:border-green-500/20 border-green-200 text-green-600 dark:text-green-400"
                />
                <SummaryCard
                  label={t('import.totalRejected')}
                  value={result.totalRejected}
                  color="dark:bg-red-500/10 bg-red-50 dark:border-red-500/20 border-red-200 text-red-600 dark:text-red-400"
                />
                <SummaryCard
                  label={t('import.totalDuplicates')}
                  value={result.totalDuplicates}
                  color="dark:bg-yellow-500/10 bg-yellow-50 dark:border-yellow-500/20 border-yellow-200 text-yellow-600 dark:text-yellow-400"
                />
              </div>

              {/* Detected columns */}
              {mappedFields.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold dark:text-white text-gray-900 mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    {t('import.columnDetection')}
                  </h3>
                  <div className="dark:bg-slate-800/50 bg-gray-50 rounded-lg border dark:border-slate-700 border-gray-200 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b dark:border-slate-700 border-gray-200">
                          <th className="text-left px-4 py-2 font-medium dark:text-slate-300 text-gray-600">{t('import.confirmedField')}</th>
                          <th className="text-left px-4 py-2 font-medium dark:text-slate-300 text-gray-600">{t('import.fileColumn')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mappedFields.map((field) => (
                          <tr key={field} className="border-b dark:border-slate-700/50 border-gray-100 last:border-0">
                            <td className="px-4 py-2 dark:text-white text-gray-900 font-medium">
                              {FIELD_LABELS[field] ?? field}
                            </td>
                            <td className="px-4 py-2">
                              <code className="px-2 py-0.5 rounded dark:bg-slate-700 bg-gray-200 text-xs dark:text-slate-300 text-gray-700">
                                {result.columnMapping[field]}
                              </code>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Preview table */}
              {result.previewRows.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold dark:text-white text-gray-900 mb-2">
                    {t('import.preview')}
                  </h3>
                  <div className="rounded-lg border dark:border-slate-700 border-gray-200 overflow-auto max-h-64">
                    <table className="w-full text-xs min-w-[640px]">
                      <thead className="sticky top-0 dark:bg-slate-800 bg-gray-100 z-10">
                        <tr>
                          {['Nom', 'Téléphone', 'Produit', 'Région', 'Montant', 'Statut'].map(h => (
                            <th key={h} className="text-left px-3 py-2 font-medium dark:text-slate-300 text-gray-600 whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {result.previewRows.slice(0, 50).map((row) => (
                          <tr
                            key={row.rowIndex}
                            className="border-t dark:border-slate-700/50 border-gray-100 dark:hover:bg-slate-800/40 hover:bg-gray-50"
                          >
                            <td className="px-3 py-1.5 dark:text-white text-gray-900 max-w-[140px] truncate">{row.clientName || '—'}</td>
                            <td className="px-3 py-1.5 dark:text-slate-300 text-gray-700 font-mono">{row.clientPhone || '—'}</td>
                            <td className="px-3 py-1.5 dark:text-slate-300 text-gray-700 max-w-[120px] truncate">{row.productName || '—'}</td>
                            <td className="px-3 py-1.5 dark:text-slate-400 text-gray-500">{row.region || '—'}</td>
                            <td className="px-3 py-1.5 dark:text-slate-300 text-gray-700 whitespace-nowrap">{row.totalAmount || '—'}</td>
                            <td className="px-3 py-1.5">
                              <StatusBadge status={row.status} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {result.previewRows.length > 50 && (
                      <p className="text-center text-xs dark:text-slate-500 text-gray-400 py-2">
                        + {result.previewRows.length - 50} lignes supplémentaires
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t dark:border-slate-700 border-gray-200 shrink-0">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2.5 dark:bg-slate-800 bg-white dark:text-white text-gray-700 border dark:border-slate-700 border-gray-300 rounded-lg hover:opacity-80 transition-opacity font-medium text-sm"
          >
            {t('orders.cancel')}
          </button>
          <button
            onClick={result ? reset : handleAnalyze}
            disabled={!file || loading}
            className="flex-1 px-4 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {t('import.analyzing')}
              </>
            ) : result ? (
              t('import.btnBack')
            ) : (
              t('import.btnPreview')
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

