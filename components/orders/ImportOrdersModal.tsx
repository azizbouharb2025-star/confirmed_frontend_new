'use client'
import React, { useState, useCallback, useRef } from 'react'
import { clsx } from 'clsx'
import { useLanguage } from '@/hooks/useLanguage'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.confirmed.tn'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB
const ALLOWED_EXTENSIONS = ['.xlsx', '.csv']

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

interface MappingDetail {
  rawHeader: string
  confirmedField: string | null
  confidence: number      // 0–100
  allScores: Record<string, number>
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
  mappingDetails: MappingDetail[]
  unmappedHeaders: string[]
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

// All assignable CONFIRMED fields for the mapping dropdown
const ALL_CONFIRMED_FIELDS = [
  'clientName', 'clientPhone', 'totalAmount', 'productName',
  'quantity', 'region', 'city', 'address', 'orderId', 'notes',
] as const

// Rebuild previewRows from raw file rows using a (possibly edited) column mapping
function derivePreviewRows(
  rawRows: Record<string, string>[],
  mapping: Record<string, string>,    // { confirmedField: rawHeader }
): PreviewRow[] {
  return rawRows.map((raw, i) => {
    const clientName  = raw[mapping.clientName]  ?? ''
    const clientPhone = raw[mapping.clientPhone] ?? ''
    const productName = raw[mapping.productName] ?? ''
    const region      = raw[mapping.region] ?? raw[mapping.city] ?? ''
    const address     = raw[mapping.address]     ?? ''
    const totalAmount = raw[mapping.totalAmount]  ?? ''

    // Minimal re-validation (mirrors backend rule: phone = only hard requirement)
    const cleanPhone = clientPhone.trim().replace(/[\s\-().+]/g, '')
    const phoneOk = cleanPhone.length >= 8 && /^\d+$/.test(cleanPhone)
    const errors: string[]   = phoneOk ? [] : ['Numéro de téléphone invalide']
    const warnings: string[] = []
    if (!clientName.trim() || clientName.trim().length < 2) warnings.push('Nom client manquant ou incomplet')
    if (!address.trim()) warnings.push('Adresse vide')

    const status: PreviewRow['status'] =
      errors.length   > 0 ? 'rejected' :
      warnings.length > 0 ? 'warning'  : 'valid'

    return { rowIndex: i, clientName, clientPhone, productName, region, totalAmount, address,
             status, isDuplicate: false, warnings, errors }
  })
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const cfg =
    confidence >= 90 ? { label: `${confidence}%`, cls: 'bg-green-500/10 text-green-500 border-green-500/20' } :
    confidence >= 60 ? { label: `${confidence}%`, cls: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' } :
                       { label: `${confidence}%`, cls: 'bg-orange-500/10 text-orange-500 border-orange-500/20' }
  return (
    <span className={clsx('inline-block text-xs px-1.5 py-0.5 rounded border font-mono', cfg.cls)}>
      {cfg.label}
    </span>
  )
}

function StatusBadge({
  status,
  warnings,
  errors,
}: {
  status: PreviewRow['status']
  warnings: string[]
  errors: string[]
}) {
  const cfg = {
    valid:            { label: '✓ Valide',        cls: 'bg-green-500/10 text-green-500 border-green-500/20' },
    warning:          { label: '⚠ Vérification',  cls: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
    rejected:         { label: '✗ Rejetée',        cls: 'bg-red-500/10 text-red-500 border-red-500/20' },
    duplicate_ignored:{ label: 'Doublon',          cls: 'bg-gray-500/10 text-gray-400 border-gray-500/20' },
  }[status] ?? { label: status, cls: 'bg-gray-500/10 text-gray-400 border-gray-500/20' }

  // Collect tooltip lines: errors first, then warnings
  const lines = [
    ...errors.map(e => `✗ ${e}`),
    ...warnings.map(w => `⚠ ${w}`),
  ]

  const hasTooltip = lines.length > 0

  return (
    <span className="relative group inline-block">
      <span
        className={clsx(
          'inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded border font-medium',
          hasTooltip ? 'cursor-help' : 'cursor-default',
          cfg.cls,
        )}
      >
        {cfg.label}
        {hasTooltip && (
          <svg className="w-3 h-3 opacity-60 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
      </span>

      {hasTooltip && (
        <span
          className={clsx(
            'pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-50',
            'w-max max-w-[220px] rounded-lg px-3 py-2 text-xs leading-snug shadow-xl',
            'dark:bg-slate-700 bg-gray-800 text-white',
            'opacity-0 group-hover:opacity-100 transition-opacity duration-150',
            // small arrow
            'after:content-[""] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2',
            'after:border-4 after:border-transparent after:border-t-gray-800 dark:after:border-t-slate-700',
          )}
          role="tooltip"
        >
          <ul className="space-y-0.5">
            {lines.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </span>
      )}
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

// ─── Row detail / edit panel ──────────────────────────────────────────────────

interface RowDetailPanelProps {
  row: PreviewRow
  onClose: () => void
  onSave: (updated: PreviewRow) => void
}

function RowDetailPanel({ row, onClose, onSave }: RowDetailPanelProps) {
  const [draft, setDraft] = useState<PreviewRow>({ ...row })

  const field = (
    label: string,
    key: keyof PreviewRow,
    type: 'text' | 'tel' | 'number' = 'text',
    placeholder = '',
  ) => (
    <div>
      <label className="block text-xs font-medium mb-1 dark:text-slate-300 text-gray-600">
        {label}
      </label>
      <input
        type={type}
        value={String(draft[key] ?? '')}
        onChange={e => setDraft(prev => ({ ...prev, [key]: e.target.value }))}
        placeholder={placeholder}
        className="w-full px-3 py-2 text-sm rounded-lg dark:bg-slate-800 bg-gray-50 border dark:border-slate-600 border-gray-300 dark:text-white text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
      />
    </div>
  )

  return (
    <>
      {/* panel header */}
      <div className="flex items-center justify-between px-4 py-3 border-b dark:border-slate-700 border-gray-200 shrink-0">
        <span className="text-sm font-semibold dark:text-white text-gray-900">
          Détails — ligne {row.rowIndex + 1}
        </span>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg dark:hover:bg-slate-800 hover:bg-gray-100 transition-colors dark:text-slate-400 text-gray-500"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* status badge */}
      <div className="px-4 py-2 shrink-0 border-b dark:border-slate-700/50 border-gray-100">
        <StatusBadge
          status={draft.status}
          warnings={draft.warnings ?? []}
          errors={draft.errors ?? []}
        />
      </div>

      {/* scrollable fields */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {field('Nom client',    'clientName',  'text',   'ex: Ahmed Ben Ali')}
        {field('Téléphone',     'clientPhone', 'tel',    'ex: 21234567')}
        {field('Produit',       'productName', 'text',   'ex: Pack De Deux Hachoirs')}
        {field('Région',        'region',      'text',   'ex: Tunis')}
        {field('Adresse',       'address',     'text',   'ex: Rue Habib Bourguiba')}
        {field('Montant (TND)', 'totalAmount', 'number', 'ex: 49.900')}

        {(draft.warnings.length > 0 || draft.errors.length > 0) && (
          <div className="rounded-lg dark:bg-slate-800 bg-gray-50 border dark:border-slate-700 border-gray-200 p-3 space-y-1">
            <p className="text-xs font-medium dark:text-slate-300 text-gray-600 mb-1">Problèmes détectés</p>
            {draft.errors.map((e, i) => (
              <p key={i} className="text-xs text-red-500 flex items-start gap-1"><span className="shrink-0">✗</span>{e}</p>
            ))}
            {draft.warnings.map((w, i) => (
              <p key={i} className="text-xs text-yellow-500 flex items-start gap-1"><span className="shrink-0">⚠</span>{w}</p>
            ))}
          </div>
        )}

        <p className="text-xs dark:text-slate-500 text-gray-400 pt-1">
          Modifiez les champs puis cliquez sur <strong>Enregistrer</strong>.
        </p>
      </div>

      {/* actions */}
      <div className="flex gap-2 px-4 py-3 border-t dark:border-slate-700 border-gray-200 shrink-0">
        <button
          onClick={onClose}
          className="flex-1 px-3 py-2 text-sm dark:bg-slate-800 bg-white dark:text-slate-300 text-gray-600 border dark:border-slate-700 border-gray-300 rounded-lg hover:opacity-80 transition-opacity"
        >
          Annuler
        </button>
        <button
          onClick={() => onSave(draft)}
          className="flex-1 px-3 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
        >
          Enregistrer
        </button>
      </div>
    </>
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
  // local editable copy of preview rows (survives edits without re-fetching)
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([])
  // currently selected row for detail panel
  const [selectedRow, setSelectedRow] = useState<PreviewRow | null>(null)
  // user-editable column mapping (starts from AI detection, can be corrected)
  const [userMapping, setUserMapping] = useState<Record<string, string>>({})
  // raw file rows kept in memory so mapping changes re-derive preview instantly
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([])

  const reset = useCallback(() => {
    setFile(null)
    setFileError(null)
    setApiError(null)
    setResult(null)
    setPreviewRows([])
    setSelectedRow(null)
    setUserMapping({})
    setRawRows([])
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

      // Normalise API response — guard every array/object field against null
      const safe: AnalyzeResult = {
        ...data,
        columnMapping: data.columnMapping ?? {},
        headers:       data.headers       ?? [],
        insights:      data.insights      ?? [],
        previewRows:  (data.previewRows   ?? []).map((r: PreviewRow) => ({
          ...r,
          warnings: r.warnings ?? [],
          errors:   r.errors   ?? [],
        })),
      }
      setResult(safe)
      setPreviewRows(safe.previewRows)
      setUserMapping(safe.columnMapping)
      // Store raw rows: the API returns previewRows as mapped values, but we need the
      // original file rows to re-derive when the user changes a mapping.
      // We reconstruct them from previewRows + the original headers mapping.
      // Actually we store them keyed by rawHeader so re-mapping works correctly.
      // The backend doesn't return raw rows, so we build a synthetic rawRows structure
      // from previewRows using the inverse of columnMapping.
      const inverseMapping: Record<string, string> = {}
      Object.entries(safe.columnMapping).forEach(([field, raw]) => { inverseMapping[field] = raw })
      const syntheticRaws: Record<string, string>[] = safe.previewRows.map(pr => {
        const row: Record<string, string> = {}
        Object.entries(inverseMapping).forEach(([field, rawHeader]) => {
          const val = (pr as unknown as Record<string, string>)[field] ?? ''
          row[rawHeader] = val
        })
        return row
      })
      setRawRows(syntheticRaws)
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Erreur inattendue')
    } finally {
      setLoading(false)
    }
  }, [file])

  // Save edits from the detail panel back into the local previewRows list
  const handleRowSave = useCallback((updated: PreviewRow) => {
    // Re-derive status: if phone is present → at least warning, else rejected
    const hasPhone = updated.clientPhone.trim().replace(/[\s\-\(\)\+\.]/g, '').length >= 8
    const newErrors  = hasPhone ? [] : ['Numéro de téléphone invalide']
    const newWarnings: string[] = []
    if (!updated.clientName || updated.clientName.trim().length < 2)  newWarnings.push('Nom client manquant ou incomplet')
    if (!updated.address    || updated.address.trim()    === '')       newWarnings.push('Adresse vide')
    if (!updated.totalAmount || parseFloat(updated.totalAmount) < 0)   newWarnings.push('Montant invalide')

    const newStatus: PreviewRow['status'] =
      newErrors.length > 0   ? 'rejected' :
      newWarnings.length > 0 ? 'warning'  : 'valid'

    const saved: PreviewRow = {
      ...updated,
      errors:   newErrors,
      warnings: newWarnings,
      status:   updated.isDuplicate ? updated.status : newStatus,
    }

    setPreviewRows(prev => prev.map(r => r.rowIndex === saved.rowIndex ? saved : r))
    setSelectedRow(null)
  }, [])

  // Handle user changing a column mapping via the dropdown
  // Re-derives previewRows immediately so the table reflects the correction
  const handleMappingChange = useCallback((rawHeader: string, newField: string | null) => {
    setUserMapping(prev => {
      // Remove this rawHeader from any existing field assignment
      const next: Record<string, string> = {}
      Object.entries(prev).forEach(([field, rh]) => {
        if (rh !== rawHeader) next[field] = rh
      })
      // Assign to new field (unless user chose "— ignorer —")
      if (newField) next[newField] = rawHeader
      // Re-derive preview rows from raw data with updated mapping
      if (rawRows.length > 0) {
        setPreviewRows(derivePreviewRows(rawRows, next))
      }
      return next
    })
  }, [rawRows])

  if (!isOpen) return null

  const mappedFields = result?.columnMapping ? Object.keys(result.columnMapping) : []

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

              {/* Detected columns — editable mapping table */}
              {result.mappingDetails && result.mappingDetails.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold dark:text-white text-gray-900 mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    {t('import.columnDetection')}
                    <span className="text-xs font-normal dark:text-slate-400 text-gray-500 ml-1">
                      — corrigez si nécessaire
                    </span>
                  </h3>

                  <div className="rounded-lg border dark:border-slate-700 border-gray-200 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b dark:border-slate-700 border-gray-200 dark:bg-slate-800/50 bg-gray-50">
                          <th className="text-left px-4 py-2 font-medium dark:text-slate-300 text-gray-600 w-1/3">Colonne fichier</th>
                          <th className="text-left px-4 py-2 font-medium dark:text-slate-300 text-gray-600 w-1/3">Champ CONFIRMED</th>
                          <th className="text-left px-4 py-2 font-medium dark:text-slate-300 text-gray-600 w-1/4">Confiance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.mappingDetails.map((detail) => {
                          // Current assignment for this rawHeader in userMapping
                          const currentField = Object.entries(userMapping).find(
                            ([, rh]) => rh === detail.rawHeader
                          )?.[0] ?? null

                          return (
                            <tr key={detail.rawHeader} className="border-b dark:border-slate-700/50 border-gray-100 last:border-0">
                              {/* Raw header */}
                              <td className="px-4 py-2">
                                <code className="px-2 py-0.5 rounded dark:bg-slate-700 bg-gray-100 text-xs dark:text-slate-300 text-gray-700">
                                  {detail.rawHeader}
                                </code>
                              </td>

                              {/* Editable field dropdown */}
                              <td className="px-4 py-2">
                                <select
                                  value={currentField ?? ''}
                                  onChange={e => handleMappingChange(detail.rawHeader, e.target.value || null)}
                                  className="w-full text-xs px-2 py-1.5 rounded-lg dark:bg-slate-800 bg-white border dark:border-slate-600 border-gray-300 dark:text-white text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer"
                                >
                                  <option value="">— ignorer —</option>
                                  {ALL_CONFIRMED_FIELDS.map(f => (
                                    <option
                                      key={f}
                                      value={f}
                                      disabled={f !== currentField && Object.values(userMapping).includes(detail.rawHeader) === false && userMapping[f] !== undefined && userMapping[f] !== detail.rawHeader}
                                    >
                                      {FIELD_LABELS[f] ?? f}
                                      {userMapping[f] && userMapping[f] !== detail.rawHeader ? ' ✓' : ''}
                                    </option>
                                  ))}
                                </select>
                              </td>

                              {/* Confidence badge */}
                              <td className="px-4 py-2">
                                {detail.confirmedField ? (
                                  <ConfidenceBadge confidence={detail.confidence} />
                                ) : (
                                  <span className="text-xs dark:text-slate-500 text-gray-400 italic">non détectée</span>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Unmapped columns notice */}
                  {result.unmappedHeaders && result.unmappedHeaders.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5 items-center">
                      <span className="text-xs dark:text-slate-400 text-gray-500 shrink-0">Colonnes ignorées :</span>
                      {result.unmappedHeaders.map(h => (
                        <code key={h} className="text-xs px-1.5 py-0.5 rounded dark:bg-slate-800 bg-gray-100 dark:text-slate-400 text-gray-500 border dark:border-slate-700 border-gray-200">
                          {h}
                        </code>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Preview table */}
              {previewRows.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold dark:text-white text-gray-900 mb-2">
                    {t('import.preview')}
                  </h3>
                  <div className="rounded-lg border dark:border-slate-700 border-gray-200 overflow-auto max-h-64">
                    <table className="w-full text-xs min-w-[640px]">
                      <thead className="sticky top-0 dark:bg-slate-800 bg-gray-100 z-10">
                        <tr>
                          {['Nom', 'Téléphone', 'Produit', 'Région', 'Montant', 'Statut', ''].map((h, i) => (
                            <th key={i} className="text-left px-3 py-2 font-medium dark:text-slate-300 text-gray-600 whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {previewRows.slice(0, 50).map((row) => (
                          <tr
                            key={row.rowIndex}
                            onClick={() => setSelectedRow(row)}
                            className="border-t dark:border-slate-700/50 border-gray-100 dark:hover:bg-slate-800/60 hover:bg-blue-50/60 cursor-pointer group transition-colors"
                          >
                            <td className="px-3 py-1.5 dark:text-white text-gray-900 max-w-[140px] truncate">{row.clientName || '—'}</td>
                            <td className="px-3 py-1.5 dark:text-slate-300 text-gray-700 font-mono">{row.clientPhone || '—'}</td>
                            <td className="px-3 py-1.5 dark:text-slate-300 text-gray-700 max-w-[120px] truncate">{row.productName || '—'}</td>
                            <td className="px-3 py-1.5 dark:text-slate-400 text-gray-500">{row.region || '—'}</td>
                            <td className="px-3 py-1.5 dark:text-slate-300 text-gray-700 whitespace-nowrap">{row.totalAmount || '—'}</td>
                            <td className="px-3 py-1.5">
                              <StatusBadge
                                status={row.status}
                                warnings={row.warnings ?? []}
                                errors={row.errors ?? []}
                              />
                            </td>
                            {/* edit hint */}
                            <td className="px-2 py-1.5 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                              <svg className="w-3.5 h-3.5 dark:text-slate-400 text-gray-400 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 0l.172.172a2 2 0 010 2.828L12 16H9v-3z" />
                              </svg>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {previewRows.length > 50 && (
                      <p className="text-center text-xs dark:text-slate-500 text-gray-400 py-2">
                        + {previewRows.length - 50} lignes supplémentaires
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

      {/* Row detail panel — fixed z-[60] so modal overflow:hidden cannot clip it */}
      {selectedRow && (
        <div
          className="fixed inset-0 z-[60] flex justify-end"
          onClick={() => setSelectedRow(null)}
        >
          <div
            className="w-80 h-full dark:bg-slate-900 bg-white border-l dark:border-slate-700 border-gray-200 flex flex-col shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <RowDetailPanel
              row={selectedRow}
              onClose={() => setSelectedRow(null)}
              onSave={handleRowSave}
            />
          </div>
        </div>
      )}
    </div>
  )
}

