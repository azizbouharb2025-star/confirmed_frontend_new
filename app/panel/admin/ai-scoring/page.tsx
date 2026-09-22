'use client'

import { useEffect, useState } from 'react'
import {
  AdjustmentsHorizontalIcon,
  CheckCircleIcon,
  ClockIcon,
  MapPinIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline'

import api from '@/lib/api'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

interface GeneralConfig {
  baseScore: number
  minimumScore: number
  maximumScore: number
}

interface AddressElementConfig {
  enabled?: boolean
  impact?: number
  priority?: number
  [key: string]: unknown
}

interface AddressLevelConfig {
  key: string
  label: string
  enabled?: boolean
  impact?: number
  priority?: number
  [key: string]: unknown
}

interface AddressConfig {
  enabled?: boolean
  mode?: 'exclusive' | 'cumulative'

  elements?: {
    street?: AddressElementConfig
    city?: AddressElementConfig
    governorate?: AddressElementConfig
    postalCode?: AddressElementConfig
    [key: string]: unknown
  }

  levels?: AddressLevelConfig[]

  [key: string]: unknown
}

interface RangeRuleConfig {
  _id?: string
  key: string
  label: string
  enabled?: boolean
  min?: number | null
  max?: number | null
  includeMin?: boolean
  includeMax?: boolean
  impact?: number
  order?: number
  [key: string]: unknown
}

interface OrderValueConfig {
  enabled?: boolean

  absoluteValue?: {
    enabled?: boolean
    rules?: RangeRuleConfig[]
    [key: string]: unknown
  }

  relativeToHistory?: {
    enabled?: boolean
    minimumHistoricalOrders?: number
    rules?: RangeRuleConfig[]
    [key: string]: unknown
  }

  [key: string]: unknown
}

interface AbsoluteValueForm {
  enabled: boolean

  rules: Array<{
    _id?: string
    key: string
    label: string
    enabled: boolean
    min: string
    max: string
    includeMin: boolean
    includeMax: boolean
    impact: string
    order: number
  }>
}

const absoluteValueToForm = (
  orderValue?: OrderValueConfig
): AbsoluteValueForm => ({
  enabled:
    orderValue?.absoluteValue
      ?.enabled !== false,

  rules:
    (
      orderValue
        ?.absoluteValue
        ?.rules || []
    ).map((rule, index) => ({
      _id:
        rule._id,

      key:
        rule.key,

      label:
        rule.label,

      enabled:
        rule.enabled !== false,

      min:
        rule.min == null
          ? ''
          : String(rule.min),

      max:
        rule.max == null
          ? ''
          : String(rule.max),

      includeMin:
        rule.includeMin !== false,

      includeMax:
        rule.includeMax === true,

      impact:
        String(
          rule.impact ?? 0
        ),

      order:
        Number.isFinite(rule.order)
          ? Number(rule.order)
          : index + 1
    }))
})

interface RelativeValueForm {
  enabled: boolean
  minimumHistoricalOrders: string

  rules: Array<{
    _id?: string
    key: string
    label: string
    enabled: boolean
    min: string
    max: string
    includeMin: boolean
    includeMax: boolean
    impact: string
    order: number
  }>
}

const relativeValueToForm = (
  orderValue?: OrderValueConfig
): RelativeValueForm => ({
  enabled:
    orderValue?.relativeToHistory
      ?.enabled !== false,

  minimumHistoricalOrders:
    String(
      orderValue?.relativeToHistory
        ?.minimumHistoricalOrders ?? 0
    ),

  rules:
    (
      orderValue
        ?.relativeToHistory
        ?.rules || []
    ).map((rule, index) => ({
      _id:
        rule._id,

      key:
        rule.key,

      label:
        rule.label,

      enabled:
        rule.enabled !== false,

      min:
        rule.min == null
          ? ''
          : String(rule.min),

      max:
        rule.max == null
          ? ''
          : String(rule.max),

      includeMin:
        rule.includeMin !== false,

      includeMax:
        rule.includeMax === true,

      impact:
        String(
          rule.impact ?? 0
        ),

      order:
        Number.isFinite(rule.order)
          ? Number(rule.order)
          : index + 1
    }))
})

interface TimeRuleConfig {
  _id?: string
  key: string
  label: string
  enabled?: boolean
  startMinute?: number
  endMinute?: number
  impact?: number
  order?: number
  [key: string]: unknown
}

interface OrderTimeConfig {
  enabled?: boolean

  rules?: TimeRuleConfig[]

  historicalSignal?: {
    enabled?: boolean
    minimumCompletedOrders?: number
    minimumFailureRate?: number
    minimumExcessFailureRate?: number
    impact?: number
    [key: string]: unknown
  }

  [key: string]: unknown
}

interface HistoricalTimeForm {
  enabled: boolean
  minimumCompletedOrders: string
  minimumFailureRate: string
  minimumExcessFailureRate: string
  impact: string
}

const historicalTimeToForm = (
  orderTime?: OrderTimeConfig
): HistoricalTimeForm => ({
  enabled:
    orderTime?.historicalSignal
      ?.enabled !== false,

  minimumCompletedOrders:
    String(
      orderTime?.historicalSignal
        ?.minimumCompletedOrders ?? 0
    ),

  minimumFailureRate:
    String(
      orderTime?.historicalSignal
        ?.minimumFailureRate ?? 0
    ),

  minimumExcessFailureRate:
    String(
      orderTime?.historicalSignal
        ?.minimumExcessFailureRate ?? 0
    ),

  impact:
    String(
      orderTime?.historicalSignal
        ?.impact ?? 0
    )
})

interface OrderTimeForm {
  rules: Array<{
    _id?: string
    key: string
    label: string
    enabled: boolean
    startTime: string
    endTime: string
    impact: string
    order: number
  }>
}

const minuteToClock = (
  minute?: number
): string => {
  const safeMinute =
    Number.isFinite(minute)
      ? Number(minute)
      : 0

  if (safeMinute === 1440) {
    return '24:00'
  }

  const hours =
    Math.floor(
      safeMinute / 60
    )

  const minutes =
    safeMinute % 60

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

const clockToMinute = (
  value: string
): number => {
  const normalized =
    value.trim()

  if (normalized === '24:00') {
    return 1440
  }

  const match =
    normalized.match(
      /^(\d{2}):(\d{2})$/
    )

  if (!match) {
    throw new Error(
      `Heure invalide : ${value}. Format attendu HH:MM.`
    )
  }

  const hours =
    Number(match[1])

  const minutes =
    Number(match[2])

  if (
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    throw new Error(
      `Heure invalide : ${value}.`
    )
  }

  return (
    hours * 60 +
    minutes
  )
}

const orderTimeToForm = (
  orderTime?: OrderTimeConfig
): OrderTimeForm => ({
  rules:
    (orderTime?.rules || [])
      .map((rule, index) => ({
        _id:
          rule._id,

        key:
          rule.key,

        label:
          rule.label,

        enabled:
          rule.enabled !== false,

        startTime:
          minuteToClock(
            rule.startMinute
          ),

        endTime:
          minuteToClock(
            rule.endMinute
          ),

        impact:
          String(
            rule.impact ?? 0
          ),

        order:
          Number.isFinite(rule.order)
            ? Number(rule.order)
            : index + 1
      }))
})

interface CustomerHistorySignalConfig {
  enabled?: boolean
  rules?: RangeRuleConfig[]
  [key: string]: unknown
}

interface CustomerHistoryConfig {
  enabled?: boolean

  successfulDeliveries?: CustomerHistorySignalConfig
  failedDeliveries?: CustomerHistorySignalConfig

  [key: string]: unknown
}

interface CustomerSuccessForm {
  enabled: boolean

  rules: Array<{
    _id?: string
    key: string
    label: string
    enabled: boolean
    min: string
    max: string
    includeMin: boolean
    includeMax: boolean
    impact: string
    order: number
  }>
}

const customerSuccessToForm = (
  customerHistory?: CustomerHistoryConfig
): CustomerSuccessForm => ({
  enabled:
    customerHistory
      ?.successfulDeliveries
      ?.enabled !== false,

  rules:
    (
      customerHistory
        ?.successfulDeliveries
        ?.rules || []
    ).map((rule, index) => ({
      _id:
        rule._id,

      key:
        rule.key,

      label:
        rule.label,

      enabled:
        rule.enabled !== false,

      min:
        rule.min == null
          ? ''
          : String(rule.min),

      max:
        rule.max == null
          ? ''
          : String(rule.max),

      includeMin:
        rule.includeMin !== false,

      includeMax:
        rule.includeMax === true,

      impact:
        String(
          rule.impact ?? 0
        ),

      order:
        Number.isFinite(rule.order)
          ? Number(rule.order)
          : index + 1
    }))
})

interface CustomerFailureForm {
  enabled: boolean

  rules: Array<{
    _id?: string
    key: string
    label: string
    enabled: boolean
    min: string
    max: string
    includeMin: boolean
    includeMax: boolean
    impact: string
    order: number
  }>
}

const customerFailureToForm = (
  customerHistory?: CustomerHistoryConfig
): CustomerFailureForm => ({
  enabled:
    customerHistory
      ?.failedDeliveries
      ?.enabled !== false,

  rules:
    (
      customerHistory
        ?.failedDeliveries
        ?.rules || []
    ).map((rule, index) => ({
      _id:
        rule._id,

      key:
        rule.key,

      label:
        rule.label,

      enabled:
        rule.enabled !== false,

      min:
        rule.min == null
          ? ''
          : String(rule.min),

      max:
        rule.max == null
          ? ''
          : String(rule.max),

      includeMin:
        rule.includeMin !== false,

      includeMax:
        rule.includeMax === true,

      impact:
        String(
          rule.impact ?? 0
        ),

      order:
        Number.isFinite(rule.order)
          ? Number(rule.order)
          : index + 1
    }))
})

interface OperatorFeedbackCategoryConfig {
  _id?: string
  key: string
  label: string
  active?: boolean
  order?: number
  [key: string]: unknown
}

interface OperatorFeedbackAnswerConfig {
  _id?: string
  key: string
  label: string
  impact?: number
  active?: boolean
  order?: number
  [key: string]: unknown
}

interface OperatorFeedbackQuestionConfig {
  _id?: string
  key: string
  categoryKey: string
  title: string
  prompt: string
  type: 'single_choice' | 'multiple_choice'
  active?: boolean
  required?: boolean
  maxSelections?: number
  order?: number
  answers?: OperatorFeedbackAnswerConfig[]
  [key: string]: unknown
}

interface OperatorFeedbackConfig {
  enabled?: boolean
  categories?: OperatorFeedbackCategoryConfig[]
  questions?: OperatorFeedbackQuestionConfig[]
  [key: string]: unknown
}

interface OperatorFeedbackCategoryForm {
  _id?: string
  key: string
  label: string
  active: boolean
  order: number
}

const feedbackCategoriesToForm = (
  feedback?: OperatorFeedbackConfig
): OperatorFeedbackCategoryForm[] =>
  (feedback?.categories || [])
    .map((category, index) => ({
      _id:
        category._id,

      key:
        category.key,

      label:
        category.label,

      active:
        category.active !== false,

      order:
        Number.isFinite(category.order)
          ? Number(category.order)
          : index + 1
    }))

interface OperatorFeedbackQuestionForm {
  _id?: string
  key: string
  categoryKey: string
  title: string
  prompt: string
  type: 'single_choice' | 'multiple_choice'
  active: boolean
  required: boolean
  maxSelections: string
  order: number
  answers: OperatorFeedbackAnswerConfig[]
}

const feedbackQuestionsToForm = (
  feedback?: OperatorFeedbackConfig
): OperatorFeedbackQuestionForm[] =>
  (feedback?.questions || [])
    .map((question, index) => ({
      _id:
        question._id,

      key:
        question.key,

      categoryKey:
        question.categoryKey,

      title:
        question.title,

      prompt:
        question.prompt,

      type:
        question.type,

      active:
        question.active !== false,

      required:
        question.required === true,

      maxSelections:
        String(
          question.maxSelections ?? 1
        ),

      order:
        Number.isFinite(question.order)
          ? Number(question.order)
          : index + 1,

      answers:
        question.answers
          ? [...question.answers]
          : []
    }))

type GeographicLocationType =
  | 'governorate'
  | 'delegation'
  | 'city'
  | 'postal_code'

interface GeographicRuleConfig {
  _id?: string
  key: string
  label: string
  locationType: GeographicLocationType
  locationValue: string
  enabled?: boolean
  impact?: number
  order?: number
  [key: string]: unknown
}

interface GeographicZoneConfig {
  enabled?: boolean
  rules?: GeographicRuleConfig[]
  [key: string]: unknown
}

interface GeographicRuleForm {
  _id?: string
  key: string
  label: string
  locationType: GeographicLocationType
  locationValue: string
  enabled: boolean
  impact: string
  order: number
}

const geographicToForm = (
  geographic?: GeographicZoneConfig
): GeographicRuleForm[] =>
  (geographic?.rules || [])
    .map((rule, index) => ({
      _id:
        rule._id,

      key:
        rule.key,

      label:
        rule.label,

      locationType:
        rule.locationType,

      locationValue:
        rule.locationValue,

      enabled:
        rule.enabled !== false,

      impact:
        String(
          rule.impact ?? 0
        ),

      order:
        Number.isFinite(rule.order)
          ? Number(rule.order)
          : index + 1
    }))

interface AddressFormState {
  mode: 'exclusive' | 'cumulative'

  elements: {
    street: {
      enabled: boolean
      impact: string
    }

    city: {
      enabled: boolean
      impact: string
    }

    governorate: {
      enabled: boolean
      impact: string
    }

    postalCode: {
      enabled: boolean
      impact: string
    }
  }

  levels: Array<{
    key: string
    label: string
    enabled: boolean
    impact: string
  }>
}

const addressToForm = (
  address?: AddressConfig
): AddressFormState => {
  const elementToForm = (
    element?: AddressElementConfig
  ) => ({
    enabled:
      element?.enabled !== false,

    impact:
      String(
        element?.impact ?? 0
      )
  })

  return {
    mode:
      address?.mode === 'cumulative'
        ? 'cumulative'
        : 'exclusive',

    elements: {
      street:
        elementToForm(
          address?.elements?.street
        ),

      city:
        elementToForm(
          address?.elements?.city
        ),

      governorate:
        elementToForm(
          address?.elements?.governorate
        ),

      postalCode:
        elementToForm(
          address?.elements?.postalCode
        )
    },

    levels:
      (address?.levels || [])
        .map(level => ({
          key:
            level.key,

          label:
            level.label,

          enabled:
            level.enabled !== false,

          impact:
            String(
              level.impact ?? 0
            )
        }))
  }
}

interface GeneralFormState {
  baseScore: string
  minimumScore: string
  maximumScore: string
}

const generalToForm = (
  general: GeneralConfig
): GeneralFormState => ({
  baseScore:
    String(general.baseScore),

  minimumScore:
    String(general.minimumScore),

  maximumScore:
    String(general.maximumScore)
})

interface PatternToggleState {
  enabled: boolean
  address: boolean
  geographicZone: boolean
  orderValue: boolean
  orderTime: boolean
}

const patternsToForm = (
  patterns: AIScoringConfig['patterns']
): PatternToggleState => ({
  enabled:
    patterns?.enabled !== false,

  address:
    patterns?.address?.enabled !== false,

  geographicZone:
    patterns?.geographicZone?.enabled !== false,

  orderValue:
    patterns?.orderValue?.enabled !== false,

  orderTime:
    patterns?.orderTime?.enabled !== false
})

interface AIScoringConfig {
  version: number
  status?: 'draft' | 'active' | 'archived'
  clonedFromVersion?: number | null
  createdAt?: string
  updatedAt?: string

  general: GeneralConfig

  patterns?: {
    enabled?: boolean

    address?: AddressConfig

    geographicZone?: GeographicZoneConfig

    orderValue?: OrderValueConfig

    orderTime?: OrderTimeConfig

    [key: string]: unknown
  }

  customerHistory?: CustomerHistoryConfig

  operatorFeedback?: OperatorFeedbackConfig
}

interface SimulatorFormState {
  shopId: string
  phone: string
  street: string
  city: string
  state: string
  zipCode: string
  region: string
  totalAmount: string
  createdAt: string
}

interface SimulatorFactor {
  key: string
  label: string
  value: unknown
  impact: number
  applied: boolean
}

interface SimulatorResult {
  version: number
  status: 'draft' | 'active' | 'archived'
  simulation: {
    baseScore: number
    calculatedScore: number
    minimumScore: number
    maximumScore: number
    finalScore: number
    factors: SimulatorFactor[]
    riskLevel: string
    decision: string
  }
  context?: unknown
}

interface ModuleToggleForm {
  customerHistory: boolean
  operatorFeedback: boolean
}

const modulesToForm = (
  config?: AIScoringConfig
): ModuleToggleForm => ({
  customerHistory:
    config?.customerHistory
      ?.enabled !== false,

  operatorFeedback:
    config?.operatorFeedback
      ?.enabled !== false
})

interface SummaryCardProps {
  title: string
  description: string
  enabled: boolean
  detail: string
  icon: React.ElementType
}

function SummaryCard({
  title,
  description,
  enabled,
  detail,
  icon: Icon
}: SummaryCardProps) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="rounded-lg dark:bg-slate-800 light:bg-gray-100 p-2.5">
            <Icon className="h-5 w-5" />
          </div>

          <div>
            <h3 className="font-semibold">
              {title}
            </h3>

            <p className="mt-1 text-sm dark:text-slate-400 light:text-gray-600">
              {description}
            </p>
          </div>
        </div>

        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
            enabled
              ? 'bg-green-500/10 text-green-500'
              : 'bg-slate-500/10 text-slate-400'
          }`}
        >
          {enabled ? 'Enabled' : 'Disabled'}
        </span>
      </div>

      <div className="mt-4 border-t dark:border-slate-800 light:border-gray-100 pt-4">
        <p className="text-sm font-medium">
          {detail}
        </p>
      </div>
    </div>
  )
}

export default function AIScoringAdminPage() {
  const [config, setConfig] =
    useState<AIScoringConfig | null>(null)

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState<string | null>(null)

  const [configs, setConfigs] =
    useState<AIScoringConfig[]>([])

  const [creatingDraft, setCreatingDraft] =
    useState(false)

  const [activatingDraft, setActivatingDraft] =
    useState(false)

  const [actionMessage, setActionMessage] =
    useState<string | null>(null)

  const [draftConfig, setDraftConfig] =
    useState<AIScoringConfig | null>(null)

  const [generalDraft, setGeneralDraft] =
    useState<GeneralFormState | null>(null)

  const [draftLoading, setDraftLoading] =
    useState(false)

  const [savingGeneral, setSavingGeneral] =
    useState(false)

  const [patternDraft, setPatternDraft] =
    useState<PatternToggleState | null>(null)

  const [savingPatterns, setSavingPatterns] =
    useState(false)

  const [addressDraft, setAddressDraft] =
    useState<AddressFormState | null>(null)

  const [savingAddress, setSavingAddress] =
    useState(false)

  const [geographicDraft, setGeographicDraft] =
    useState<GeographicRuleForm[]>([])

  const [savingGeographic, setSavingGeographic] =
    useState(false)

  const [absoluteValueDraft, setAbsoluteValueDraft] =
    useState<AbsoluteValueForm | null>(null)

  const [savingAbsoluteValue, setSavingAbsoluteValue] =
    useState(false)

  const [relativeValueDraft, setRelativeValueDraft] =
    useState<RelativeValueForm | null>(null)

  const [savingRelativeValue, setSavingRelativeValue] =
    useState(false)

  const [orderTimeDraft, setOrderTimeDraft] =
    useState<OrderTimeForm | null>(null)

  const [savingOrderTime, setSavingOrderTime] =
    useState(false)

  const [historicalTimeDraft, setHistoricalTimeDraft] =
    useState<HistoricalTimeForm | null>(null)

  const [savingHistoricalTime, setSavingHistoricalTime] =
    useState(false)

  const [customerSuccessDraft, setCustomerSuccessDraft] =
    useState<CustomerSuccessForm | null>(null)

  const [savingCustomerSuccess, setSavingCustomerSuccess] =
    useState(false)

  const [customerFailureDraft, setCustomerFailureDraft] =
    useState<CustomerFailureForm | null>(null)

  const [savingCustomerFailure, setSavingCustomerFailure] =
    useState(false)

  const [feedbackCategoriesDraft, setFeedbackCategoriesDraft] =
    useState<OperatorFeedbackCategoryForm[]>([])

  const [savingFeedbackCategories, setSavingFeedbackCategories] =
    useState(false)

  const [feedbackQuestionsDraft, setFeedbackQuestionsDraft] =
    useState<OperatorFeedbackQuestionForm[]>([])

  const [savingFeedbackQuestions, setSavingFeedbackQuestions] =
    useState(false)

  const [savingFeedbackAnswers, setSavingFeedbackAnswers] =
    useState(false)

  const [moduleDraft, setModuleDraft] =
    useState<ModuleToggleForm | null>(null)

  const [savingModules, setSavingModules] =
    useState(false)

  const [simulatorForm, setSimulatorForm] =
    useState<SimulatorFormState>({
      shopId: '',
      phone: '',
      street: '',
      city: '',
      state: '',
      zipCode: '',
      region: '',
      totalAmount: '100',
      createdAt: ''
    })

  const [simulatorResult, setSimulatorResult] =
    useState<SimulatorResult | null>(null)

  const [simulating, setSimulating] =
    useState(false)

  const latestDraft =
    configs
      .filter(
        item =>
          item.status === 'draft'
      )
      .sort(
        (a, b) =>
          b.version - a.version
      )[0] ?? null

  useEffect(() => {
    const fetchActiveConfig = async () => {
      try {
        setLoading(true)
        setError(null)

        const [
          activeResponse,
          configsResponse
        ] = await Promise.all([
          api.get(
            '/api/admin/ai-scoring/active'
          ),

          api.get(
            '/api/admin/ai-scoring/configs'
          )
        ])

        /*
         * Backend responses are accepted both wrapped and
         * unwrapped to keep this UI tolerant to the current
         * API response shape.
         */
        const activePayload =
          activeResponse.data?.config ??
          activeResponse.data

        const configsPayload =
          Array.isArray(
            configsResponse.data
          )
            ? configsResponse.data
            : Array.isArray(
                configsResponse.data?.configs
              )
              ? configsResponse.data.configs
              : []

        if (
          !activePayload ||
          typeof activePayload.version !== 'number' ||
          !activePayload.general
        ) {
          throw new Error(
            'Invalid AI scoring configuration response'
          )
        }

        setConfig(activePayload)

        setConfigs(
          configsPayload
        )
      } catch (fetchError) {
        console.error(
          'Failed to load AI scoring configuration:',
          fetchError
        )

        setError(
          'Impossible de charger la configuration AI Scoring.'
        )
      } finally {
        setLoading(false)
      }
    }

    void fetchActiveConfig()
  }, [])

  useEffect(() => {
    const draftVersion =
      latestDraft?.version

    if (!draftVersion) {
      setDraftConfig(null)
      setGeneralDraft(null)
      setPatternDraft(null)
      setAddressDraft(null)
      setGeographicDraft([])
      setAbsoluteValueDraft(null)
      setRelativeValueDraft(null)
      setOrderTimeDraft(null)
      setHistoricalTimeDraft(null)
      setCustomerSuccessDraft(null)
      setCustomerFailureDraft(null)
      setFeedbackCategoriesDraft([])
      setFeedbackQuestionsDraft([])
      setModuleDraft(null)
      return
    }

    const fetchDraftConfig =
      async () => {
        try {
          setDraftLoading(true)

          const response =
            await api.get(
              `/api/admin/ai-scoring/configs/${draftVersion}`
            )

          const payload =
            response.data?.config ??
            response.data

          if (
            !payload ||
            payload.status !== 'draft' ||
            !payload.general
          ) {
            throw new Error(
              'Invalid AI scoring draft response'
            )
          }

          setDraftConfig(payload)

          setGeneralDraft(
            generalToForm(
              payload.general
            )
          )

          setPatternDraft(
            patternsToForm(
              payload.patterns
            )
          )

          setAddressDraft(
            addressToForm(
              payload.patterns?.address
            )
          )

          setGeographicDraft(
            geographicToForm(
              payload.patterns
                ?.geographicZone
            )
          )

          setAbsoluteValueDraft(
            absoluteValueToForm(
              payload.patterns
                ?.orderValue
            )
          )

          setRelativeValueDraft(
            relativeValueToForm(
              payload.patterns
                ?.orderValue
            )
          )

          setOrderTimeDraft(
            orderTimeToForm(
              payload.patterns
                ?.orderTime
            )
          )

          setHistoricalTimeDraft(
            historicalTimeToForm(
              payload.patterns
                ?.orderTime
            )
          )

          setCustomerSuccessDraft(
            customerSuccessToForm(
              payload.customerHistory
            )
          )

          setCustomerFailureDraft(
            customerFailureToForm(
              payload.customerHistory
            )
          )

          setFeedbackCategoriesDraft(
            feedbackCategoriesToForm(
              payload.operatorFeedback
            )
          )

          setFeedbackQuestionsDraft(
            feedbackQuestionsToForm(
              payload.operatorFeedback
            )
          )

          setModuleDraft(
            modulesToForm(
              payload
            )
          )
        } catch (draftError) {
          console.error(
            'Failed to load AI scoring draft:',
            draftError
          )

          setError(
            'Impossible de charger la configuration brouillon.'
          )
        } finally {
          setDraftLoading(false)
        }
      }

    void fetchDraftConfig()
  }, [latestDraft?.version])


  const handleCreateDraft =
    async () => {
      if (!config) {
        return
      }

      try {
        setCreatingDraft(true)
        setError(null)
        setActionMessage(null)

        const response =
          await api.post(
            `/api/admin/ai-scoring/configs/${config.version}/clone`,
            {}
          )

        const clonedConfig =
          response.data?.config ??
          response.data

        if (
          !clonedConfig ||
          typeof clonedConfig.version !== 'number'
        ) {
          throw new Error(
            'Invalid cloned configuration response'
          )
        }

        setConfigs(previous => [
          clonedConfig,
          ...previous.filter(
            item =>
              item.version !==
              clonedConfig.version
          )
        ])

        if (
          clonedConfig.status === 'draft' &&
          clonedConfig.general
        ) {
          setDraftConfig(
            clonedConfig
          )

          setGeneralDraft(
            generalToForm(
              clonedConfig.general
            )
          )

          setPatternDraft(
            patternsToForm(
              clonedConfig.patterns
            )
          )

          setAddressDraft(
            addressToForm(
              clonedConfig.patterns?.address
            )
          )

          setGeographicDraft(
            geographicToForm(
              clonedConfig.patterns
                ?.geographicZone
            )
          )

          setAbsoluteValueDraft(
            absoluteValueToForm(
              clonedConfig.patterns
                ?.orderValue
            )
          )

          setRelativeValueDraft(
            relativeValueToForm(
              clonedConfig.patterns
                ?.orderValue
            )
          )

          setOrderTimeDraft(
            orderTimeToForm(
              clonedConfig.patterns
                ?.orderTime
            )
          )

          setHistoricalTimeDraft(
            historicalTimeToForm(
              clonedConfig.patterns
                ?.orderTime
            )
          )

          setCustomerSuccessDraft(
            customerSuccessToForm(
              clonedConfig.customerHistory
            )
          )

          setCustomerFailureDraft(
            customerFailureToForm(
              clonedConfig.customerHistory
            )
          )

          setFeedbackCategoriesDraft(
            feedbackCategoriesToForm(
              clonedConfig.operatorFeedback
            )
          )

          setFeedbackQuestionsDraft(
            feedbackQuestionsToForm(
              clonedConfig.operatorFeedback
            )
          )

          setModuleDraft(
            modulesToForm(
              clonedConfig
            )
          )
        }

        setActionMessage(
          `V${clonedConfig.version} créée en brouillon à partir de V${config.version}.`
        )
      } catch (cloneError) {
        console.error(
          'Failed to create AI scoring draft:',
          cloneError
        )

        setError(
          'Impossible de créer le brouillon AI Scoring.'
        )
      } finally {
        setCreatingDraft(false)
      }
    }

  const handleSaveGeneral =
    async () => {
      if (
        !draftConfig ||
        draftConfig.status !== 'draft' ||
        !generalDraft
      ) {
        return
      }

      const baseScore =
        Number(
          generalDraft.baseScore
        )

      const minimumScore =
        Number(
          generalDraft.minimumScore
        )

      const maximumScore =
        Number(
          generalDraft.maximumScore
        )

      const values = [
        baseScore,
        minimumScore,
        maximumScore
      ]

      if (
        values.some(
          value =>
            !Number.isFinite(value)
        )
      ) {
        setError(
          'Les valeurs General doivent être numériques.'
        )
        return
      }

      if (
        values.some(
          value =>
            value < 0 ||
            value > 100
        )
      ) {
        setError(
          'Les scores doivent être compris entre 0 et 100.'
        )
        return
      }

      if (
        minimumScore >
          baseScore ||
        baseScore >
          maximumScore
      ) {
        setError(
          'Le score minimum doit être ≤ au score de base, lui-même ≤ au score maximum.'
        )
        return
      }

      try {
        setSavingGeneral(true)
        setError(null)
        setActionMessage(null)

        const response =
          await api.put(
            `/api/admin/ai-scoring/configs/${draftConfig.version}`,
            {
              general: {
                baseScore,
                minimumScore,
                maximumScore
              }
            }
          )

        const updatedConfig =
          response.data?.config ??
          response.data

        if (
          !updatedConfig ||
          updatedConfig.status !== 'draft' ||
          !updatedConfig.general
        ) {
          throw new Error(
            'Invalid updated draft response'
          )
        }

        setDraftConfig(
          updatedConfig
        )

        setGeneralDraft(
          generalToForm(
            updatedConfig.general
          )
        )

        setConfigs(previous =>
          previous.map(item =>
            item.version ===
              updatedConfig.version
              ? {
                  ...item,
                  ...updatedConfig
                }
              : item
          )
        )

        setActionMessage(
          `General enregistré dans V${updatedConfig.version}. La version active V${config?.version ?? '?'} reste inchangée.`
        )
      } catch (saveError) {
        console.error(
          'Failed to save AI scoring General config:',
          saveError
        )

        setError(
          'Impossible d’enregistrer la configuration General.'
        )
      } finally {
        setSavingGeneral(false)
      }
    }

  const handleSavePatterns =
    async () => {
      if (
        !draftConfig ||
        draftConfig.status !== 'draft' ||
        !draftConfig.patterns ||
        !patternDraft
      ) {
        return
      }

      const updatedPatterns = {
        ...draftConfig.patterns,

        enabled:
          patternDraft.enabled,

        address: {
          ...(draftConfig.patterns.address || {}),
          enabled:
            patternDraft.address
        },

        geographicZone: {
          ...(draftConfig.patterns.geographicZone || {}),
          enabled:
            patternDraft.geographicZone
        },

        orderValue: {
          ...(draftConfig.patterns.orderValue || {}),
          enabled:
            patternDraft.orderValue
        },

        orderTime: {
          ...(draftConfig.patterns.orderTime || {}),
          enabled:
            patternDraft.orderTime
        }
      }

      try {
        setSavingPatterns(true)
        setError(null)
        setActionMessage(null)

        const response =
          await api.put(
            `/api/admin/ai-scoring/configs/${draftConfig.version}`,
            {
              patterns:
                updatedPatterns
            }
          )

        const updatedConfig =
          response.data?.config ??
          response.data

        if (
          !updatedConfig ||
          updatedConfig.status !== 'draft' ||
          !updatedConfig.patterns
        ) {
          throw new Error(
            'Invalid updated patterns response'
          )
        }

        setDraftConfig(
          updatedConfig
        )

        setPatternDraft(
          patternsToForm(
            updatedConfig.patterns
          )
        )

        setAddressDraft(
          addressToForm(
            updatedConfig.patterns.address
          )
        )

        setGeographicDraft(
          geographicToForm(
            updatedConfig.patterns
              .geographicZone
          )
        )

        setConfigs(previous =>
          previous.map(item =>
            item.version ===
              updatedConfig.version
              ? {
                  ...item,
                  ...updatedConfig
                }
              : item
          )
        )

        setActionMessage(
          `Patterns enregistrés dans V${updatedConfig.version}. V${config?.version ?? '?'} reste active et inchangée.`
        )
      } catch (saveError) {
        console.error(
          'Failed to save AI scoring Patterns:',
          saveError
        )

        setError(
          'Impossible d’enregistrer la configuration Patterns.'
        )
      } finally {
        setSavingPatterns(false)
      }
    }

  const handleSaveAddress =
    async () => {
      const currentAddress =
        draftConfig?.patterns?.address

      if (
        !draftConfig ||
        draftConfig.status !== 'draft' ||
        !draftConfig.patterns ||
        !currentAddress ||
        !addressDraft
      ) {
        return
      }

      const elementKeys = [
        'street',
        'city',
        'governorate',
        'postalCode'
      ] as const

      const elementImpacts =
        elementKeys.map(
          key =>
            Number(
              addressDraft
                .elements[key]
                .impact
            )
        )

      const levelImpacts =
        addressDraft.levels.map(
          level =>
            Number(
              level.impact
            )
        )

      if (
        [
          ...elementImpacts,
          ...levelImpacts
        ].some(
          value =>
            !Number.isFinite(value)
        )
      ) {
        setError(
          'Tous les impacts Address doivent être numériques.'
        )
        return
      }

      const updatedElements = {
        ...(currentAddress.elements || {})
      }

      for (const key of elementKeys) {
        updatedElements[key] = {
          ...(currentAddress.elements?.[key] || {}),

          enabled:
            addressDraft
              .elements[key]
              .enabled,

          impact:
            Number(
              addressDraft
                .elements[key]
                .impact
            )
        }
      }

      const updatedLevels =
        (currentAddress.levels || [])
          .map(level => {
            const formLevel =
              addressDraft.levels.find(
                item =>
                  item.key ===
                  level.key
              )

            if (!formLevel) {
              return level
            }

            return {
              ...level,

              enabled:
                formLevel.enabled,

              impact:
                Number(
                  formLevel.impact
                )
            }
          })

      const updatedAddress = {
        ...currentAddress,

        mode:
          addressDraft.mode,

        elements:
          updatedElements,

        levels:
          updatedLevels
      }

      const updatedPatterns = {
        ...draftConfig.patterns,

        address:
          updatedAddress
      }

      try {
        setSavingAddress(true)
        setError(null)
        setActionMessage(null)

        const response =
          await api.put(
            `/api/admin/ai-scoring/configs/${draftConfig.version}`,
            {
              patterns:
                updatedPatterns
            }
          )

        const updatedConfig =
          response.data?.config ??
          response.data

        if (
          !updatedConfig ||
          updatedConfig.status !== 'draft' ||
          !updatedConfig.patterns?.address
        ) {
          throw new Error(
            'Invalid updated Address response'
          )
        }

        setDraftConfig(
          updatedConfig
        )

        setPatternDraft(
          patternsToForm(
            updatedConfig.patterns
          )
        )

        setAddressDraft(
          addressToForm(
            updatedConfig.patterns.address
          )
        )

        setGeographicDraft(
          geographicToForm(
            updatedConfig.patterns
              .geographicZone
          )
        )

        setConfigs(previous =>
          previous.map(item =>
            item.version ===
              updatedConfig.version
              ? {
                  ...item,
                  ...updatedConfig
                }
              : item
          )
        )

        setActionMessage(
          `Address Scoring enregistré dans V${updatedConfig.version}. V${config?.version ?? '?'} reste active.`
        )
      } catch (saveError) {
        console.error(
          'Failed to save Address scoring:',
          saveError
        )

        setError(
          'Impossible d’enregistrer Address Scoring.'
        )
      } finally {
        setSavingAddress(false)
      }
    }

  const handleSaveGeographic =
    async () => {
      const currentGeographic =
        draftConfig
          ?.patterns
          ?.geographicZone

      if (
        !draftConfig ||
        draftConfig.status !== 'draft' ||
        !draftConfig.patterns ||
        !currentGeographic
      ) {
        return
      }

      try {
        setSavingGeographic(true)
        setError(null)
        setActionMessage(null)

        const normalizedRules =
          geographicDraft.map(
          (rule, index) => {
            const impact =
              Number(
                rule.impact
              )

            if (
              !Number.isFinite(
                impact
              )
            ) {
              throw new Error(
                `Impact invalide pour ${rule.label || rule.key || `rule ${index + 1}`}`
              )
            }

            const locationValue =
              rule.locationValue.trim()

            const label =
              rule.label.trim()

            const key =
              rule.key.trim()

            if (
              !key ||
              !label ||
              !locationValue
            ) {
              throw new Error(
                `La règle ${index + 1} doit avoir une clé, un libellé et une valeur géographique.`
              )
            }

            return {
              ...(rule._id
                ? {
                    _id:
                      rule._id
                  }
                : {}),

              key,
              label,

              locationType:
                rule.locationType,

              locationValue,

              enabled:
                rule.enabled,

              impact,

              order:
                index + 1
            }
          }
        )

      const identitySet =
        new Set<string>()

      for (
        const rule of
          normalizedRules
      ) {
        if (!rule.enabled) {
          continue
        }

        const identity =
          `${rule.locationType}:${rule.locationValue.toLocaleLowerCase()}`

        if (
          identitySet.has(
            identity
          )
        ) {
          setError(
            `Deux règles actives ciblent la même zone : ${rule.locationType} / ${rule.locationValue}.`
          )
          return
        }

        identitySet.add(
          identity
        )
      }

      const updatedGeographic = {
        ...currentGeographic,

        rules:
          normalizedRules
      }

      const updatedPatterns = {
        ...draftConfig.patterns,

        geographicZone:
          updatedGeographic
      }

        const response =
          await api.put(
            `/api/admin/ai-scoring/configs/${draftConfig.version}`,
            {
              patterns:
                updatedPatterns
            }
          )

        const updatedConfig =
          response.data?.config ??
          response.data

        if (
          !updatedConfig ||
          updatedConfig.status !== 'draft' ||
          !updatedConfig.patterns
            ?.geographicZone
        ) {
          throw new Error(
            'Invalid updated Geographic response'
          )
        }

        setDraftConfig(
          updatedConfig
        )

        setPatternDraft(
          patternsToForm(
            updatedConfig.patterns
          )
        )

        setAddressDraft(
          addressToForm(
            updatedConfig.patterns.address
          )
        )

        setGeographicDraft(
          geographicToForm(
            updatedConfig.patterns
              .geographicZone
          )
        )

        setConfigs(previous =>
          previous.map(item =>
            item.version ===
              updatedConfig.version
              ? {
                  ...item,
                  ...updatedConfig
                }
              : item
          )
        )

        setActionMessage(
          `Geographic Zone enregistré dans V${updatedConfig.version}. V${config?.version ?? '?'} reste active.`
        )
      } catch (saveError) {
        console.error(
          'Failed to save Geographic scoring:',
          saveError
        )

        setError(
          saveError instanceof Error
            ? saveError.message
            : 'Impossible d’enregistrer Geographic Zone.'
        )
      } finally {
        setSavingGeographic(false)
      }
    }

  const handleSaveAbsoluteValue =
    async () => {
      const currentOrderValue =
        draftConfig
          ?.patterns
          ?.orderValue

      const currentAbsolute =
        currentOrderValue
          ?.absoluteValue

      if (
        !draftConfig ||
        draftConfig.status !== 'draft' ||
        !draftConfig.patterns ||
        !currentOrderValue ||
        !currentAbsolute ||
        !absoluteValueDraft
      ) {
        return
      }

      try {
        setSavingAbsoluteValue(true)
        setError(null)
        setActionMessage(null)

        const normalizedRules =
          absoluteValueDraft.rules.map(
            (rule, index) => {
              const impact =
                Number(
                  rule.impact
                )

              if (
                !Number.isFinite(
                  impact
                )
              ) {
                throw new Error(
                  `Impact invalide pour ${rule.label}.`
                )
              }

              const min =
                rule.min.trim() === ''
                  ? null
                  : Number(rule.min)

              const max =
                rule.max.trim() === ''
                  ? null
                  : Number(rule.max)

              if (
                min !== null &&
                !Number.isFinite(min)
              ) {
                throw new Error(
                  `Minimum invalide pour ${rule.label}.`
                )
              }

              if (
                max !== null &&
                !Number.isFinite(max)
              ) {
                throw new Error(
                  `Maximum invalide pour ${rule.label}.`
                )
              }

              if (
                min !== null &&
                max !== null &&
                min > max
              ) {
                throw new Error(
                  `La borne minimum dépasse la borne maximum pour ${rule.label}.`
                )
              }

              const original =
                currentAbsolute.rules
                  ?.find(
                    item =>
                      item.key ===
                      rule.key
                  )

              return {
                ...(original || {}),

                ...(rule._id
                  ? {
                      _id:
                        rule._id
                    }
                  : {}),

                key:
                  rule.key,

                label:
                  rule.label.trim(),

                enabled:
                  rule.enabled,

                min,
                max,

                includeMin:
                  rule.includeMin,

                includeMax:
                  rule.includeMax,

                impact,

                order:
                  index + 1
              }
            }
          )

        const updatedAbsolute = {
          ...currentAbsolute,

          enabled:
            absoluteValueDraft.enabled,

          rules:
            normalizedRules
        }

        const updatedOrderValue = {
          ...currentOrderValue,

          absoluteValue:
            updatedAbsolute
        }

        const updatedPatterns = {
          ...draftConfig.patterns,

          orderValue:
            updatedOrderValue
        }

        const response =
          await api.put(
            `/api/admin/ai-scoring/configs/${draftConfig.version}`,
            {
              patterns:
                updatedPatterns
            }
          )

        const updatedConfig =
          response.data?.config ??
          response.data

        if (
          !updatedConfig ||
          updatedConfig.status !== 'draft' ||
          !updatedConfig.patterns
            ?.orderValue
            ?.absoluteValue
        ) {
          throw new Error(
            'Invalid updated Absolute Order Value response'
          )
        }

        setDraftConfig(
          updatedConfig
        )

        setPatternDraft(
          patternsToForm(
            updatedConfig.patterns
          )
        )

        setAbsoluteValueDraft(
          absoluteValueToForm(
            updatedConfig.patterns
              .orderValue
          )
        )

        setConfigs(previous =>
          previous.map(item =>
            item.version ===
              updatedConfig.version
              ? {
                  ...item,
                  ...updatedConfig
                }
              : item
          )
        )

        setActionMessage(
          `Order Value absolu enregistré dans V${updatedConfig.version}. V${config?.version ?? '?'} reste active.`
        )
      } catch (saveError) {
        console.error(
          'Failed to save Absolute Order Value:',
          saveError
        )

        setError(
          saveError instanceof Error
            ? saveError.message
            : 'Impossible d’enregistrer Order Value.'
        )
      } finally {
        setSavingAbsoluteValue(false)
      }
    }

  const handleSaveRelativeValue =
    async () => {
      const currentOrderValue =
        draftConfig
          ?.patterns
          ?.orderValue

      const currentRelative =
        currentOrderValue
          ?.relativeToHistory

      if (
        !draftConfig ||
        draftConfig.status !== 'draft' ||
        !draftConfig.patterns ||
        !currentOrderValue ||
        !currentRelative ||
        !relativeValueDraft
      ) {
        return
      }

      try {
        setSavingRelativeValue(true)
        setError(null)
        setActionMessage(null)

        const minimumHistoricalOrders =
          Number(
            relativeValueDraft
              .minimumHistoricalOrders
          )

        if (
          !Number.isInteger(
            minimumHistoricalOrders
          ) ||
          minimumHistoricalOrders < 0
        ) {
          throw new Error(
            'Minimum historical orders doit être un entier positif ou nul.'
          )
        }

        const normalizedRules =
          relativeValueDraft.rules.map(
            (rule, index) => {
              const impact =
                Number(
                  rule.impact
                )

              if (
                !Number.isFinite(
                  impact
                )
              ) {
                throw new Error(
                  `Impact invalide pour ${rule.label}.`
                )
              }

              const min =
                rule.min.trim() === ''
                  ? null
                  : Number(rule.min)

              const max =
                rule.max.trim() === ''
                  ? null
                  : Number(rule.max)

              if (
                min !== null &&
                (
                  !Number.isFinite(min) ||
                  min < 0
                )
              ) {
                throw new Error(
                  `Minimum invalide pour ${rule.label}.`
                )
              }

              if (
                max !== null &&
                (
                  !Number.isFinite(max) ||
                  max < 0
                )
              ) {
                throw new Error(
                  `Maximum invalide pour ${rule.label}.`
                )
              }

              if (
                min !== null &&
                max !== null &&
                min > max
              ) {
                throw new Error(
                  `La borne minimum dépasse la borne maximum pour ${rule.label}.`
                )
              }

              const original =
                currentRelative.rules
                  ?.find(
                    item =>
                      item.key ===
                      rule.key
                  )

              return {
                ...(original || {}),

                ...(rule._id
                  ? {
                      _id:
                        rule._id
                    }
                  : {}),

                key:
                  rule.key,

                label:
                  rule.label,

                enabled:
                  rule.enabled,

                min,
                max,

                includeMin:
                  rule.includeMin,

                includeMax:
                  rule.includeMax,

                impact,

                order:
                  index + 1
              }
            }
          )

        const updatedRelative = {
          ...currentRelative,

          enabled:
            relativeValueDraft.enabled,

          minimumHistoricalOrders,

          rules:
            normalizedRules
        }

        const updatedOrderValue = {
          ...currentOrderValue,

          relativeToHistory:
            updatedRelative
        }

        const updatedPatterns = {
          ...draftConfig.patterns,

          orderValue:
            updatedOrderValue
        }

        const response =
          await api.put(
            `/api/admin/ai-scoring/configs/${draftConfig.version}`,
            {
              patterns:
                updatedPatterns
            }
          )

        const updatedConfig =
          response.data?.config ??
          response.data

        if (
          !updatedConfig ||
          updatedConfig.status !== 'draft' ||
          !updatedConfig.patterns
            ?.orderValue
            ?.relativeToHistory
        ) {
          throw new Error(
            'Invalid updated Relative Order Value response'
          )
        }

        setDraftConfig(
          updatedConfig
        )

        setPatternDraft(
          patternsToForm(
            updatedConfig.patterns
          )
        )

        setAbsoluteValueDraft(
          absoluteValueToForm(
            updatedConfig.patterns
              .orderValue
          )
        )

        setRelativeValueDraft(
          relativeValueToForm(
            updatedConfig.patterns
              .orderValue
          )
        )

        setConfigs(previous =>
          previous.map(item =>
            item.version ===
              updatedConfig.version
              ? {
                  ...item,
                  ...updatedConfig
                }
              : item
          )
        )

        setActionMessage(
          `Order Value historique enregistré dans V${updatedConfig.version}. V${config?.version ?? '?'} reste active.`
        )
      } catch (saveError) {
        console.error(
          'Failed to save Relative Order Value:',
          saveError
        )

        setError(
          saveError instanceof Error
            ? saveError.message
            : 'Impossible d’enregistrer Order Value historique.'
        )
      } finally {
        setSavingRelativeValue(false)
      }
    }

  const handleSaveOrderTime =
    async () => {
      const currentOrderTime =
        draftConfig
          ?.patterns
          ?.orderTime

      if (
        !draftConfig ||
        draftConfig.status !== 'draft' ||
        !draftConfig.patterns ||
        !currentOrderTime ||
        !orderTimeDraft
      ) {
        return
      }

      try {
        setSavingOrderTime(true)
        setError(null)
        setActionMessage(null)

        const normalizedRules =
          orderTimeDraft.rules.map(
            (rule, index) => {
              const startMinute =
                clockToMinute(
                  rule.startTime
                )

              const endMinute =
                clockToMinute(
                  rule.endTime
                )

              const impact =
                Number(
                  rule.impact
                )

              if (
                startMinute < 0 ||
                startMinute > 1439
              ) {
                throw new Error(
                  `Heure de début invalide pour ${rule.label}.`
                )
              }

              if (
                endMinute < 1 ||
                endMinute > 1440
              ) {
                throw new Error(
                  `Heure de fin invalide pour ${rule.label}.`
                )
              }

              if (
                startMinute >=
                endMinute
              ) {
                throw new Error(
                  `La fin doit être après le début pour ${rule.label}.`
                )
              }

              if (
                !Number.isFinite(
                  impact
                )
              ) {
                throw new Error(
                  `Impact invalide pour ${rule.label}.`
                )
              }

              const original =
                currentOrderTime.rules
                  ?.find(
                    item =>
                      item.key ===
                      rule.key
                  )

              return {
                ...(original || {}),

                ...(rule._id
                  ? {
                      _id:
                        rule._id
                    }
                  : {}),

                key:
                  rule.key,

                label:
                  rule.label,

                enabled:
                  rule.enabled,

                startMinute,
                endMinute,
                impact,

                order:
                  index + 1
              }
            }
          )

        const updatedOrderTime = {
          ...currentOrderTime,

          rules:
            normalizedRules
        }

        const updatedPatterns = {
          ...draftConfig.patterns,

          orderTime:
            updatedOrderTime
        }

        const response =
          await api.put(
            `/api/admin/ai-scoring/configs/${draftConfig.version}`,
            {
              patterns:
                updatedPatterns
            }
          )

        const updatedConfig =
          response.data?.config ??
          response.data

        if (
          !updatedConfig ||
          updatedConfig.status !== 'draft' ||
          !updatedConfig.patterns
            ?.orderTime
        ) {
          throw new Error(
            'Invalid updated Order Time response'
          )
        }

        setDraftConfig(
          updatedConfig
        )

        setPatternDraft(
          patternsToForm(
            updatedConfig.patterns
          )
        )

        setOrderTimeDraft(
          orderTimeToForm(
            updatedConfig.patterns
              .orderTime
          )
        )

        setHistoricalTimeDraft(
          historicalTimeToForm(
            updatedConfig.patterns
              .orderTime
          )
        )

        setConfigs(previous =>
          previous.map(item =>
            item.version ===
              updatedConfig.version
              ? {
                  ...item,
                  ...updatedConfig
                }
              : item
          )
        )

        setActionMessage(
          `Order Time enregistré dans V${updatedConfig.version}. V${config?.version ?? '?'} reste active.`
        )
      } catch (saveError) {
        console.error(
          'Failed to save Order Time:',
          saveError
        )

        setError(
          saveError instanceof Error
            ? saveError.message
            : 'Impossible d’enregistrer Order Time.'
        )
      } finally {
        setSavingOrderTime(false)
      }
    }

  const handleSaveHistoricalTime =
    async () => {
      const currentOrderTime =
        draftConfig
          ?.patterns
          ?.orderTime

      const currentHistorical =
        currentOrderTime
          ?.historicalSignal

      if (
        !draftConfig ||
        draftConfig.status !== 'draft' ||
        !draftConfig.patterns ||
        !currentOrderTime ||
        !currentHistorical ||
        !historicalTimeDraft
      ) {
        return
      }

      try {
        setSavingHistoricalTime(true)
        setError(null)
        setActionMessage(null)

        const minimumCompletedOrders =
          Number(
            historicalTimeDraft
              .minimumCompletedOrders
          )

        const minimumFailureRate =
          Number(
            historicalTimeDraft
              .minimumFailureRate
          )

        const minimumExcessFailureRate =
          Number(
            historicalTimeDraft
              .minimumExcessFailureRate
          )

        const impact =
          Number(
            historicalTimeDraft
              .impact
          )

        if (
          !Number.isInteger(
            minimumCompletedOrders
          ) ||
          minimumCompletedOrders < 0
        ) {
          throw new Error(
            'Minimum completed orders doit être un entier positif ou nul.'
          )
        }

        if (
          !Number.isFinite(
            minimumFailureRate
          ) ||
          minimumFailureRate < 0 ||
          minimumFailureRate > 100
        ) {
          throw new Error(
            'Minimum failure rate doit être compris entre 0 et 100.'
          )
        }

        if (
          !Number.isFinite(
            minimumExcessFailureRate
          ) ||
          minimumExcessFailureRate < 0 ||
          minimumExcessFailureRate > 100
        ) {
          throw new Error(
            'Minimum excess failure rate doit être compris entre 0 et 100.'
          )
        }

        if (
          !Number.isFinite(
            impact
          )
        ) {
          throw new Error(
            'Impact Historical Time invalide.'
          )
        }

        const updatedHistorical = {
          ...currentHistorical,

          enabled:
            historicalTimeDraft.enabled,

          minimumCompletedOrders,

          minimumFailureRate,

          minimumExcessFailureRate,

          impact
        }

        const updatedOrderTime = {
          ...currentOrderTime,

          historicalSignal:
            updatedHistorical
        }

        const updatedPatterns = {
          ...draftConfig.patterns,

          orderTime:
            updatedOrderTime
        }

        const response =
          await api.put(
            `/api/admin/ai-scoring/configs/${draftConfig.version}`,
            {
              patterns:
                updatedPatterns
            }
          )

        const updatedConfig =
          response.data?.config ??
          response.data

        if (
          !updatedConfig ||
          updatedConfig.status !== 'draft' ||
          !updatedConfig.patterns
            ?.orderTime
            ?.historicalSignal
        ) {
          throw new Error(
            'Invalid updated Historical Time response'
          )
        }

        setDraftConfig(
          updatedConfig
        )

        setPatternDraft(
          patternsToForm(
            updatedConfig.patterns
          )
        )

        setOrderTimeDraft(
          orderTimeToForm(
            updatedConfig.patterns
              .orderTime
          )
        )

        setHistoricalTimeDraft(
          historicalTimeToForm(
            updatedConfig.patterns
              .orderTime
          )
        )

        setConfigs(previous =>
          previous.map(item =>
            item.version ===
              updatedConfig.version
              ? {
                  ...item,
                  ...updatedConfig
                }
              : item
          )
        )

        setActionMessage(
          `Historical Time Signal enregistré dans V${updatedConfig.version}. V${config?.version ?? '?'} reste active.`
        )
      } catch (saveError) {
        console.error(
          'Failed to save Historical Time Signal:',
          saveError
        )

        setError(
          saveError instanceof Error
            ? saveError.message
            : 'Impossible d’enregistrer Historical Time Signal.'
        )
      } finally {
        setSavingHistoricalTime(false)
      }
    }

  const handleSaveCustomerSuccess =
    async () => {
      const currentCustomerHistory =
        draftConfig
          ?.customerHistory

      const currentSuccessful =
        currentCustomerHistory
          ?.successfulDeliveries

      if (
        !draftConfig ||
        draftConfig.status !== 'draft' ||
        !currentCustomerHistory ||
        !currentSuccessful ||
        !customerSuccessDraft
      ) {
        return
      }

      try {
        setSavingCustomerSuccess(true)
        setError(null)
        setActionMessage(null)

        const normalizedRules =
          customerSuccessDraft.rules.map(
            (rule, index) => {
              const min =
                rule.min.trim() === ''
                  ? null
                  : Number(rule.min)

              const max =
                rule.max.trim() === ''
                  ? null
                  : Number(rule.max)

              const impact =
                Number(
                  rule.impact
                )

              if (
                min !== null &&
                (
                  !Number.isInteger(min) ||
                  min < 0
                )
              ) {
                throw new Error(
                  `Minimum invalide pour ${rule.label}.`
                )
              }

              if (
                max !== null &&
                (
                  !Number.isInteger(max) ||
                  max < 0
                )
              ) {
                throw new Error(
                  `Maximum invalide pour ${rule.label}.`
                )
              }

              if (
                min !== null &&
                max !== null &&
                min > max
              ) {
                throw new Error(
                  `La borne minimum dépasse la borne maximum pour ${rule.label}.`
                )
              }

              if (
                !Number.isFinite(
                  impact
                )
              ) {
                throw new Error(
                  `Impact invalide pour ${rule.label}.`
                )
              }

              const original =
                currentSuccessful.rules
                  ?.find(
                    item =>
                      item.key ===
                      rule.key
                  )

              return {
                ...(original || {}),

                ...(rule._id
                  ? {
                      _id:
                        rule._id
                    }
                  : {}),

                key:
                  rule.key,

                label:
                  rule.label,

                enabled:
                  rule.enabled,

                min,
                max,

                includeMin:
                  rule.includeMin,

                includeMax:
                  rule.includeMax,

                impact,

                order:
                  index + 1
              }
            }
          )

        const updatedSuccessful = {
          ...currentSuccessful,

          enabled:
            customerSuccessDraft.enabled,

          rules:
            normalizedRules
        }

        const updatedCustomerHistory = {
          ...currentCustomerHistory,

          successfulDeliveries:
            updatedSuccessful
        }

        const response =
          await api.put(
            `/api/admin/ai-scoring/configs/${draftConfig.version}`,
            {
              customerHistory:
                updatedCustomerHistory
            }
          )

        const updatedConfig =
          response.data?.config ??
          response.data

        if (
          !updatedConfig ||
          updatedConfig.status !== 'draft' ||
          !updatedConfig.customerHistory
            ?.successfulDeliveries
        ) {
          throw new Error(
            'Invalid updated Customer History response'
          )
        }

        setDraftConfig(
          updatedConfig
        )

        setCustomerSuccessDraft(
          customerSuccessToForm(
            updatedConfig.customerHistory
          )
        )

        setCustomerFailureDraft(
          customerFailureToForm(
            updatedConfig.customerHistory
          )
        )

        setConfigs(previous =>
          previous.map(item =>
            item.version ===
              updatedConfig.version
              ? {
                  ...item,
                  ...updatedConfig
                }
              : item
          )
        )

        setActionMessage(
          `Successful Deliveries enregistré dans V${updatedConfig.version}. V${config?.version ?? '?'} reste active.`
        )
      } catch (saveError) {
        console.error(
          'Failed to save Successful Deliveries:',
          saveError
        )

        setError(
          saveError instanceof Error
            ? saveError.message
            : 'Impossible d’enregistrer Successful Deliveries.'
        )
      } finally {
        setSavingCustomerSuccess(false)
      }
    }

  const handleSaveCustomerFailure =
    async () => {
      const currentCustomerHistory =
        draftConfig
          ?.customerHistory

      const currentFailed =
        currentCustomerHistory
          ?.failedDeliveries

      if (
        !draftConfig ||
        draftConfig.status !== 'draft' ||
        !currentCustomerHistory ||
        !currentFailed ||
        !customerFailureDraft
      ) {
        return
      }

      try {
        setSavingCustomerFailure(true)
        setError(null)
        setActionMessage(null)

        const normalizedRules =
          customerFailureDraft.rules.map(
            (rule, index) => {
              const min =
                rule.min.trim() === ''
                  ? null
                  : Number(rule.min)

              const max =
                rule.max.trim() === ''
                  ? null
                  : Number(rule.max)

              const impact =
                Number(
                  rule.impact
                )

              if (
                min !== null &&
                (
                  !Number.isInteger(min) ||
                  min < 0
                )
              ) {
                throw new Error(
                  `Minimum invalide pour ${rule.label}.`
                )
              }

              if (
                max !== null &&
                (
                  !Number.isInteger(max) ||
                  max < 0
                )
              ) {
                throw new Error(
                  `Maximum invalide pour ${rule.label}.`
                )
              }

              if (
                min !== null &&
                max !== null &&
                min > max
              ) {
                throw new Error(
                  `La borne minimum dépasse la borne maximum pour ${rule.label}.`
                )
              }

              if (
                !Number.isFinite(
                  impact
                )
              ) {
                throw new Error(
                  `Impact invalide pour ${rule.label}.`
                )
              }

              const original =
                currentFailed.rules
                  ?.find(
                    item =>
                      item.key ===
                      rule.key
                  )

              return {
                ...(original || {}),

                ...(rule._id
                  ? {
                      _id:
                        rule._id
                    }
                  : {}),

                key:
                  rule.key,

                label:
                  rule.label,

                enabled:
                  rule.enabled,

                min,
                max,

                includeMin:
                  rule.includeMin,

                includeMax:
                  rule.includeMax,

                impact,

                order:
                  index + 1
              }
            }
          )

        const updatedFailed = {
          ...currentFailed,

          enabled:
            customerFailureDraft.enabled,

          rules:
            normalizedRules
        }

        const updatedCustomerHistory = {
          ...currentCustomerHistory,

          failedDeliveries:
            updatedFailed
        }

        const response =
          await api.put(
            `/api/admin/ai-scoring/configs/${draftConfig.version}`,
            {
              customerHistory:
                updatedCustomerHistory
            }
          )

        const updatedConfig =
          response.data?.config ??
          response.data

        if (
          !updatedConfig ||
          updatedConfig.status !== 'draft' ||
          !updatedConfig.customerHistory
            ?.failedDeliveries
        ) {
          throw new Error(
            'Invalid updated Failed Deliveries response'
          )
        }

        setDraftConfig(
          updatedConfig
        )

        setCustomerSuccessDraft(
          customerSuccessToForm(
            updatedConfig.customerHistory
          )
        )

        setCustomerFailureDraft(
          customerFailureToForm(
            updatedConfig.customerHistory
          )
        )

        setConfigs(previous =>
          previous.map(item =>
            item.version ===
              updatedConfig.version
              ? {
                  ...item,
                  ...updatedConfig
                }
              : item
          )
        )

        setActionMessage(
          `Failed Deliveries enregistré dans V${updatedConfig.version}. V${config?.version ?? '?'} reste active.`
        )
      } catch (saveError) {
        console.error(
          'Failed to save Failed Deliveries:',
          saveError
        )

        setError(
          saveError instanceof Error
            ? saveError.message
            : 'Impossible d’enregistrer Failed Deliveries.'
        )
      } finally {
        setSavingCustomerFailure(false)
      }
    }

  const handleSaveFeedbackCategories =
    async () => {
      const currentFeedback =
        draftConfig
          ?.operatorFeedback

      if (
        !draftConfig ||
        draftConfig.status !== 'draft' ||
        !currentFeedback
      ) {
        return
      }

      try {
        setSavingFeedbackCategories(true)
        setError(null)
        setActionMessage(null)

        const keySet =
          new Set<string>()

        const normalizedCategories =
          feedbackCategoriesDraft.map(
            (category, index) => {
              const key =
                category.key.trim()

              const label =
                category.label.trim()

              if (
                !key ||
                !label
              ) {
                throw new Error(
                  `La catégorie ${index + 1} doit avoir une clé et un libellé.`
                )
              }

              const normalizedKey =
                key.toLowerCase()

              if (
                keySet.has(
                  normalizedKey
                )
              ) {
                throw new Error(
                  `Clé de catégorie dupliquée : ${key}.`
                )
              }

              keySet.add(
                normalizedKey
              )

              const original =
                currentFeedback
                  .categories
                  ?.find(
                    item =>
                      item.key ===
                      category.key
                  )

              return {
                ...(original || {}),

                ...(category._id
                  ? {
                      _id:
                        category._id
                    }
                  : {}),

                key,
                label,

                active:
                  category.active,

                order:
                  index + 1
              }
            }
          )

        const updatedFeedback = {
          ...currentFeedback,

          categories:
            normalizedCategories
        }

        const response =
          await api.put(
            `/api/admin/ai-scoring/configs/${draftConfig.version}`,
            {
              operatorFeedback:
                updatedFeedback
            }
          )

        const updatedConfig =
          response.data?.config ??
          response.data

        if (
          !updatedConfig ||
          updatedConfig.status !== 'draft' ||
          !updatedConfig.operatorFeedback
        ) {
          throw new Error(
            'Invalid updated Operator Feedback response'
          )
        }

        setDraftConfig(
          updatedConfig
        )

        setFeedbackCategoriesDraft(
          feedbackCategoriesToForm(
            updatedConfig.operatorFeedback
          )
        )

        setFeedbackQuestionsDraft(
          feedbackQuestionsToForm(
            updatedConfig.operatorFeedback
          )
        )

        setConfigs(previous =>
          previous.map(item =>
            item.version ===
              updatedConfig.version
              ? {
                  ...item,
                  ...updatedConfig
                }
              : item
          )
        )

        setActionMessage(
          `Catégories Operator Feedback enregistrées dans V${updatedConfig.version}. V${config?.version ?? '?'} reste active.`
        )
      } catch (saveError) {
        console.error(
          'Failed to save Operator Feedback categories:',
          saveError
        )

        setError(
          saveError instanceof Error
            ? saveError.message
            : 'Impossible d’enregistrer les catégories Operator Feedback.'
        )
      } finally {
        setSavingFeedbackCategories(false)
      }
    }

  const handleSaveFeedbackQuestions =
    async () => {
      const currentFeedback =
        draftConfig
          ?.operatorFeedback

      if (
        !draftConfig ||
        draftConfig.status !== 'draft' ||
        !currentFeedback
      ) {
        return
      }

      try {
        setSavingFeedbackQuestions(true)
        setError(null)
        setActionMessage(null)

        const categoryKeys =
          new Set(
            (
              currentFeedback.categories || []
            ).map(
              category =>
                category.key
            )
          )

        const questionKeys =
          new Set<string>()

        const normalizedQuestions =
          feedbackQuestionsDraft.map(
            (question, index) => {
              const key =
                question.key.trim()

              const categoryKey =
                question.categoryKey.trim()

              const title =
                question.title.trim()

              const prompt =
                question.prompt.trim()

              if (
                !key ||
                !categoryKey ||
                !title ||
                !prompt
              ) {
                throw new Error(
                  `La question ${index + 1} doit avoir une clé, une catégorie, un titre et un prompt.`
                )
              }

              const normalizedKey =
                key.toLowerCase()

              if (
                questionKeys.has(
                  normalizedKey
                )
              ) {
                throw new Error(
                  `Clé de question dupliquée : ${key}.`
                )
              }

              questionKeys.add(
                normalizedKey
              )

              if (
                !categoryKeys.has(
                  categoryKey
                )
              ) {
                throw new Error(
                  `Catégorie inconnue pour ${title} : ${categoryKey}. Enregistrez d’abord les catégories.`
                )
              }

              const maxSelections =
                question.type ===
                  'single_choice'
                  ? 1
                  : Number(
                      question.maxSelections
                    )

              if (
                !Number.isInteger(
                  maxSelections
                ) ||
                maxSelections < 1
              ) {
                throw new Error(
                  `Max selections invalide pour ${title}.`
                )
              }

              if (
                !question.answers ||
                question.answers.length === 0
              ) {
                throw new Error(
                  `${title} doit conserver au moins une réponse.`
                )
              }

              const original =
                currentFeedback
                  .questions
                  ?.find(
                    item =>
                      (
                        question._id &&
                        item._id ===
                          question._id
                      ) ||
                      item.key ===
                        question.key
                  )

              return {
                ...(original || {}),

                ...(question._id
                  ? {
                      _id:
                        question._id
                    }
                  : {}),

                key,
                categoryKey,
                title,
                prompt,

                type:
                  question.type,

                active:
                  question.active,

                required:
                  question.required,

                maxSelections,

                order:
                  index + 1,

                answers:
                  question.answers
              }
            }
          )

        const updatedFeedback = {
          ...currentFeedback,

          questions:
            normalizedQuestions
        }

        const response =
          await api.put(
            `/api/admin/ai-scoring/configs/${draftConfig.version}`,
            {
              operatorFeedback:
                updatedFeedback
            }
          )

        const updatedConfig =
          response.data?.config ??
          response.data

        if (
          !updatedConfig ||
          updatedConfig.status !== 'draft' ||
          !updatedConfig.operatorFeedback
        ) {
          throw new Error(
            'Invalid updated Operator Feedback questions response'
          )
        }

        setDraftConfig(
          updatedConfig
        )

        setFeedbackCategoriesDraft(
          feedbackCategoriesToForm(
            updatedConfig.operatorFeedback
          )
        )

        setFeedbackQuestionsDraft(
          feedbackQuestionsToForm(
            updatedConfig.operatorFeedback
          )
        )

        setConfigs(previous =>
          previous.map(item =>
            item.version ===
              updatedConfig.version
              ? {
                  ...item,
                  ...updatedConfig
                }
              : item
          )
        )

        setActionMessage(
          `Questions Operator Feedback enregistrées dans V${updatedConfig.version}. V${config?.version ?? '?'} reste active.`
        )
      } catch (saveError) {
        console.error(
          'Failed to save Operator Feedback questions:',
          saveError
        )

        setError(
          saveError instanceof Error
            ? saveError.message
            : 'Impossible d’enregistrer les questions Operator Feedback.'
        )
      } finally {
        setSavingFeedbackQuestions(false)
      }
    }

  const handleSaveFeedbackAnswers =
    async () => {
      const currentFeedback =
        draftConfig
          ?.operatorFeedback

      if (
        !draftConfig ||
        draftConfig.status !== 'draft' ||
        !currentFeedback
      ) {
        return
      }

      try {
        setSavingFeedbackAnswers(true)
        setError(null)
        setActionMessage(null)

        const normalizedQuestions =
          feedbackQuestionsDraft.map(
            (question, questionIndex) => {
              if (
                !question.answers ||
                question.answers.length === 0
              ) {
                throw new Error(
                  `${question.title || `Question ${questionIndex + 1}`} doit avoir au moins une réponse.`
                )
              }

              const answerKeys =
                new Set<string>()

              const normalizedAnswers =
                question.answers.map(
                  (answer, answerIndex) => {
                    const key =
                      answer.key.trim()

                    const label =
                      answer.label.trim()

                    const impact =
                      Number(
                        answer.impact
                      )

                    if (
                      !key ||
                      !label
                    ) {
                      throw new Error(
                        `La réponse ${answerIndex + 1} de "${question.title}" doit avoir une clé et un libellé.`
                      )
                    }

                    const normalizedKey =
                      key.toLowerCase()

                    if (
                      answerKeys.has(
                        normalizedKey
                      )
                    ) {
                      throw new Error(
                        `Clé de réponse dupliquée dans "${question.title}" : ${key}.`
                      )
                    }

                    answerKeys.add(
                      normalizedKey
                    )

                    if (
                      !Number.isFinite(
                        impact
                      )
                    ) {
                      throw new Error(
                        `Impact invalide pour "${label}".`
                      )
                    }

                    return {
                      ...answer,

                      key,
                      label,
                      impact,

                      active:
                        answer.active !== false,

                      order:
                        answerIndex + 1
                    }
                  }
                )

              const activeAnswerCount =
                normalizedAnswers.filter(
                  answer =>
                    answer.active
                ).length

              if (
                question.active &&
                activeAnswerCount === 0
              ) {
                throw new Error(
                  `"${question.title}" est active et doit avoir au moins une réponse active.`
                )
              }

              const maxSelections =
                question.type ===
                  'single_choice'
                  ? 1
                  : Number(
                      question.maxSelections
                    )

              if (
                !Number.isInteger(
                  maxSelections
                ) ||
                maxSelections < 1
              ) {
                throw new Error(
                  `Max selections invalide pour "${question.title}".`
                )
              }

              if (
                question.active &&
                maxSelections >
                  activeAnswerCount
              ) {
                throw new Error(
                  `Max selections de "${question.title}" (${maxSelections}) dépasse le nombre de réponses actives (${activeAnswerCount}).`
                )
              }

              const original =
                currentFeedback
                  .questions
                  ?.find(
                    item =>
                      (
                        question._id &&
                        item._id ===
                          question._id
                      ) ||
                      item.key ===
                        question.key
                  )

              return {
                ...(original || {}),

                ...(question._id
                  ? {
                      _id:
                        question._id
                    }
                  : {}),

                key:
                  question.key.trim(),

                categoryKey:
                  question.categoryKey,

                title:
                  question.title.trim(),

                prompt:
                  question.prompt.trim(),

                type:
                  question.type,

                active:
                  question.active,

                required:
                  question.required,

                maxSelections,

                order:
                  questionIndex + 1,

                answers:
                  normalizedAnswers
              }
            }
          )

        const updatedFeedback = {
          ...currentFeedback,

          questions:
            normalizedQuestions
        }

        const response =
          await api.put(
            `/api/admin/ai-scoring/configs/${draftConfig.version}`,
            {
              operatorFeedback:
                updatedFeedback
            }
          )

        const updatedConfig =
          response.data?.config ??
          response.data

        if (
          !updatedConfig ||
          updatedConfig.status !== 'draft' ||
          !updatedConfig.operatorFeedback
        ) {
          throw new Error(
            'Invalid updated Operator Feedback answers response'
          )
        }

        setDraftConfig(
          updatedConfig
        )

        setFeedbackCategoriesDraft(
          feedbackCategoriesToForm(
            updatedConfig.operatorFeedback
          )
        )

        setFeedbackQuestionsDraft(
          feedbackQuestionsToForm(
            updatedConfig.operatorFeedback
          )
        )

        setConfigs(previous =>
          previous.map(item =>
            item.version ===
              updatedConfig.version
              ? {
                  ...item,
                  ...updatedConfig
                }
              : item
          )
        )

        setActionMessage(
          `Réponses Operator Feedback enregistrées dans V${updatedConfig.version}. V${config?.version ?? '?'} reste active.`
        )
      } catch (saveError) {
        console.error(
          'Failed to save Operator Feedback answers:',
          saveError
        )

        setError(
          saveError instanceof Error
            ? saveError.message
            : 'Impossible d’enregistrer les réponses Operator Feedback.'
        )
      } finally {
        setSavingFeedbackAnswers(false)
      }
    }

  const handleSaveModules =
    async () => {
      if (
        !draftConfig ||
        draftConfig.status !== 'draft' ||
        !draftConfig.customerHistory ||
        !draftConfig.operatorFeedback ||
        !moduleDraft
      ) {
        return
      }

      try {
        setSavingModules(true)
        setError(null)
        setActionMessage(null)

        const updatedCustomerHistory = {
          ...draftConfig.customerHistory,

          enabled:
            moduleDraft.customerHistory
        }

        const updatedOperatorFeedback = {
          ...draftConfig.operatorFeedback,

          enabled:
            moduleDraft.operatorFeedback
        }

        const response =
          await api.put(
            `/api/admin/ai-scoring/configs/${draftConfig.version}`,
            {
              customerHistory:
                updatedCustomerHistory,

              operatorFeedback:
                updatedOperatorFeedback
            }
          )

        const updatedConfig =
          response.data?.config ??
          response.data

        if (
          !updatedConfig ||
          updatedConfig.status !== 'draft'
        ) {
          throw new Error(
            'Invalid updated module response'
          )
        }

        setDraftConfig(
          updatedConfig
        )

        setModuleDraft(
          modulesToForm(
            updatedConfig
          )
        )

        setCustomerSuccessDraft(
          customerSuccessToForm(
            updatedConfig.customerHistory
          )
        )

        setCustomerFailureDraft(
          customerFailureToForm(
            updatedConfig.customerHistory
          )
        )

        setFeedbackCategoriesDraft(
          feedbackCategoriesToForm(
            updatedConfig.operatorFeedback
          )
        )

        setFeedbackQuestionsDraft(
          feedbackQuestionsToForm(
            updatedConfig.operatorFeedback
          )
        )

        setConfigs(previous =>
          previous.map(item =>
            item.version ===
              updatedConfig.version
              ? {
                  ...item,
                  ...updatedConfig
                }
              : item
          )
        )

        setActionMessage(
          `Modules AI enregistrés dans V${updatedConfig.version}. V${config?.version ?? '?'} reste active.`
        )
      } catch (saveError) {
        console.error(
          'Failed to save AI modules:',
          saveError
        )

        setError(
          saveError instanceof Error
            ? saveError.message
            : 'Impossible d’enregistrer les modules AI.'
        )
      } finally {
        setSavingModules(false)
      }
    }

  const handleActivateDraft =
    async (
      version: number
    ) => {
      if (
        !draftConfig ||
        draftConfig.status !== 'draft' ||
        draftConfig.version !== version
      ) {
        setError(
          'Le brouillon doit être complètement chargé avant activation.'
        )
        return
      }

      const confirmed =
        window.confirm(
          `Activer la configuration AI Scoring V${version} ?\n\n` +
          `V${config?.version ?? '?'} est actuellement utilisée en production.\n` +
          `Après activation, V${version} deviendra la nouvelle version active.`
        )

      if (!confirmed) {
        return
      }

      try {
        setActivatingDraft(true)
        setError(null)
        setActionMessage(null)

        const activationResponse =
          await api.post(
            `/api/admin/ai-scoring/configs/${version}/activate`,
            {}
          )

        const activated =
          activationResponse.data?.config ??
          activationResponse.data

        if (
          !activated ||
          activated.status !== 'active' ||
          activated.version !== version
        ) {
          throw new Error(
            'Invalid AI scoring activation response'
          )
        }

        /*
         * Reload canonical state after activation instead of
         * guessing locally which versions are active/archived.
         */
        const [
          activeResponse,
          configsResponse
        ] = await Promise.all([
          api.get(
            '/api/admin/ai-scoring/active'
          ),

          api.get(
            '/api/admin/ai-scoring/configs'
          )
        ])

        const activePayload =
          activeResponse.data?.config ??
          activeResponse.data

        const configsPayload =
          Array.isArray(
            configsResponse.data
          )
            ? configsResponse.data
            : Array.isArray(
                configsResponse.data?.configs
              )
              ? configsResponse.data.configs
              : []

        if (
          !activePayload ||
          activePayload.status !== 'active' ||
          activePayload.version !== version ||
          !activePayload.general
        ) {
          throw new Error(
            'Activation réussie mais état actif impossible à recharger.'
          )
        }

        setConfig(
          activePayload
        )

        setConfigs(
          configsPayload
        )

        setActionMessage(
          activationResponse.data?.message ||
          `AI Scoring V${version} est maintenant active.`
        )
      } catch (activationError) {
        console.error(
          'Failed to activate AI scoring draft:',
          activationError
        )

        const apiError =
          activationError as {
            response?: {
              data?: {
                error?: string
                details?: unknown
              }
            }
          }

        const backendError =
          apiError.response
            ?.data
            ?.error

        const backendDetails =
          apiError.response
            ?.data
            ?.details

        const detailsText =
          Array.isArray(
            backendDetails
          )
            ? backendDetails
                .map(
                  item =>
                    String(item)
                )
                .join(' · ')
            : ''

        setError(
          backendError
            ? detailsText
              ? `${backendError} — ${detailsText}`
              : backendError
            : activationError instanceof Error
              ? activationError.message
              : 'Impossible d’activer la configuration AI Scoring.'
        )
      } finally {
        setActivatingDraft(false)
      }
    }

  const handleRunSimulator =
    async () => {
      const targetVersion =
        draftConfig?.version ??
        config?.version

      if (!targetVersion) {
        setError(
          'Aucune configuration AI disponible pour la simulation.'
        )
        return
      }

      try {
        setSimulating(true)
        setError(null)
        setActionMessage(null)
        setSimulatorResult(null)

        const totalAmount =
          Number(
            simulatorForm.totalAmount
          )

        if (
          !Number.isFinite(totalAmount) ||
          totalAmount < 0
        ) {
          throw new Error(
            'Le montant de simulation doit être un nombre positif ou zéro.'
          )
        }

        const shopId =
          simulatorForm
            .shopId
            .trim()

        if (
          shopId &&
          !/^[a-fA-F0-9]{24}$/.test(
            shopId
          )
        ) {
          throw new Error(
            'Shop ID invalide. Utilisez un identifiant MongoDB de 24 caractères ou laissez le champ vide.'
          )
        }

        let createdAt:
          | string
          | undefined

        if (
          simulatorForm.createdAt
        ) {
          const parsedDate =
            new Date(
              simulatorForm.createdAt
            )

          if (
            Number.isNaN(
              parsedDate.getTime()
            )
          ) {
            throw new Error(
              'Date/heure de simulation invalide.'
            )
          }

          createdAt =
            parsedDate.toISOString()
        }

        const response =
          await api.post(
            `/api/admin/ai-scoring/configs/${targetVersion}/simulate`,
            {
              order: {
                shopId:
                  shopId || null,

                clientInfo: {
                  name:
                    'AI Simulator',

                  phone:
                    simulatorForm
                      .phone
                      .trim(),

                  address: {
                    street:
                      simulatorForm
                        .street
                        .trim(),

                    city:
                      simulatorForm
                        .city
                        .trim(),

                    state:
                      simulatorForm
                        .state
                        .trim(),

                    zipCode:
                      simulatorForm
                        .zipCode
                        .trim()
                  }
                },

                region:
                  simulatorForm
                    .region
                    .trim(),

                totalAmount,

                ...(createdAt
                  ? {
                      createdAt
                    }
                  : {})
              }
            }
          )

        const payload =
          response.data as
            SimulatorResult

        if (
          !payload ||
          !payload.simulation ||
          typeof payload.simulation
            .finalScore !== 'number'
        ) {
          throw new Error(
            'Réponse Simulator invalide.'
          )
        }

        setSimulatorResult(
          payload
        )

        setActionMessage(
          `Simulation terminée avec V${payload.version} (${payload.status}).`
        )
      } catch (simulationError) {
        console.error(
          'Failed to run AI scoring simulator:',
          simulationError
        )

        const apiError =
          simulationError as {
            response?: {
              data?: {
                error?: string
                details?: unknown
              }
            }
          }

        const backendError =
          apiError.response
            ?.data
            ?.error

        setError(
          backendError ||
          (
            simulationError instanceof Error
              ? simulationError.message
              : 'Impossible d’exécuter le Simulator AI.'
          )
        )
      } finally {
        setSimulating(false)
      }
    }

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['admin']}>
        <DashboardLayout userRole="admin">
          <div className="space-y-6 animate-pulse">
            <div className="h-20 rounded-xl dark:bg-slate-800 light:bg-gray-100" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(3)].map((_, index) => (
                <div
                  key={index}
                  className="h-32 rounded-xl dark:bg-slate-800 light:bg-gray-100"
                />
              ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {[...Array(4)].map((_, index) => (
                <div
                  key={index}
                  className="h-40 rounded-xl dark:bg-slate-800 light:bg-gray-100"
                />
              ))}
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <DashboardLayout userRole="admin">
        <div className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold">
                AI Scoring Engine
              </h1>

              <p className="mt-1 text-sm dark:text-slate-400 light:text-gray-600">
                Configuration centrale des règles utilisées
                pour calculer le score de confiance des commandes.
              </p>
            </div>

            {config && (
              <div className="flex items-center gap-2 rounded-full bg-green-500/10 px-3 py-1.5 text-sm font-medium text-green-500">
                <CheckCircleIcon className="h-4 w-4" />
                V{config.version} Active
              </div>
            )}
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-500">
              {error}
            </div>
          )}

          {actionMessage && (
            <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-500">
              {actionMessage}
            </div>
          )}

          {config && (
            <>
              <section className="card p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <DocumentDuplicateIcon className="h-5 w-5" />

                      <h2 className="font-semibold">
                        Configuration versions
                      </h2>
                    </div>

                    <p className="mt-2 text-sm dark:text-slate-400 light:text-gray-600">
                      La version active reste protégée.
                      Les modifications doivent être préparées
                      dans une version brouillon.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="rounded-lg border dark:border-slate-700 light:border-gray-200 px-3 py-2">
                      <p className="text-xs dark:text-slate-400 light:text-gray-500">
                        Active
                      </p>

                      <p className="font-semibold text-green-500">
                        V{config.version}
                      </p>
                    </div>

                    {latestDraft ? (
                      <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2">
                        <p className="text-xs text-amber-500">
                          Draft
                        </p>

                        <p className="font-semibold text-amber-500">
                          V{latestDraft.version}
                        </p>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleCreateDraft}
                        disabled={creatingDraft}
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <DocumentDuplicateIcon className="h-4 w-4" />

                        {creatingDraft
                          ? 'Création...'
                          : `Créer un brouillon depuis V${config.version}`}
                      </button>
                    )}
                  </div>
                </div>

                {latestDraft && (
                  <div className="mt-4 rounded-lg dark:bg-slate-800 light:bg-gray-50 p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-medium">
                          V{latestDraft.version} — Draft
                        </p>

                        <p className="mt-1 text-xs dark:text-slate-400 light:text-gray-600">
                          {latestDraft.clonedFromVersion
                            ? `Clonée depuis V${latestDraft.clonedFromVersion}`
                            : 'Configuration en préparation'}
                        </p>
                      </div>

                      <div className="flex flex-col items-start gap-2 sm:items-end">
                        <span className="text-xs font-medium text-amber-500">
                          Non utilisée pour le scoring production
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            void handleActivateDraft(
                              latestDraft.version
                            )
                          }
                          disabled={
                            activatingDraft ||
                            draftLoading ||
                            !draftConfig ||
                            draftConfig.version !==
                              latestDraft.version
                          }
                          className="inline-flex items-center justify-center rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {activatingDraft
                            ? `Activation V${latestDraft.version}...`
                            : `Activer V${latestDraft.version}`}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </section>

              <section className="card p-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="font-semibold">
                      General scoring
                    </h2>

                    <p className="mt-1 text-sm dark:text-slate-400 light:text-gray-600">
                      Les valeurs actives restent protégées.
                      Seule la version brouillon peut être modifiée.
                    </p>
                  </div>

                  {draftConfig && (
                    <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-500">
                      Editing V{draftConfig.version} Draft
                    </span>
                  )}
                </div>

                {!latestDraft && (
                  <div className="mt-5 rounded-lg dark:bg-slate-800 light:bg-gray-50 p-4">
                    <p className="text-sm font-medium">
                      Aucun brouillon disponible
                    </p>

                    <p className="mt-1 text-sm dark:text-slate-400 light:text-gray-600">
                      Créez d’abord un brouillon depuis V{config.version}
                      pour modifier les valeurs General.
                    </p>
                  </div>
                )}

                {latestDraft && draftLoading && (
                  <div className="mt-5 animate-pulse grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[...Array(3)].map(
                      (_, index) => (
                        <div
                          key={index}
                          className="h-24 rounded-lg dark:bg-slate-800 light:bg-gray-100"
                        />
                      )
                    )}
                  </div>
                )}

                {draftConfig &&
                  generalDraft &&
                  !draftLoading && (
                    <>
                      <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <label className="block">
                          <span className="text-sm font-medium">
                            Base Score
                          </span>

                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={
                              generalDraft.baseScore
                            }
                            onChange={event =>
                              setGeneralDraft(
                                previous =>
                                  previous
                                    ? {
                                        ...previous,
                                        baseScore:
                                          event.target.value
                                      }
                                    : previous
                              )
                            }
                            className="mt-2 block w-full rounded-lg border dark:border-slate-700 dark:bg-slate-900 light:border-gray-300 light:bg-white px-3 py-2"
                          />

                          <p className="mt-1 text-xs dark:text-slate-500 light:text-gray-500">
                            Active : {config.general.baseScore}
                          </p>
                        </label>

                        <label className="block">
                          <span className="text-sm font-medium">
                            Minimum Score
                          </span>

                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={
                              generalDraft.minimumScore
                            }
                            onChange={event =>
                              setGeneralDraft(
                                previous =>
                                  previous
                                    ? {
                                        ...previous,
                                        minimumScore:
                                          event.target.value
                                      }
                                    : previous
                              )
                            }
                            className="mt-2 block w-full rounded-lg border dark:border-slate-700 dark:bg-slate-900 light:border-gray-300 light:bg-white px-3 py-2"
                          />

                          <p className="mt-1 text-xs dark:text-slate-500 light:text-gray-500">
                            Active : {config.general.minimumScore}
                          </p>
                        </label>

                        <label className="block">
                          <span className="text-sm font-medium">
                            Maximum Score
                          </span>

                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={
                              generalDraft.maximumScore
                            }
                            onChange={event =>
                              setGeneralDraft(
                                previous =>
                                  previous
                                    ? {
                                        ...previous,
                                        maximumScore:
                                          event.target.value
                                      }
                                    : previous
                              )
                            }
                            className="mt-2 block w-full rounded-lg border dark:border-slate-700 dark:bg-slate-900 light:border-gray-300 light:bg-white px-3 py-2"
                          />

                          <p className="mt-1 text-xs dark:text-slate-500 light:text-gray-500">
                            Active : {config.general.maximumScore}
                          </p>
                        </label>
                      </div>

                      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs dark:text-slate-400 light:text-gray-600">
                          Enregistrer modifie uniquement V{draftConfig.version}.
                          V{config.version} continue à calculer les scores en production.
                        </p>

                        <button
                          type="button"
                          onClick={
                            handleSaveGeneral
                          }
                          disabled={
                            savingGeneral
                          }
                          className="inline-flex justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {savingGeneral
                            ? 'Enregistrement...'
                            : `Enregistrer V${draftConfig.version}`}
                        </button>
                      </div>
                    </>
                  )}
              </section>

              <section className="card p-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="font-semibold">
                      Pattern signals
                    </h2>

                    <p className="mt-1 text-sm dark:text-slate-400 light:text-gray-600">
                      Activez ou désactivez les grandes familles de signaux.
                      Les règles et leurs points restent conservés.
                    </p>
                  </div>

                  {draftConfig && (
                    <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-500">
                      Editing V{draftConfig.version} Draft
                    </span>
                  )}
                </div>

                {!latestDraft && (
                  <div className="mt-5 rounded-lg dark:bg-slate-800 light:bg-gray-50 p-4">
                    <p className="text-sm">
                      Créez d’abord un brouillon pour modifier les Patterns.
                    </p>
                  </div>
                )}

                {draftConfig &&
                  patternDraft &&
                  !draftLoading && (
                    <>
                      <div className="mt-5 space-y-3">
                        {[
                          {
                            key: 'enabled' as const,
                            title: 'Patterns Engine',
                            description:
                              'Interrupteur principal de tous les signaux Pattern.'
                          },
                          {
                            key: 'address' as const,
                            title: 'Address',
                            description:
                              'Complétude et qualité de l’adresse.'
                          },
                          {
                            key: 'geographicZone' as const,
                            title: 'Geographic Zone',
                            description:
                              'Règles liées au gouvernorat, ville, délégation ou code postal.'
                          },
                          {
                            key: 'orderValue' as const,
                            title: 'Order Value',
                            description:
                              'Montant absolu et comparaison avec l’historique.'
                          },
                          {
                            key: 'orderTime' as const,
                            title: 'Order Time',
                            description:
                              'Heure de commande et signal horaire historique.'
                          }
                        ].map(item => (
                          <div
                            key={item.key}
                            className="flex items-center justify-between gap-4 rounded-lg border dark:border-slate-800 light:border-gray-200 p-4"
                          >
                            <div>
                              <p className="text-sm font-medium">
                                {item.title}
                              </p>

                              <p className="mt-1 text-xs dark:text-slate-400 light:text-gray-600">
                                {item.description}
                              </p>
                            </div>

                            <button
                              type="button"
                              role="switch"
                              aria-checked={
                                patternDraft[item.key]
                              }
                              onClick={() =>
                                setPatternDraft(
                                  previous =>
                                    previous
                                      ? {
                                          ...previous,
                                          [item.key]:
                                            !previous[item.key]
                                        }
                                      : previous
                                )
                              }
                              className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                                patternDraft[item.key]
                                  ? 'bg-green-500'
                                  : 'bg-slate-400'
                              }`}
                            >
                              <span
                                className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                                  patternDraft[item.key]
                                    ? 'left-6'
                                    : 'left-1'
                                }`}
                              />
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs dark:text-slate-400 light:text-gray-600">
                          Cette sauvegarde modifie uniquement V{draftConfig.version}.
                          Les pondérations existantes sont conservées.
                        </p>

                        <button
                          type="button"
                          onClick={
                            handleSavePatterns
                          }
                          disabled={
                            savingPatterns
                          }
                          className="inline-flex justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {savingPatterns
                            ? 'Enregistrement...'
                            : `Enregistrer Patterns V${draftConfig.version}`}
                        </button>
                      </div>
                    </>
                  )}
              </section>

              <section className="card p-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="font-semibold">
                      Address Scoring
                    </h2>

                    <p className="mt-1 text-sm dark:text-slate-400 light:text-gray-600">
                      Configurez la lecture de l’adresse et les impacts appliqués au score.
                    </p>
                  </div>

                  {draftConfig && (
                    <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-500">
                      Editing V{draftConfig.version} Draft
                    </span>
                  )}
                </div>

                {!latestDraft && (
                  <div className="mt-5 rounded-lg dark:bg-slate-800 light:bg-gray-50 p-4">
                    <p className="text-sm">
                      Créez d’abord un brouillon pour modifier Address Scoring.
                    </p>
                  </div>
                )}

                {draftConfig &&
                  addressDraft &&
                  !draftLoading && (
                    <>
                      <div className="mt-5">
                        <p className="text-sm font-medium">
                          Scoring mode
                        </p>

                        <p className="mt-1 text-xs dark:text-slate-400 light:text-gray-600">
                          Exclusive applique le niveau global.
                          Cumulative additionne les éléments activés.
                        </p>

                        <div className="mt-3 inline-flex rounded-lg border dark:border-slate-700 light:border-gray-200 p-1">
                          {(
                            [
                              'exclusive',
                              'cumulative'
                            ] as const
                          ).map(mode => (
                            <button
                              key={mode}
                              type="button"
                              onClick={() =>
                                setAddressDraft(
                                  previous =>
                                    previous
                                      ? {
                                          ...previous,
                                          mode
                                        }
                                      : previous
                                )
                              }
                              className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                                addressDraft.mode === mode
                                  ? 'bg-blue-600 text-white'
                                  : 'dark:text-slate-300 light:text-gray-600'
                              }`}
                            >
                              {mode === 'exclusive'
                                ? 'Exclusive'
                                : 'Cumulative'}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="mt-6">
                        <h3 className="text-sm font-semibold">
                          Address elements
                        </h3>

                        <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-3">
                          {(
                            [
                              ['street', 'Street'],
                              ['city', 'City'],
                              ['governorate', 'Governorate'],
                              ['postalCode', 'Postal Code']
                            ] as const
                          ).map(
                            ([key, label]) => (
                              <div
                                key={key}
                                className="rounded-lg border dark:border-slate-800 light:border-gray-200 p-4"
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <p className="text-sm font-medium">
                                    {label}
                                  </p>

                                  <button
                                    type="button"
                                    role="switch"
                                    aria-checked={
                                      addressDraft
                                        .elements[key]
                                        .enabled
                                    }
                                    onClick={() =>
                                      setAddressDraft(
                                        previous =>
                                          previous
                                            ? {
                                                ...previous,
                                                elements: {
                                                  ...previous.elements,

                                                  [key]: {
                                                    ...previous.elements[key],

                                                    enabled:
                                                      !previous
                                                        .elements[key]
                                                        .enabled
                                                  }
                                                }
                                              }
                                            : previous
                                      )
                                    }
                                    className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                                      addressDraft
                                        .elements[key]
                                        .enabled
                                        ? 'bg-green-500'
                                        : 'bg-slate-400'
                                    }`}
                                  >
                                    <span
                                      className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                                        addressDraft
                                          .elements[key]
                                          .enabled
                                          ? 'left-6'
                                          : 'left-1'
                                      }`}
                                    />
                                  </button>
                                </div>

                                <label className="mt-4 block">
                                  <span className="text-xs dark:text-slate-400 light:text-gray-600">
                                    Impact
                                  </span>

                                  <input
                                    type="number"
                                    value={
                                      addressDraft
                                        .elements[key]
                                        .impact
                                    }
                                    onChange={event =>
                                      setAddressDraft(
                                        previous =>
                                          previous
                                            ? {
                                                ...previous,
                                                elements: {
                                                  ...previous.elements,

                                                  [key]: {
                                                    ...previous.elements[key],

                                                    impact:
                                                      event.target.value
                                                  }
                                                }
                                              }
                                            : previous
                                      )
                                    }
                                    className="mt-1 block w-full rounded-lg border dark:border-slate-700 dark:bg-slate-900 light:border-gray-300 light:bg-white px-3 py-2"
                                  />
                                </label>
                              </div>
                            )
                          )}
                        </div>
                      </div>

                      <div className="mt-6">
                        <h3 className="text-sm font-semibold">
                          Address levels
                        </h3>

                        <div className="mt-3 space-y-3">
                          {addressDraft.levels.map(
                            level => (
                              <div
                                key={level.key}
                                className="grid grid-cols-1 gap-4 rounded-lg border dark:border-slate-800 light:border-gray-200 p-4 sm:grid-cols-[1fr_auto_140px] sm:items-center"
                              >
                                <div>
                                  <p className="text-sm font-medium">
                                    {level.label}
                                  </p>

                                  <p className="mt-1 text-xs dark:text-slate-500 light:text-gray-500">
                                    {level.key}
                                  </p>
                                </div>

                                <button
                                  type="button"
                                  role="switch"
                                  aria-checked={
                                    level.enabled
                                  }
                                  onClick={() =>
                                    setAddressDraft(
                                      previous =>
                                        previous
                                          ? {
                                              ...previous,

                                              levels:
                                                previous.levels.map(
                                                  item =>
                                                    item.key ===
                                                    level.key
                                                      ? {
                                                          ...item,

                                                          enabled:
                                                            !item.enabled
                                                        }
                                                      : item
                                                )
                                            }
                                          : previous
                                    )
                                  }
                                  className={`relative h-6 w-11 rounded-full transition ${
                                    level.enabled
                                      ? 'bg-green-500'
                                      : 'bg-slate-400'
                                  }`}
                                >
                                  <span
                                    className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                                      level.enabled
                                        ? 'left-6'
                                        : 'left-1'
                                    }`}
                                  />
                                </button>

                                <label>
                                  <span className="text-xs dark:text-slate-400 light:text-gray-600">
                                    Impact
                                  </span>

                                  <input
                                    type="number"
                                    value={
                                      level.impact
                                    }
                                    onChange={event =>
                                      setAddressDraft(
                                        previous =>
                                          previous
                                            ? {
                                                ...previous,

                                                levels:
                                                  previous.levels.map(
                                                    item =>
                                                      item.key ===
                                                      level.key
                                                        ? {
                                                            ...item,

                                                            impact:
                                                              event.target.value
                                                          }
                                                        : item
                                                  )
                                              }
                                            : previous
                                      )
                                    }
                                    className="mt-1 block w-full rounded-lg border dark:border-slate-700 dark:bg-slate-900 light:border-gray-300 light:bg-white px-3 py-2"
                                  />
                                </label>
                              </div>
                            )
                          )}
                        </div>
                      </div>

                      <div className="mt-5 flex flex-col gap-3 border-t dark:border-slate-800 light:border-gray-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs dark:text-slate-400 light:text-gray-600">
                          L’interrupteur principal Address reste dans Pattern signals.
                          Cette sauvegarde modifie uniquement V{draftConfig.version}.
                        </p>

                        <button
                          type="button"
                          onClick={
                            handleSaveAddress
                          }
                          disabled={
                            savingAddress
                          }
                          className="inline-flex justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {savingAddress
                            ? 'Enregistrement...'
                            : `Enregistrer Address V${draftConfig.version}`}
                        </button>
                      </div>
                    </>
                  )}
              </section>

              <section className="card p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="font-semibold">
                      Geographic Zone
                    </h2>

                    <p className="mt-1 text-sm dark:text-slate-400 light:text-gray-600">
                      Ajoutez des règles ciblées par gouvernorat,
                      délégation, ville ou code postal.
                    </p>
                  </div>

                  {draftConfig && (
                    <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-500">
                      Editing V{draftConfig.version} Draft
                    </span>
                  )}
                </div>

                {!latestDraft && (
                  <div className="mt-5 rounded-lg dark:bg-slate-800 light:bg-gray-50 p-4">
                    <p className="text-sm">
                      Créez d’abord un brouillon pour modifier Geographic Zone.
                    </p>
                  </div>
                )}

                {draftConfig &&
                  !draftLoading && (
                    <>
                      <div className="mt-5 flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium">
                            Direct geographic rules
                          </p>

                          <p className="mt-1 text-xs dark:text-slate-400 light:text-gray-600">
                            {geographicDraft.length} règle(s) configurée(s)
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setGeographicDraft(
                              previous => {
                                const existingKeys =
                                  new Set(
                                    previous.map(
                                      rule =>
                                        rule.key
                                    )
                                  )

                                let counter = 1

                                while (
                                  existingKeys.has(
                                    `geo_rule_${counter}`
                                  )
                                ) {
                                  counter += 1
                                }

                                return [
                                  ...previous,

                                  {
                                    key:
                                      `geo_rule_${counter}`,

                                    label:
                                      'Nouvelle règle',

                                    locationType:
                                      'governorate',

                                    locationValue:
                                      '',

                                    enabled:
                                      true,

                                    impact:
                                      '0',

                                    order:
                                      previous.length + 1
                                  }
                                ]
                              }
                            )
                          }
                          className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-500 transition hover:bg-blue-500/20"
                        >
                          + Ajouter une règle
                        </button>
                      </div>

                      {geographicDraft.length === 0 ? (
                        <div className="mt-4 rounded-lg border border-dashed dark:border-slate-700 light:border-gray-300 p-6 text-center">
                          <p className="text-sm font-medium">
                            Aucune règle géographique directe
                          </p>

                          <p className="mt-1 text-xs dark:text-slate-400 light:text-gray-600">
                            Le moteur conserve son comportement historique
                            tant qu’aucune règle directe n’est configurée.
                          </p>
                        </div>
                      ) : (
                        <div className="mt-4 space-y-4">
                          {geographicDraft.map(
                            (rule, index) => (
                              <div
                                key={
                                  rule._id ||
                                  rule.key
                                }
                                className="rounded-lg border dark:border-slate-800 light:border-gray-200 p-4"
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <div>
                                    <p className="text-sm font-semibold">
                                      Rule {index + 1}
                                    </p>

                                    <p className="mt-1 text-xs dark:text-slate-500 light:text-gray-500">
                                      {rule.key}
                                    </p>
                                  </div>

                                  <div className="flex items-center gap-3">
                                    <button
                                      type="button"
                                      role="switch"
                                      aria-checked={
                                        rule.enabled
                                      }
                                      onClick={() =>
                                        setGeographicDraft(
                                          previous =>
                                            previous.map(
                                              (item, itemIndex) =>
                                                itemIndex === index
                                                  ? {
                                                      ...item,

                                                      enabled:
                                                        !item.enabled
                                                    }
                                                  : item
                                            )
                                        )
                                      }
                                      className={`relative h-6 w-11 rounded-full transition ${
                                        rule.enabled
                                          ? 'bg-green-500'
                                          : 'bg-slate-400'
                                      }`}
                                    >
                                      <span
                                        className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                                          rule.enabled
                                            ? 'left-6'
                                            : 'left-1'
                                        }`}
                                      />
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        setGeographicDraft(
                                          previous =>
                                            previous
                                              .filter(
                                                (_, itemIndex) =>
                                                  itemIndex !== index
                                              )
                                              .map(
                                                (item, itemIndex) => ({
                                                  ...item,

                                                  order:
                                                    itemIndex + 1
                                                })
                                              )
                                        )
                                      }
                                      className="rounded-lg px-3 py-2 text-xs font-medium text-red-500 hover:bg-red-500/10"
                                    >
                                      Supprimer
                                    </button>
                                  </div>
                                </div>

                                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                                  <label className="block">
                                    <span className="text-xs dark:text-slate-400 light:text-gray-600">
                                      Type
                                    </span>

                                    <select
                                      value={
                                        rule.locationType
                                      }
                                      onChange={event =>
                                        setGeographicDraft(
                                          previous =>
                                            previous.map(
                                              (item, itemIndex) =>
                                                itemIndex === index
                                                  ? {
                                                      ...item,

                                                      locationType:
                                                        event.target.value as GeographicLocationType
                                                    }
                                                  : item
                                            )
                                        )
                                      }
                                      className="mt-1 block w-full rounded-lg border dark:border-slate-700 dark:bg-slate-900 light:border-gray-300 light:bg-white px-3 py-2"
                                    >
                                      <option value="governorate">
                                        Governorate
                                      </option>

                                      <option value="delegation">
                                        Delegation
                                      </option>

                                      <option value="city">
                                        City
                                      </option>

                                      <option value="postal_code">
                                        Postal Code
                                      </option>
                                    </select>
                                  </label>

                                  <label className="block">
                                    <span className="text-xs dark:text-slate-400 light:text-gray-600">
                                      Value
                                    </span>

                                    <input
                                      type="text"
                                      value={
                                        rule.locationValue
                                      }
                                      onChange={event =>
                                        setGeographicDraft(
                                          previous =>
                                            previous.map(
                                              (item, itemIndex) =>
                                                itemIndex === index
                                                  ? {
                                                      ...item,

                                                      locationValue:
                                                        event.target.value
                                                    }
                                                  : item
                                            )
                                        )
                                      }
                                      placeholder="Ex: Tunis"
                                      className="mt-1 block w-full rounded-lg border dark:border-slate-700 dark:bg-slate-900 light:border-gray-300 light:bg-white px-3 py-2"
                                    />
                                  </label>

                                  <label className="block">
                                    <span className="text-xs dark:text-slate-400 light:text-gray-600">
                                      Label
                                    </span>

                                    <input
                                      type="text"
                                      value={
                                        rule.label
                                      }
                                      onChange={event =>
                                        setGeographicDraft(
                                          previous =>
                                            previous.map(
                                              (item, itemIndex) =>
                                                itemIndex === index
                                                  ? {
                                                      ...item,

                                                      label:
                                                        event.target.value
                                                    }
                                                  : item
                                            )
                                        )
                                      }
                                      placeholder="Ex: Tunis"
                                      className="mt-1 block w-full rounded-lg border dark:border-slate-700 dark:bg-slate-900 light:border-gray-300 light:bg-white px-3 py-2"
                                    />
                                  </label>

                                  <label className="block">
                                    <span className="text-xs dark:text-slate-400 light:text-gray-600">
                                      Impact
                                    </span>

                                    <input
                                      type="number"
                                      value={
                                        rule.impact
                                      }
                                      onChange={event =>
                                        setGeographicDraft(
                                          previous =>
                                            previous.map(
                                              (item, itemIndex) =>
                                                itemIndex === index
                                                  ? {
                                                      ...item,

                                                      impact:
                                                        event.target.value
                                                    }
                                                  : item
                                            )
                                        )
                                      }
                                      className="mt-1 block w-full rounded-lg border dark:border-slate-700 dark:bg-slate-900 light:border-gray-300 light:bg-white px-3 py-2"
                                    />
                                  </label>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      )}

                      <div className="mt-5 flex flex-col gap-3 border-t dark:border-slate-800 light:border-gray-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs dark:text-slate-400 light:text-gray-600">
                          Les doublons actifs sur le même type et la même valeur sont bloqués.
                          La sauvegarde concerne uniquement V{draftConfig.version}.
                        </p>

                        <button
                          type="button"
                          onClick={
                            handleSaveGeographic
                          }
                          disabled={
                            savingGeographic
                          }
                          className="inline-flex justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {savingGeographic
                            ? 'Enregistrement...'
                            : `Enregistrer Geographic V${draftConfig.version}`}
                        </button>
                      </div>
                    </>
                  )}
              </section>

              <section className="card p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="font-semibold">
                      Order Value — Absolute
                    </h2>

                    <p className="mt-1 text-sm dark:text-slate-400 light:text-gray-600">
                      Configurez l’impact du montant total de la commande.
                    </p>
                  </div>

                  {draftConfig && (
                    <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-500">
                      Editing V{draftConfig.version} Draft
                    </span>
                  )}
                </div>

                {!latestDraft && (
                  <div className="mt-5 rounded-lg dark:bg-slate-800 light:bg-gray-50 p-4">
                    <p className="text-sm">
                      Créez d’abord un brouillon pour modifier Order Value.
                    </p>
                  </div>
                )}

                {draftConfig &&
                  absoluteValueDraft &&
                  !draftLoading && (
                    <>
                      <div className="mt-5 flex items-center justify-between gap-4 rounded-lg border dark:border-slate-800 light:border-gray-200 p-4">
                        <div>
                          <p className="text-sm font-medium">
                            Absolute Value signal
                          </p>

                          <p className="mt-1 text-xs dark:text-slate-400 light:text-gray-600">
                            Active ou désactive uniquement les tranches de montant absolu.
                          </p>
                        </div>

                        <button
                          type="button"
                          role="switch"
                          aria-checked={
                            absoluteValueDraft.enabled
                          }
                          onClick={() =>
                            setAbsoluteValueDraft(
                              previous =>
                                previous
                                  ? {
                                      ...previous,

                                      enabled:
                                        !previous.enabled
                                    }
                                  : previous
                            )
                          }
                          className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                            absoluteValueDraft.enabled
                              ? 'bg-green-500'
                              : 'bg-slate-400'
                          }`}
                        >
                          <span
                            className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                              absoluteValueDraft.enabled
                                ? 'left-6'
                                : 'left-1'
                            }`}
                          />
                        </button>
                      </div>

                      <div className="mt-4 space-y-3">
                        {absoluteValueDraft.rules.map(
                          (rule, index) => (
                            <div
                              key={
                                rule._id ||
                                rule.key
                              }
                              className="rounded-lg border dark:border-slate-800 light:border-gray-200 p-4"
                            >
                              <div className="flex items-center justify-between gap-4">
                                <div>
                                  <p className="text-sm font-semibold">
                                    {rule.label}
                                  </p>

                                  <p className="mt-1 text-xs dark:text-slate-500 light:text-gray-500">
                                    {rule.key}
                                  </p>
                                </div>

                                <button
                                  type="button"
                                  role="switch"
                                  aria-checked={
                                    rule.enabled
                                  }
                                  onClick={() =>
                                    setAbsoluteValueDraft(
                                      previous =>
                                        previous
                                          ? {
                                              ...previous,

                                              rules:
                                                previous.rules.map(
                                                  (item, itemIndex) =>
                                                    itemIndex === index
                                                      ? {
                                                          ...item,

                                                          enabled:
                                                            !item.enabled
                                                        }
                                                      : item
                                                )
                                            }
                                          : previous
                                    )
                                  }
                                  className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                                    rule.enabled
                                      ? 'bg-green-500'
                                      : 'bg-slate-400'
                                  }`}
                                >
                                  <span
                                    className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                                      rule.enabled
                                        ? 'left-6'
                                        : 'left-1'
                                    }`}
                                  />
                                </button>
                              </div>

                              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
                                <label>
                                  <span className="text-xs dark:text-slate-400 light:text-gray-600">
                                    Minimum
                                  </span>

                                  <input
                                    type="number"
                                    value={
                                      rule.min
                                    }
                                    placeholder="No min"
                                    onChange={event =>
                                      setAbsoluteValueDraft(
                                        previous =>
                                          previous
                                            ? {
                                                ...previous,

                                                rules:
                                                  previous.rules.map(
                                                    (item, itemIndex) =>
                                                      itemIndex === index
                                                        ? {
                                                            ...item,

                                                            min:
                                                              event.target.value
                                                          }
                                                        : item
                                                  )
                                              }
                                            : previous
                                      )
                                    }
                                    className="mt-1 block w-full rounded-lg border dark:border-slate-700 dark:bg-slate-900 light:border-gray-300 light:bg-white px-3 py-2"
                                  />
                                </label>

                                <label>
                                  <span className="text-xs dark:text-slate-400 light:text-gray-600">
                                    Maximum
                                  </span>

                                  <input
                                    type="number"
                                    value={
                                      rule.max
                                    }
                                    placeholder="No max"
                                    onChange={event =>
                                      setAbsoluteValueDraft(
                                        previous =>
                                          previous
                                            ? {
                                                ...previous,

                                                rules:
                                                  previous.rules.map(
                                                    (item, itemIndex) =>
                                                      itemIndex === index
                                                        ? {
                                                            ...item,

                                                            max:
                                                              event.target.value
                                                          }
                                                        : item
                                                  )
                                              }
                                            : previous
                                      )
                                    }
                                    className="mt-1 block w-full rounded-lg border dark:border-slate-700 dark:bg-slate-900 light:border-gray-300 light:bg-white px-3 py-2"
                                  />
                                </label>

                                <label>
                                  <span className="text-xs dark:text-slate-400 light:text-gray-600">
                                    Impact
                                  </span>

                                  <input
                                    type="number"
                                    value={
                                      rule.impact
                                    }
                                    onChange={event =>
                                      setAbsoluteValueDraft(
                                        previous =>
                                          previous
                                            ? {
                                                ...previous,

                                                rules:
                                                  previous.rules.map(
                                                    (item, itemIndex) =>
                                                      itemIndex === index
                                                        ? {
                                                            ...item,

                                                            impact:
                                                              event.target.value
                                                          }
                                                        : item
                                                  )
                                              }
                                            : previous
                                      )
                                    }
                                    className="mt-1 block w-full rounded-lg border dark:border-slate-700 dark:bg-slate-900 light:border-gray-300 light:bg-white px-3 py-2"
                                  />
                                </label>

                                <label className="flex items-center gap-2 self-end rounded-lg border dark:border-slate-700 light:border-gray-200 px-3 py-2.5">
                                  <input
                                    type="checkbox"
                                    checked={
                                      rule.includeMin
                                    }
                                    onChange={event =>
                                      setAbsoluteValueDraft(
                                        previous =>
                                          previous
                                            ? {
                                                ...previous,

                                                rules:
                                                  previous.rules.map(
                                                    (item, itemIndex) =>
                                                      itemIndex === index
                                                        ? {
                                                            ...item,

                                                            includeMin:
                                                              event.target.checked
                                                          }
                                                        : item
                                                  )
                                              }
                                            : previous
                                      )
                                    }
                                  />

                                  <span className="text-xs">
                                    Include min
                                  </span>
                                </label>

                                <label className="flex items-center gap-2 self-end rounded-lg border dark:border-slate-700 light:border-gray-200 px-3 py-2.5">
                                  <input
                                    type="checkbox"
                                    checked={
                                      rule.includeMax
                                    }
                                    onChange={event =>
                                      setAbsoluteValueDraft(
                                        previous =>
                                          previous
                                            ? {
                                                ...previous,

                                                rules:
                                                  previous.rules.map(
                                                    (item, itemIndex) =>
                                                      itemIndex === index
                                                        ? {
                                                            ...item,

                                                            includeMax:
                                                              event.target.checked
                                                          }
                                                        : item
                                                  )
                                              }
                                            : previous
                                      )
                                    }
                                  />

                                  <span className="text-xs">
                                    Include max
                                  </span>
                                </label>
                              </div>
                            </div>
                          )
                        )}
                      </div>

                      <div className="mt-5 flex flex-col gap-3 border-t dark:border-slate-800 light:border-gray-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs dark:text-slate-400 light:text-gray-600">
                          Les plages doivent rester cohérentes et sans chevauchement.
                          Le backend fera également sa validation avant sauvegarde.
                        </p>

                        <button
                          type="button"
                          onClick={
                            handleSaveAbsoluteValue
                          }
                          disabled={
                            savingAbsoluteValue
                          }
                          className="inline-flex justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {savingAbsoluteValue
                            ? 'Enregistrement...'
                            : `Enregistrer Order Value V${draftConfig.version}`}
                        </button>
                      </div>
                    </>
                  )}
              </section>

              <section className="card p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="font-semibold">
                      Order Value — Relative to History
                    </h2>

                    <p className="mt-1 text-sm dark:text-slate-400 light:text-gray-600">
                      Compare le montant actuel à la moyenne des commandes historiques du client.
                    </p>
                  </div>

                  {draftConfig && (
                    <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-500">
                      Editing V{draftConfig.version} Draft
                    </span>
                  )}
                </div>

                {!latestDraft && (
                  <div className="mt-5 rounded-lg dark:bg-slate-800 light:bg-gray-50 p-4">
                    <p className="text-sm">
                      Créez d’abord un brouillon pour modifier Order Value historique.
                    </p>
                  </div>
                )}

                {draftConfig &&
                  relativeValueDraft &&
                  !draftLoading && (
                    <>
                      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
                        <div className="flex items-center justify-between gap-4 rounded-lg border dark:border-slate-800 light:border-gray-200 p-4">
                          <div>
                            <p className="text-sm font-medium">
                              Relative to History signal
                            </p>

                            <p className="mt-1 text-xs dark:text-slate-400 light:text-gray-600">
                              Active ou désactive la comparaison avec l’historique.
                            </p>
                          </div>

                          <button
                            type="button"
                            role="switch"
                            aria-checked={
                              relativeValueDraft.enabled
                            }
                            onClick={() =>
                              setRelativeValueDraft(
                                previous =>
                                  previous
                                    ? {
                                        ...previous,

                                        enabled:
                                          !previous.enabled
                                      }
                                    : previous
                              )
                            }
                            className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                              relativeValueDraft.enabled
                                ? 'bg-green-500'
                                : 'bg-slate-400'
                            }`}
                          >
                            <span
                              className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                                relativeValueDraft.enabled
                                  ? 'left-6'
                                  : 'left-1'
                              }`}
                            />
                          </button>
                        </div>

                        <label className="rounded-lg border dark:border-slate-800 light:border-gray-200 p-4">
                          <span className="text-sm font-medium">
                            Minimum historical orders
                          </span>

                          <p className="mt-1 text-xs dark:text-slate-400 light:text-gray-600">
                            En dessous de ce nombre, le signal historique n’est pas appliqué.
                          </p>

                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={
                              relativeValueDraft
                                .minimumHistoricalOrders
                            }
                            onChange={event =>
                              setRelativeValueDraft(
                                previous =>
                                  previous
                                    ? {
                                        ...previous,

                                        minimumHistoricalOrders:
                                          event.target.value
                                      }
                                    : previous
                              )
                            }
                            className="mt-3 block w-full rounded-lg border dark:border-slate-700 dark:bg-slate-900 light:border-gray-300 light:bg-white px-3 py-2"
                          />
                        </label>
                      </div>

                      <div className="mt-4 space-y-3">
                        {relativeValueDraft.rules.map(
                          (rule, index) => (
                            <div
                              key={
                                rule._id ||
                                rule.key
                              }
                              className="rounded-lg border dark:border-slate-800 light:border-gray-200 p-4"
                            >
                              <div className="flex items-center justify-between gap-4">
                                <div>
                                  <p className="text-sm font-semibold">
                                    {rule.label}
                                  </p>

                                  <p className="mt-1 text-xs dark:text-slate-500 light:text-gray-500">
                                    {rule.key}
                                  </p>
                                </div>

                                <button
                                  type="button"
                                  role="switch"
                                  aria-checked={
                                    rule.enabled
                                  }
                                  onClick={() =>
                                    setRelativeValueDraft(
                                      previous =>
                                        previous
                                          ? {
                                              ...previous,

                                              rules:
                                                previous.rules.map(
                                                  (item, itemIndex) =>
                                                    itemIndex === index
                                                      ? {
                                                          ...item,

                                                          enabled:
                                                            !item.enabled
                                                        }
                                                      : item
                                                )
                                            }
                                          : previous
                                    )
                                  }
                                  className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                                    rule.enabled
                                      ? 'bg-green-500'
                                      : 'bg-slate-400'
                                  }`}
                                >
                                  <span
                                    className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                                      rule.enabled
                                        ? 'left-6'
                                        : 'left-1'
                                    }`}
                                  />
                                </button>
                              </div>

                              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
                                <label>
                                  <span className="text-xs dark:text-slate-400 light:text-gray-600">
                                    Minimum ratio
                                  </span>

                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={rule.min}
                                    placeholder="No min"
                                    onChange={event =>
                                      setRelativeValueDraft(
                                        previous =>
                                          previous
                                            ? {
                                                ...previous,

                                                rules:
                                                  previous.rules.map(
                                                    (item, itemIndex) =>
                                                      itemIndex === index
                                                        ? {
                                                            ...item,

                                                            min:
                                                              event.target.value
                                                          }
                                                        : item
                                                  )
                                              }
                                            : previous
                                      )
                                    }
                                    className="mt-1 block w-full rounded-lg border dark:border-slate-700 dark:bg-slate-900 light:border-gray-300 light:bg-white px-3 py-2"
                                  />
                                </label>

                                <label>
                                  <span className="text-xs dark:text-slate-400 light:text-gray-600">
                                    Maximum ratio
                                  </span>

                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={rule.max}
                                    placeholder="No max"
                                    onChange={event =>
                                      setRelativeValueDraft(
                                        previous =>
                                          previous
                                            ? {
                                                ...previous,

                                                rules:
                                                  previous.rules.map(
                                                    (item, itemIndex) =>
                                                      itemIndex === index
                                                        ? {
                                                            ...item,

                                                            max:
                                                              event.target.value
                                                          }
                                                        : item
                                                  )
                                              }
                                            : previous
                                      )
                                    }
                                    className="mt-1 block w-full rounded-lg border dark:border-slate-700 dark:bg-slate-900 light:border-gray-300 light:bg-white px-3 py-2"
                                  />
                                </label>

                                <label>
                                  <span className="text-xs dark:text-slate-400 light:text-gray-600">
                                    Impact
                                  </span>

                                  <input
                                    type="number"
                                    value={rule.impact}
                                    onChange={event =>
                                      setRelativeValueDraft(
                                        previous =>
                                          previous
                                            ? {
                                                ...previous,

                                                rules:
                                                  previous.rules.map(
                                                    (item, itemIndex) =>
                                                      itemIndex === index
                                                        ? {
                                                            ...item,

                                                            impact:
                                                              event.target.value
                                                          }
                                                        : item
                                                  )
                                              }
                                            : previous
                                      )
                                    }
                                    className="mt-1 block w-full rounded-lg border dark:border-slate-700 dark:bg-slate-900 light:border-gray-300 light:bg-white px-3 py-2"
                                  />
                                </label>

                                <label className="flex items-center gap-2 self-end rounded-lg border dark:border-slate-700 light:border-gray-200 px-3 py-2.5">
                                  <input
                                    type="checkbox"
                                    checked={
                                      rule.includeMin
                                    }
                                    onChange={event =>
                                      setRelativeValueDraft(
                                        previous =>
                                          previous
                                            ? {
                                                ...previous,

                                                rules:
                                                  previous.rules.map(
                                                    (item, itemIndex) =>
                                                      itemIndex === index
                                                        ? {
                                                            ...item,

                                                            includeMin:
                                                              event.target.checked
                                                          }
                                                        : item
                                                  )
                                              }
                                            : previous
                                      )
                                    }
                                  />

                                  <span className="text-xs">
                                    Include min
                                  </span>
                                </label>

                                <label className="flex items-center gap-2 self-end rounded-lg border dark:border-slate-700 light:border-gray-200 px-3 py-2.5">
                                  <input
                                    type="checkbox"
                                    checked={
                                      rule.includeMax
                                    }
                                    onChange={event =>
                                      setRelativeValueDraft(
                                        previous =>
                                          previous
                                            ? {
                                                ...previous,

                                                rules:
                                                  previous.rules.map(
                                                    (item, itemIndex) =>
                                                      itemIndex === index
                                                        ? {
                                                            ...item,

                                                            includeMax:
                                                              event.target.checked
                                                          }
                                                        : item
                                                  )
                                              }
                                            : previous
                                      )
                                    }
                                  />

                                  <span className="text-xs">
                                    Include max
                                  </span>
                                </label>
                              </div>

                              <p className="mt-3 text-xs dark:text-slate-500 light:text-gray-500">
                                Ratio 1.00 = montant égal à la moyenne historique.
                              </p>
                            </div>
                          )
                        )}
                      </div>

                      <div className="mt-5 flex flex-col gap-3 border-t dark:border-slate-800 light:border-gray-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs dark:text-slate-400 light:text-gray-600">
                          Les plages doivent rester cohérentes et sans chevauchement.
                          Le backend valide également les intervalles avant sauvegarde.
                        </p>

                        <button
                          type="button"
                          onClick={
                            handleSaveRelativeValue
                          }
                          disabled={
                            savingRelativeValue
                          }
                          className="inline-flex justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {savingRelativeValue
                            ? 'Enregistrement...'
                            : `Enregistrer History Value V${draftConfig.version}`}
                        </button>
                      </div>
                    </>
                  )}
              </section>

              <section className="card p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="font-semibold">
                      Order Time
                    </h2>

                    <p className="mt-1 text-sm dark:text-slate-400 light:text-gray-600">
                      Configurez l’impact appliqué selon l’heure de création de la commande.
                    </p>
                  </div>

                  {draftConfig && (
                    <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-500">
                      Editing V{draftConfig.version} Draft
                    </span>
                  )}
                </div>

                {!latestDraft && (
                  <div className="mt-5 rounded-lg dark:bg-slate-800 light:bg-gray-50 p-4">
                    <p className="text-sm">
                      Créez d’abord un brouillon pour modifier Order Time.
                    </p>
                  </div>
                )}

                {draftConfig &&
                  orderTimeDraft &&
                  !draftLoading && (
                    <>
                      <div className="mt-5 space-y-3">
                        {orderTimeDraft.rules.map(
                          (rule, index) => (
                            <div
                              key={
                                rule._id ||
                                rule.key
                              }
                              className="rounded-lg border dark:border-slate-800 light:border-gray-200 p-4"
                            >
                              <div className="flex items-center justify-between gap-4">
                                <div>
                                  <p className="text-sm font-semibold">
                                    {rule.label}
                                  </p>

                                  <p className="mt-1 text-xs dark:text-slate-500 light:text-gray-500">
                                    {rule.key}
                                  </p>
                                </div>

                                <button
                                  type="button"
                                  role="switch"
                                  aria-checked={
                                    rule.enabled
                                  }
                                  onClick={() =>
                                    setOrderTimeDraft(
                                      previous =>
                                        previous
                                          ? {
                                              ...previous,

                                              rules:
                                                previous.rules.map(
                                                  (item, itemIndex) =>
                                                    itemIndex === index
                                                      ? {
                                                          ...item,

                                                          enabled:
                                                            !item.enabled
                                                        }
                                                      : item
                                                )
                                            }
                                          : previous
                                    )
                                  }
                                  className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                                    rule.enabled
                                      ? 'bg-green-500'
                                      : 'bg-slate-400'
                                  }`}
                                >
                                  <span
                                    className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                                      rule.enabled
                                        ? 'left-6'
                                        : 'left-1'
                                    }`}
                                  />
                                </button>
                              </div>

                              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                                <label>
                                  <span className="text-xs dark:text-slate-400 light:text-gray-600">
                                    Start
                                  </span>

                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    value={
                                      rule.startTime
                                    }
                                    placeholder="08:00"
                                    onChange={event =>
                                      setOrderTimeDraft(
                                        previous =>
                                          previous
                                            ? {
                                                ...previous,

                                                rules:
                                                  previous.rules.map(
                                                    (item, itemIndex) =>
                                                      itemIndex === index
                                                        ? {
                                                            ...item,

                                                            startTime:
                                                              event.target.value
                                                          }
                                                        : item
                                                  )
                                              }
                                            : previous
                                      )
                                    }
                                    className="mt-1 block w-full rounded-lg border dark:border-slate-700 dark:bg-slate-900 light:border-gray-300 light:bg-white px-3 py-2"
                                  />
                                </label>

                                <label>
                                  <span className="text-xs dark:text-slate-400 light:text-gray-600">
                                    End
                                  </span>

                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    value={
                                      rule.endTime
                                    }
                                    placeholder="22:00"
                                    onChange={event =>
                                      setOrderTimeDraft(
                                        previous =>
                                          previous
                                            ? {
                                                ...previous,

                                                rules:
                                                  previous.rules.map(
                                                    (item, itemIndex) =>
                                                      itemIndex === index
                                                        ? {
                                                            ...item,

                                                            endTime:
                                                              event.target.value
                                                          }
                                                        : item
                                                  )
                                              }
                                            : previous
                                      )
                                    }
                                    className="mt-1 block w-full rounded-lg border dark:border-slate-700 dark:bg-slate-900 light:border-gray-300 light:bg-white px-3 py-2"
                                  />
                                </label>

                                <label>
                                  <span className="text-xs dark:text-slate-400 light:text-gray-600">
                                    Impact
                                  </span>

                                  <input
                                    type="number"
                                    value={
                                      rule.impact
                                    }
                                    onChange={event =>
                                      setOrderTimeDraft(
                                        previous =>
                                          previous
                                            ? {
                                                ...previous,

                                                rules:
                                                  previous.rules.map(
                                                    (item, itemIndex) =>
                                                      itemIndex === index
                                                        ? {
                                                            ...item,

                                                            impact:
                                                              event.target.value
                                                          }
                                                        : item
                                                  )
                                              }
                                            : previous
                                      )
                                    }
                                    className="mt-1 block w-full rounded-lg border dark:border-slate-700 dark:bg-slate-900 light:border-gray-300 light:bg-white px-3 py-2"
                                  />
                                </label>
                              </div>

                              <p className="mt-3 text-xs dark:text-slate-500 light:text-gray-500">
                                Format HH:MM. La dernière plage peut se terminer à 24:00.
                              </p>
                            </div>
                          )
                        )}
                      </div>

                      <div className="mt-5 flex flex-col gap-3 border-t dark:border-slate-800 light:border-gray-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs dark:text-slate-400 light:text-gray-600">
                          Les plages sont converties en minutes à la sauvegarde.
                          Le backend vérifie également les trous et chevauchements.
                        </p>

                        <button
                          type="button"
                          onClick={
                            handleSaveOrderTime
                          }
                          disabled={
                            savingOrderTime
                          }
                          className="inline-flex justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {savingOrderTime
                            ? 'Enregistrement...'
                            : `Enregistrer Order Time V${draftConfig.version}`}
                        </button>
                      </div>
                    </>
                  )}
              </section>

              <section className="card p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="font-semibold">
                      Order Time — Historical Signal
                    </h2>

                    <p className="mt-1 text-sm dark:text-slate-400 light:text-gray-600">
                      Applique un signal supplémentaire lorsqu’une plage horaire présente un taux d’échec anormalement élevé.
                    </p>
                  </div>

                  {draftConfig && (
                    <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-500">
                      Editing V{draftConfig.version} Draft
                    </span>
                  )}
                </div>

                {!latestDraft && (
                  <div className="mt-5 rounded-lg dark:bg-slate-800 light:bg-gray-50 p-4">
                    <p className="text-sm">
                      Créez d’abord un brouillon pour modifier Historical Time Signal.
                    </p>
                  </div>
                )}

                {draftConfig &&
                  historicalTimeDraft &&
                  !draftLoading && (
                    <>
                      <div className="mt-5 flex items-center justify-between gap-4 rounded-lg border dark:border-slate-800 light:border-gray-200 p-4">
                        <div>
                          <p className="text-sm font-medium">
                            Historical signal
                          </p>

                          <p className="mt-1 text-xs dark:text-slate-400 light:text-gray-600">
                            Active ou désactive uniquement l’analyse historique des plages horaires.
                          </p>
                        </div>

                        <button
                          type="button"
                          role="switch"
                          aria-checked={
                            historicalTimeDraft.enabled
                          }
                          onClick={() =>
                            setHistoricalTimeDraft(
                              previous =>
                                previous
                                  ? {
                                      ...previous,

                                      enabled:
                                        !previous.enabled
                                    }
                                  : previous
                            )
                          }
                          className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                            historicalTimeDraft.enabled
                              ? 'bg-green-500'
                              : 'bg-slate-400'
                          }`}
                        >
                          <span
                            className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                              historicalTimeDraft.enabled
                                ? 'left-6'
                                : 'left-1'
                            }`}
                          />
                        </button>
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <label className="block">
                          <span className="text-xs dark:text-slate-400 light:text-gray-600">
                            Minimum completed orders
                          </span>

                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={
                              historicalTimeDraft
                                .minimumCompletedOrders
                            }
                            onChange={event =>
                              setHistoricalTimeDraft(
                                previous =>
                                  previous
                                    ? {
                                        ...previous,

                                        minimumCompletedOrders:
                                          event.target.value
                                      }
                                    : previous
                              )
                            }
                            className="mt-1 block w-full rounded-lg border dark:border-slate-700 dark:bg-slate-900 light:border-gray-300 light:bg-white px-3 py-2"
                          />
                        </label>

                        <label className="block">
                          <span className="text-xs dark:text-slate-400 light:text-gray-600">
                            Minimum failure rate %
                          </span>

                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={
                              historicalTimeDraft
                                .minimumFailureRate
                            }
                            onChange={event =>
                              setHistoricalTimeDraft(
                                previous =>
                                  previous
                                    ? {
                                        ...previous,

                                        minimumFailureRate:
                                          event.target.value
                                      }
                                    : previous
                              )
                            }
                            className="mt-1 block w-full rounded-lg border dark:border-slate-700 dark:bg-slate-900 light:border-gray-300 light:bg-white px-3 py-2"
                          />
                        </label>

                        <label className="block">
                          <span className="text-xs dark:text-slate-400 light:text-gray-600">
                            Minimum excess failure %
                          </span>

                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={
                              historicalTimeDraft
                                .minimumExcessFailureRate
                            }
                            onChange={event =>
                              setHistoricalTimeDraft(
                                previous =>
                                  previous
                                    ? {
                                        ...previous,

                                        minimumExcessFailureRate:
                                          event.target.value
                                      }
                                    : previous
                              )
                            }
                            className="mt-1 block w-full rounded-lg border dark:border-slate-700 dark:bg-slate-900 light:border-gray-300 light:bg-white px-3 py-2"
                          />
                        </label>

                        <label className="block">
                          <span className="text-xs dark:text-slate-400 light:text-gray-600">
                            Impact
                          </span>

                          <input
                            type="number"
                            value={
                              historicalTimeDraft
                                .impact
                            }
                            onChange={event =>
                              setHistoricalTimeDraft(
                                previous =>
                                  previous
                                    ? {
                                        ...previous,

                                        impact:
                                          event.target.value
                                      }
                                    : previous
                              )
                            }
                            className="mt-1 block w-full rounded-lg border dark:border-slate-700 dark:bg-slate-900 light:border-gray-300 light:bg-white px-3 py-2"
                          />
                        </label>
                      </div>

                      <div className="mt-4 rounded-lg dark:bg-slate-800 light:bg-gray-50 p-4">
                        <p className="text-xs dark:text-slate-400 light:text-gray-600">
                          Exemple : avec 5 commandes terminées minimum, un taux d’échec de 30 % minimum et un excès de 15 % par rapport au comportement normal, le moteur peut appliquer l’impact configuré.
                        </p>
                      </div>

                      <div className="mt-5 flex flex-col gap-3 border-t dark:border-slate-800 light:border-gray-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs dark:text-slate-400 light:text-gray-600">
                          Les plages horaires fixes restent configurées séparément.
                          Cette sauvegarde modifie seulement le signal historique du Draft.
                        </p>

                        <button
                          type="button"
                          onClick={
                            handleSaveHistoricalTime
                          }
                          disabled={
                            savingHistoricalTime
                          }
                          className="inline-flex justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {savingHistoricalTime
                            ? 'Enregistrement...'
                            : `Enregistrer Historical Time V${draftConfig.version}`}
                        </button>
                      </div>
                    </>
                  )}
              </section>

              <section className="card p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="font-semibold">
                      Customer History — Successful Deliveries
                    </h2>

                    <p className="mt-1 text-sm dark:text-slate-400 light:text-gray-600">
                      Récompense l’historique positif du client selon son nombre de livraisons réussies.
                    </p>
                  </div>

                  {draftConfig && (
                    <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-500">
                      Editing V{draftConfig.version} Draft
                    </span>
                  )}
                </div>

                {!latestDraft && (
                  <div className="mt-5 rounded-lg dark:bg-slate-800 light:bg-gray-50 p-4">
                    <p className="text-sm">
                      Créez d’abord un brouillon pour modifier Customer History.
                    </p>
                  </div>
                )}

                {draftConfig &&
                  customerSuccessDraft &&
                  !draftLoading && (
                    <>
                      <div className="mt-5 flex items-center justify-between gap-4 rounded-lg border dark:border-slate-800 light:border-gray-200 p-4">
                        <div>
                          <p className="text-sm font-medium">
                            Successful Deliveries signal
                          </p>

                          <p className="mt-1 text-xs dark:text-slate-400 light:text-gray-600">
                            Active ou désactive seulement le bonus lié aux livraisons réussies.
                          </p>
                        </div>

                        <button
                          type="button"
                          role="switch"
                          aria-checked={
                            customerSuccessDraft.enabled
                          }
                          onClick={() =>
                            setCustomerSuccessDraft(
                              previous =>
                                previous
                                  ? {
                                      ...previous,

                                      enabled:
                                        !previous.enabled
                                    }
                                  : previous
                            )
                          }
                          className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                            customerSuccessDraft.enabled
                              ? 'bg-green-500'
                              : 'bg-slate-400'
                          }`}
                        >
                          <span
                            className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                              customerSuccessDraft.enabled
                                ? 'left-6'
                                : 'left-1'
                            }`}
                          />
                        </button>
                      </div>

                      <div className="mt-4 space-y-3">
                        {customerSuccessDraft.rules.map(
                          (rule, index) => (
                            <div
                              key={
                                rule._id ||
                                rule.key
                              }
                              className="rounded-lg border dark:border-slate-800 light:border-gray-200 p-4"
                            >
                              <div className="flex items-center justify-between gap-4">
                                <div>
                                  <p className="text-sm font-semibold">
                                    {rule.label}
                                  </p>

                                  <p className="mt-1 text-xs dark:text-slate-500 light:text-gray-500">
                                    {rule.key}
                                  </p>
                                </div>

                                <button
                                  type="button"
                                  role="switch"
                                  aria-checked={
                                    rule.enabled
                                  }
                                  onClick={() =>
                                    setCustomerSuccessDraft(
                                      previous =>
                                        previous
                                          ? {
                                              ...previous,

                                              rules:
                                                previous.rules.map(
                                                  (item, itemIndex) =>
                                                    itemIndex === index
                                                      ? {
                                                          ...item,

                                                          enabled:
                                                            !item.enabled
                                                        }
                                                      : item
                                                )
                                            }
                                          : previous
                                    )
                                  }
                                  className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                                    rule.enabled
                                      ? 'bg-green-500'
                                      : 'bg-slate-400'
                                  }`}
                                >
                                  <span
                                    className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                                      rule.enabled
                                        ? 'left-6'
                                        : 'left-1'
                                    }`}
                                  />
                                </button>
                              </div>

                              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                                <label>
                                  <span className="text-xs dark:text-slate-400 light:text-gray-600">
                                    Minimum deliveries
                                  </span>

                                  <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={rule.min}
                                    placeholder="No min"
                                    onChange={event =>
                                      setCustomerSuccessDraft(
                                        previous =>
                                          previous
                                            ? {
                                                ...previous,

                                                rules:
                                                  previous.rules.map(
                                                    (item, itemIndex) =>
                                                      itemIndex === index
                                                        ? {
                                                            ...item,

                                                            min:
                                                              event.target.value
                                                          }
                                                        : item
                                                  )
                                              }
                                            : previous
                                      )
                                    }
                                    className="mt-1 block w-full rounded-lg border dark:border-slate-700 dark:bg-slate-900 light:border-gray-300 light:bg-white px-3 py-2"
                                  />
                                </label>

                                <label>
                                  <span className="text-xs dark:text-slate-400 light:text-gray-600">
                                    Maximum deliveries
                                  </span>

                                  <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={rule.max}
                                    placeholder="No max"
                                    onChange={event =>
                                      setCustomerSuccessDraft(
                                        previous =>
                                          previous
                                            ? {
                                                ...previous,

                                                rules:
                                                  previous.rules.map(
                                                    (item, itemIndex) =>
                                                      itemIndex === index
                                                        ? {
                                                            ...item,

                                                            max:
                                                              event.target.value
                                                          }
                                                        : item
                                                  )
                                              }
                                            : previous
                                      )
                                    }
                                    className="mt-1 block w-full rounded-lg border dark:border-slate-700 dark:bg-slate-900 light:border-gray-300 light:bg-white px-3 py-2"
                                  />
                                </label>

                                <label>
                                  <span className="text-xs dark:text-slate-400 light:text-gray-600">
                                    Impact
                                  </span>

                                  <input
                                    type="number"
                                    value={rule.impact}
                                    onChange={event =>
                                      setCustomerSuccessDraft(
                                        previous =>
                                          previous
                                            ? {
                                                ...previous,

                                                rules:
                                                  previous.rules.map(
                                                    (item, itemIndex) =>
                                                      itemIndex === index
                                                        ? {
                                                            ...item,

                                                            impact:
                                                              event.target.value
                                                          }
                                                        : item
                                                  )
                                              }
                                            : previous
                                      )
                                    }
                                    className="mt-1 block w-full rounded-lg border dark:border-slate-700 dark:bg-slate-900 light:border-gray-300 light:bg-white px-3 py-2"
                                  />
                                </label>
                              </div>
                            </div>
                          )
                        )}
                      </div>

                      <div className="mt-5 flex flex-col gap-3 border-t dark:border-slate-800 light:border-gray-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs dark:text-slate-400 light:text-gray-600">
                          Les règles restent basées sur le nombre de commandes livrées du même client.
                          Le backend valide les plages avant sauvegarde.
                        </p>

                        <button
                          type="button"
                          onClick={
                            handleSaveCustomerSuccess
                          }
                          disabled={
                            savingCustomerSuccess
                          }
                          className="inline-flex justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {savingCustomerSuccess
                            ? 'Enregistrement...'
                            : `Enregistrer Success History V${draftConfig.version}`}
                        </button>
                      </div>
                    </>
                  )}
              </section>

              <section className="card p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="font-semibold">
                      Customer History — Failed Deliveries
                    </h2>

                    <p className="mt-1 text-sm dark:text-slate-400 light:text-gray-600">
                      Applique une pénalité selon le nombre de livraisons échouées du client.
                    </p>
                  </div>

                  {draftConfig && (
                    <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-500">
                      Editing V{draftConfig.version} Draft
                    </span>
                  )}
                </div>

                {!latestDraft && (
                  <div className="mt-5 rounded-lg dark:bg-slate-800 light:bg-gray-50 p-4">
                    <p className="text-sm">
                      Créez d’abord un brouillon pour modifier Customer History.
                    </p>
                  </div>
                )}

                {draftConfig &&
                  customerFailureDraft &&
                  !draftLoading && (
                    <>
                      <div className="mt-5 flex items-center justify-between gap-4 rounded-lg border dark:border-slate-800 light:border-gray-200 p-4">
                        <div>
                          <p className="text-sm font-medium">
                            Failed Deliveries signal
                          </p>

                          <p className="mt-1 text-xs dark:text-slate-400 light:text-gray-600">
                            Active ou désactive seulement la pénalité liée aux livraisons échouées.
                          </p>
                        </div>

                        <button
                          type="button"
                          role="switch"
                          aria-checked={
                            customerFailureDraft.enabled
                          }
                          onClick={() =>
                            setCustomerFailureDraft(
                              previous =>
                                previous
                                  ? {
                                      ...previous,

                                      enabled:
                                        !previous.enabled
                                    }
                                  : previous
                            )
                          }
                          className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                            customerFailureDraft.enabled
                              ? 'bg-green-500'
                              : 'bg-slate-400'
                          }`}
                        >
                          <span
                            className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                              customerFailureDraft.enabled
                                ? 'left-6'
                                : 'left-1'
                            }`}
                          />
                        </button>
                      </div>

                      <div className="mt-4 space-y-3">
                        {customerFailureDraft.rules.map(
                          (rule, index) => (
                            <div
                              key={
                                rule._id ||
                                rule.key
                              }
                              className="rounded-lg border dark:border-slate-800 light:border-gray-200 p-4"
                            >
                              <div className="flex items-center justify-between gap-4">
                                <div>
                                  <p className="text-sm font-semibold">
                                    {rule.label}
                                  </p>

                                  <p className="mt-1 text-xs dark:text-slate-500 light:text-gray-500">
                                    {rule.key}
                                  </p>
                                </div>

                                <button
                                  type="button"
                                  role="switch"
                                  aria-checked={
                                    rule.enabled
                                  }
                                  onClick={() =>
                                    setCustomerFailureDraft(
                                      previous =>
                                        previous
                                          ? {
                                              ...previous,

                                              rules:
                                                previous.rules.map(
                                                  (item, itemIndex) =>
                                                    itemIndex === index
                                                      ? {
                                                          ...item,

                                                          enabled:
                                                            !item.enabled
                                                        }
                                                      : item
                                                )
                                            }
                                          : previous
                                    )
                                  }
                                  className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                                    rule.enabled
                                      ? 'bg-green-500'
                                      : 'bg-slate-400'
                                  }`}
                                >
                                  <span
                                    className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                                      rule.enabled
                                        ? 'left-6'
                                        : 'left-1'
                                    }`}
                                  />
                                </button>
                              </div>

                              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                                <label>
                                  <span className="text-xs dark:text-slate-400 light:text-gray-600">
                                    Minimum failures
                                  </span>

                                  <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={rule.min}
                                    placeholder="No min"
                                    onChange={event =>
                                      setCustomerFailureDraft(
                                        previous =>
                                          previous
                                            ? {
                                                ...previous,

                                                rules:
                                                  previous.rules.map(
                                                    (item, itemIndex) =>
                                                      itemIndex === index
                                                        ? {
                                                            ...item,

                                                            min:
                                                              event.target.value
                                                          }
                                                        : item
                                                  )
                                              }
                                            : previous
                                      )
                                    }
                                    className="mt-1 block w-full rounded-lg border dark:border-slate-700 dark:bg-slate-900 light:border-gray-300 light:bg-white px-3 py-2"
                                  />
                                </label>

                                <label>
                                  <span className="text-xs dark:text-slate-400 light:text-gray-600">
                                    Maximum failures
                                  </span>

                                  <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={rule.max}
                                    placeholder="No max"
                                    onChange={event =>
                                      setCustomerFailureDraft(
                                        previous =>
                                          previous
                                            ? {
                                                ...previous,

                                                rules:
                                                  previous.rules.map(
                                                    (item, itemIndex) =>
                                                      itemIndex === index
                                                        ? {
                                                            ...item,

                                                            max:
                                                              event.target.value
                                                          }
                                                        : item
                                                  )
                                              }
                                            : previous
                                      )
                                    }
                                    className="mt-1 block w-full rounded-lg border dark:border-slate-700 dark:bg-slate-900 light:border-gray-300 light:bg-white px-3 py-2"
                                  />
                                </label>

                                <label>
                                  <span className="text-xs dark:text-slate-400 light:text-gray-600">
                                    Impact
                                  </span>

                                  <input
                                    type="number"
                                    value={rule.impact}
                                    onChange={event =>
                                      setCustomerFailureDraft(
                                        previous =>
                                          previous
                                            ? {
                                                ...previous,

                                                rules:
                                                  previous.rules.map(
                                                    (item, itemIndex) =>
                                                      itemIndex === index
                                                        ? {
                                                            ...item,

                                                            impact:
                                                              event.target.value
                                                          }
                                                        : item
                                                  )
                                              }
                                            : previous
                                      )
                                    }
                                    className="mt-1 block w-full rounded-lg border dark:border-slate-700 dark:bg-slate-900 light:border-gray-300 light:bg-white px-3 py-2"
                                  />
                                </label>
                              </div>
                            </div>
                          )
                        )}
                      </div>

                      <div className="mt-5 flex flex-col gap-3 border-t dark:border-slate-800 light:border-gray-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs dark:text-slate-400 light:text-gray-600">
                          Chaque commande historique est comptée une seule fois côté moteur.
                          Le backend valide les plages avant sauvegarde.
                        </p>

                        <button
                          type="button"
                          onClick={
                            handleSaveCustomerFailure
                          }
                          disabled={
                            savingCustomerFailure
                          }
                          className="inline-flex justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {savingCustomerFailure
                            ? 'Enregistrement...'
                            : `Enregistrer Failure History V${draftConfig.version}`}
                        </button>
                      </div>
                    </>
                  )}
              </section>

              <section className="card p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="font-semibold">
                      Operator Feedback — Categories
                    </h2>

                    <p className="mt-1 text-sm dark:text-slate-400 light:text-gray-600">
                      Organisez les questions de feedback opérateur par catégorie.
                    </p>
                  </div>

                  {draftConfig && (
                    <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-500">
                      Editing V{draftConfig.version} Draft
                    </span>
                  )}
                </div>

                {!latestDraft && (
                  <div className="mt-5 rounded-lg dark:bg-slate-800 light:bg-gray-50 p-4">
                    <p className="text-sm">
                      Créez d’abord un brouillon pour modifier Operator Feedback.
                    </p>
                  </div>
                )}

                {draftConfig &&
                  !draftLoading && (
                    <>
                      <div className="mt-5 flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium">
                            Feedback categories
                          </p>

                          <p className="mt-1 text-xs dark:text-slate-400 light:text-gray-600">
                            {feedbackCategoriesDraft.length} catégorie(s)
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setFeedbackCategoriesDraft(
                              previous => {
                                const existingKeys =
                                  new Set(
                                    previous.map(
                                      item =>
                                        item.key
                                    )
                                  )

                                let counter = 1

                                while (
                                  existingKeys.has(
                                    `feedback_category_${counter}`
                                  )
                                ) {
                                  counter += 1
                                }

                                return [
                                  ...previous,

                                  {
                                    key:
                                      `feedback_category_${counter}`,

                                    label:
                                      'Nouvelle catégorie',

                                    active:
                                      true,

                                    order:
                                      previous.length + 1
                                  }
                                ]
                              }
                            )
                          }
                          className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-500 transition hover:bg-blue-500/20"
                        >
                          + Ajouter une catégorie
                        </button>
                      </div>

                      {feedbackCategoriesDraft.length === 0 ? (
                        <div className="mt-4 rounded-lg border border-dashed dark:border-slate-700 light:border-gray-300 p-6 text-center">
                          <p className="text-sm">
                            Aucune catégorie configurée.
                          </p>
                        </div>
                      ) : (
                        <div className="mt-4 space-y-3">
                          {feedbackCategoriesDraft.map(
                            (category, index) => (
                              <div
                                key={
                                  category._id ||
                                  category.key
                                }
                                className="rounded-lg border dark:border-slate-800 light:border-gray-200 p-4"
                              >
                                <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.5fr_auto_auto] lg:items-end">
                                  <label>
                                    <span className="text-xs dark:text-slate-400 light:text-gray-600">
                                      Key
                                    </span>

                                    <input
                                      type="text"
                                      value={
                                        category.key
                                      }
                                      onChange={event =>
                                        setFeedbackCategoriesDraft(
                                          previous =>
                                            previous.map(
                                              (item, itemIndex) =>
                                                itemIndex === index
                                                  ? {
                                                      ...item,

                                                      key:
                                                        event.target.value
                                                    }
                                                  : item
                                            )
                                        )
                                      }
                                      className="mt-1 block w-full rounded-lg border dark:border-slate-700 dark:bg-slate-900 light:border-gray-300 light:bg-white px-3 py-2"
                                    />
                                  </label>

                                  <label>
                                    <span className="text-xs dark:text-slate-400 light:text-gray-600">
                                      Label
                                    </span>

                                    <input
                                      type="text"
                                      value={
                                        category.label
                                      }
                                      onChange={event =>
                                        setFeedbackCategoriesDraft(
                                          previous =>
                                            previous.map(
                                              (item, itemIndex) =>
                                                itemIndex === index
                                                  ? {
                                                      ...item,

                                                      label:
                                                        event.target.value
                                                    }
                                                  : item
                                            )
                                        )
                                      }
                                      className="mt-1 block w-full rounded-lg border dark:border-slate-700 dark:bg-slate-900 light:border-gray-300 light:bg-white px-3 py-2"
                                    />
                                  </label>

                                  <button
                                    type="button"
                                    role="switch"
                                    aria-checked={
                                      category.active
                                    }
                                    onClick={() =>
                                      setFeedbackCategoriesDraft(
                                        previous =>
                                          previous.map(
                                            (item, itemIndex) =>
                                              itemIndex === index
                                                ? {
                                                    ...item,

                                                    active:
                                                      !item.active
                                                  }
                                                : item
                                          )
                                      )
                                    }
                                    className={`relative mb-2 h-6 w-11 shrink-0 rounded-full transition ${
                                      category.active
                                        ? 'bg-green-500'
                                        : 'bg-slate-400'
                                    }`}
                                  >
                                    <span
                                      className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                                        category.active
                                          ? 'left-6'
                                          : 'left-1'
                                      }`}
                                    />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      setFeedbackCategoriesDraft(
                                        previous =>
                                          previous
                                            .filter(
                                              (_, itemIndex) =>
                                                itemIndex !== index
                                            )
                                            .map(
                                              (item, itemIndex) => ({
                                                ...item,

                                                order:
                                                  itemIndex + 1
                                              })
                                            )
                                      )
                                    }
                                    className="mb-1 rounded-lg px-3 py-2 text-xs font-medium text-red-500 hover:bg-red-500/10"
                                  >
                                    Supprimer
                                  </button>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      )}

                      <div className="mt-5 flex flex-col gap-3 border-t dark:border-slate-800 light:border-gray-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs dark:text-slate-400 light:text-gray-600">
                          Désactiver une catégorie la masque du questionnaire actif,
                          mais ne supprime pas l’historique déjà enregistré.
                        </p>

                        <button
                          type="button"
                          onClick={
                            handleSaveFeedbackCategories
                          }
                          disabled={
                            savingFeedbackCategories
                          }
                          className="inline-flex justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {savingFeedbackCategories
                            ? 'Enregistrement...'
                            : `Enregistrer Categories V${draftConfig.version}`}
                        </button>
                      </div>
                    </>
                  )}
              </section>

              <section className="card p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="font-semibold">
                      Operator Feedback — Questions
                    </h2>

                    <p className="mt-1 text-sm dark:text-slate-400 light:text-gray-600">
                      Configurez les questions affichées à l’opérateur après confirmation.
                    </p>
                  </div>

                  {draftConfig && (
                    <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-500">
                      Editing V{draftConfig.version} Draft
                    </span>
                  )}
                </div>

                {!latestDraft && (
                  <div className="mt-5 rounded-lg dark:bg-slate-800 light:bg-gray-50 p-4">
                    <p className="text-sm">
                      Créez d’abord un brouillon pour modifier les questions.
                    </p>
                  </div>
                )}

                {draftConfig &&
                  !draftLoading && (
                    <>
                      <div className="mt-5 flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium">
                            Questions
                          </p>

                          <p className="mt-1 text-xs dark:text-slate-400 light:text-gray-600">
                            {feedbackQuestionsDraft.length} question(s)
                          </p>
                        </div>

                        <button
                          type="button"
                          disabled={
                            !draftConfig
                              .operatorFeedback
                              ?.categories
                              ?.length
                          }
                          onClick={() => {
                            const categories =
                              draftConfig
                                .operatorFeedback
                                ?.categories || []

                            const firstCategory =
                              categories[0]

                            if (!firstCategory) {
                              setError(
                                'Ajoutez et enregistrez d’abord une catégorie.'
                              )
                              return
                            }

                            setFeedbackQuestionsDraft(
                              previous => {
                                const existingKeys =
                                  new Set(
                                    previous.map(
                                      item =>
                                        item.key
                                    )
                                  )

                                let counter = 1

                                while (
                                  existingKeys.has(
                                    `feedback_question_${counter}`
                                  )
                                ) {
                                  counter += 1
                                }

                                return [
                                  ...previous,

                                  {
                                    key:
                                      `feedback_question_${counter}`,

                                    categoryKey:
                                      firstCategory.key,

                                    title:
                                      'Nouvelle question',

                                    prompt:
                                      'Nouvelle question',

                                    type:
                                      'single_choice',

                                    active:
                                      true,

                                    required:
                                      false,

                                    maxSelections:
                                      '1',

                                    order:
                                      previous.length + 1,

                                    answers: [
                                      {
                                        key:
                                          `answer_${counter}_1`,

                                        label:
                                          'Nouvelle réponse',

                                        impact:
                                          0,

                                        active:
                                          true,

                                        order:
                                          1
                                      }
                                    ]
                                  }
                                ]
                              }
                            )
                          }}
                          className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-500 transition hover:bg-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          + Ajouter une question
                        </button>
                      </div>

                      {feedbackQuestionsDraft.length === 0 ? (
                        <div className="mt-4 rounded-lg border border-dashed dark:border-slate-700 light:border-gray-300 p-6 text-center">
                          <p className="text-sm">
                            Aucune question configurée.
                          </p>
                        </div>
                      ) : (
                        <div className="mt-4 space-y-4">
                          {feedbackQuestionsDraft.map(
                            (question, index) => (
                              <div
                                key={
                                  question._id ||
                                  question.key
                                }
                                className="rounded-lg border dark:border-slate-800 light:border-gray-200 p-4"
                              >
                                <div className="flex items-start justify-between gap-4">
                                  <div>
                                    <p className="text-sm font-semibold">
                                      Question {index + 1}
                                    </p>

                                    <p className="mt-1 text-xs dark:text-slate-500 light:text-gray-500">
                                      {question.answers.length} réponse(s) conservée(s)
                                    </p>
                                  </div>

                                  <div className="flex items-center gap-3">
                                    <button
                                      type="button"
                                      role="switch"
                                      aria-checked={
                                        question.active
                                      }
                                      onClick={() =>
                                        setFeedbackQuestionsDraft(
                                          previous =>
                                            previous.map(
                                              (item, itemIndex) =>
                                                itemIndex === index
                                                  ? {
                                                      ...item,

                                                      active:
                                                        !item.active
                                                    }
                                                  : item
                                            )
                                        )
                                      }
                                      className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                                        question.active
                                          ? 'bg-green-500'
                                          : 'bg-slate-400'
                                      }`}
                                    >
                                      <span
                                        className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                                          question.active
                                            ? 'left-6'
                                            : 'left-1'
                                        }`}
                                      />
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        setFeedbackQuestionsDraft(
                                          previous =>
                                            previous
                                              .filter(
                                                (_, itemIndex) =>
                                                  itemIndex !== index
                                              )
                                              .map(
                                                (item, itemIndex) => ({
                                                  ...item,

                                                  order:
                                                    itemIndex + 1
                                                })
                                              )
                                        )
                                      }
                                      className="rounded-lg px-3 py-2 text-xs font-medium text-red-500 hover:bg-red-500/10"
                                    >
                                      Supprimer
                                    </button>
                                  </div>
                                </div>

                                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                                  <label>
                                    <span className="text-xs dark:text-slate-400 light:text-gray-600">
                                      Key
                                    </span>

                                    <input
                                      type="text"
                                      value={question.key}
                                      onChange={event =>
                                        setFeedbackQuestionsDraft(
                                          previous =>
                                            previous.map(
                                              (item, itemIndex) =>
                                                itemIndex === index
                                                  ? {
                                                      ...item,

                                                      key:
                                                        event.target.value
                                                    }
                                                  : item
                                            )
                                        )
                                      }
                                      className="mt-1 block w-full rounded-lg border dark:border-slate-700 dark:bg-slate-900 light:border-gray-300 light:bg-white px-3 py-2"
                                    />
                                  </label>

                                  <label>
                                    <span className="text-xs dark:text-slate-400 light:text-gray-600">
                                      Category
                                    </span>

                                    <select
                                      value={
                                        question.categoryKey
                                      }
                                      onChange={event =>
                                        setFeedbackQuestionsDraft(
                                          previous =>
                                            previous.map(
                                              (item, itemIndex) =>
                                                itemIndex === index
                                                  ? {
                                                      ...item,

                                                      categoryKey:
                                                        event.target.value
                                                    }
                                                  : item
                                            )
                                        )
                                      }
                                      className="mt-1 block w-full rounded-lg border dark:border-slate-700 dark:bg-slate-900 light:border-gray-300 light:bg-white px-3 py-2"
                                    >
                                      {(draftConfig
                                        .operatorFeedback
                                        ?.categories || [])
                                        .map(category => (
                                          <option
                                            key={
                                              category.key
                                            }
                                            value={
                                              category.key
                                            }
                                          >
                                            {category.label}
                                          </option>
                                        ))}
                                    </select>
                                  </label>

                                  <label>
                                    <span className="text-xs dark:text-slate-400 light:text-gray-600">
                                      Title
                                    </span>

                                    <input
                                      type="text"
                                      value={
                                        question.title
                                      }
                                      onChange={event =>
                                        setFeedbackQuestionsDraft(
                                          previous =>
                                            previous.map(
                                              (item, itemIndex) =>
                                                itemIndex === index
                                                  ? {
                                                      ...item,

                                                      title:
                                                        event.target.value
                                                    }
                                                  : item
                                            )
                                        )
                                      }
                                      className="mt-1 block w-full rounded-lg border dark:border-slate-700 dark:bg-slate-900 light:border-gray-300 light:bg-white px-3 py-2"
                                    />
                                  </label>

                                  <label>
                                    <span className="text-xs dark:text-slate-400 light:text-gray-600">
                                      Type
                                    </span>

                                    <select
                                      value={
                                        question.type
                                      }
                                      onChange={event =>
                                        setFeedbackQuestionsDraft(
                                          previous =>
                                            previous.map(
                                              (item, itemIndex) =>
                                                itemIndex === index
                                                  ? {
                                                      ...item,

                                                      type:
                                                        event.target.value as
                                                          | 'single_choice'
                                                          | 'multiple_choice',

                                                      maxSelections:
                                                        event.target.value ===
                                                        'single_choice'
                                                          ? '1'
                                                          : item.maxSelections
                                                    }
                                                  : item
                                            )
                                        )
                                      }
                                      className="mt-1 block w-full rounded-lg border dark:border-slate-700 dark:bg-slate-900 light:border-gray-300 light:bg-white px-3 py-2"
                                    >
                                      <option value="single_choice">
                                        Single choice
                                      </option>

                                      <option value="multiple_choice">
                                        Multiple choice
                                      </option>
                                    </select>
                                  </label>

                                  <label className="md:col-span-2">
                                    <span className="text-xs dark:text-slate-400 light:text-gray-600">
                                      Prompt
                                    </span>

                                    <input
                                      type="text"
                                      value={
                                        question.prompt
                                      }
                                      onChange={event =>
                                        setFeedbackQuestionsDraft(
                                          previous =>
                                            previous.map(
                                              (item, itemIndex) =>
                                                itemIndex === index
                                                  ? {
                                                      ...item,

                                                      prompt:
                                                        event.target.value
                                                    }
                                                  : item
                                            )
                                        )
                                      }
                                      className="mt-1 block w-full rounded-lg border dark:border-slate-700 dark:bg-slate-900 light:border-gray-300 light:bg-white px-3 py-2"
                                    />
                                  </label>
                                </div>

                                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                                  <label className="flex items-center gap-3 rounded-lg border dark:border-slate-800 light:border-gray-200 p-3">
                                    <input
                                      type="checkbox"
                                      checked={
                                        question.required
                                      }
                                      onChange={event =>
                                        setFeedbackQuestionsDraft(
                                          previous =>
                                            previous.map(
                                              (item, itemIndex) =>
                                                itemIndex === index
                                                  ? {
                                                      ...item,

                                                      required:
                                                        event.target.checked
                                                    }
                                                  : item
                                            )
                                        )
                                      }
                                    />

                                    <span className="text-sm">
                                      Required
                                    </span>
                                  </label>

                                  <label>
                                    <span className="text-xs dark:text-slate-400 light:text-gray-600">
                                      Max selections
                                    </span>

                                    <input
                                      type="number"
                                      min="1"
                                      step="1"
                                      disabled={
                                        question.type ===
                                        'single_choice'
                                      }
                                      value={
                                        question.maxSelections
                                      }
                                      onChange={event =>
                                        setFeedbackQuestionsDraft(
                                          previous =>
                                            previous.map(
                                              (item, itemIndex) =>
                                                itemIndex === index
                                                  ? {
                                                      ...item,

                                                      maxSelections:
                                                        event.target.value
                                                    }
                                                  : item
                                            )
                                        )
                                      }
                                      className="mt-1 block w-full rounded-lg border dark:border-slate-700 dark:bg-slate-900 light:border-gray-300 light:bg-white px-3 py-2 disabled:opacity-50"
                                    />
                                  </label>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      )}

                      <div className="mt-5 flex flex-col gap-3 border-t dark:border-slate-800 light:border-gray-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs dark:text-slate-400 light:text-gray-600">
                          Les réponses et leurs impacts sont conservés pendant cette étape.
                          Ils seront éditables dans la section suivante.
                        </p>

                        <button
                          type="button"
                          onClick={
                            handleSaveFeedbackQuestions
                          }
                          disabled={
                            savingFeedbackQuestions
                          }
                          className="inline-flex justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {savingFeedbackQuestions
                            ? 'Enregistrement...'
                            : `Enregistrer Questions V${draftConfig.version}`}
                        </button>
                      </div>
                    </>
                  )}
              </section>

              <section className="card p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="font-semibold">
                      Operator Feedback — Answers & Impacts
                    </h2>

                    <p className="mt-1 text-sm dark:text-slate-400 light:text-gray-600">
                      Configurez les réponses disponibles pour chaque question et leur impact sur le score.
                    </p>
                  </div>

                  {draftConfig && (
                    <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-500">
                      Editing V{draftConfig.version} Draft
                    </span>
                  )}
                </div>

                {!latestDraft && (
                  <div className="mt-5 rounded-lg dark:bg-slate-800 light:bg-gray-50 p-4">
                    <p className="text-sm">
                      Créez d’abord un brouillon pour modifier les réponses.
                    </p>
                  </div>
                )}

                {draftConfig &&
                  !draftLoading && (
                    <>
                      {feedbackQuestionsDraft.length === 0 ? (
                        <div className="mt-5 rounded-lg border border-dashed dark:border-slate-700 light:border-gray-300 p-6 text-center">
                          <p className="text-sm">
                            Aucune question disponible.
                          </p>
                        </div>
                      ) : (
                        <div className="mt-5 space-y-5">
                          {feedbackQuestionsDraft.map(
                            (question, questionIndex) => (
                              <div
                                key={
                                  question._id ||
                                  question.key
                                }
                                className="rounded-xl border dark:border-slate-800 light:border-gray-200 p-4"
                              >
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                  <div>
                                    <p className="font-semibold">
                                      {question.title}
                                    </p>

                                    <p className="mt-1 text-xs dark:text-slate-400 light:text-gray-600">
                                      {question.type === 'multiple_choice'
                                        ? `Multiple choice · max ${question.maxSelections}`
                                        : 'Single choice'}
                                    </p>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      setFeedbackQuestionsDraft(
                                        previous =>
                                          previous.map(
                                            (item, itemIndex) => {
                                              if (
                                                itemIndex !==
                                                questionIndex
                                              ) {
                                                return item
                                              }

                                              const existingKeys =
                                                new Set(
                                                  item.answers.map(
                                                    answer =>
                                                      answer.key
                                                  )
                                                )

                                              let counter = 1

                                              let newKey =
                                                `answer_${questionIndex + 1}_${counter}`

                                              while (
                                                existingKeys.has(
                                                  newKey
                                                )
                                              ) {
                                                counter += 1

                                                newKey =
                                                  `answer_${questionIndex + 1}_${counter}`
                                              }

                                              return {
                                                ...item,

                                                answers: [
                                                  ...item.answers,

                                                  {
                                                    key:
                                                      newKey,

                                                    label:
                                                      'Nouvelle réponse',

                                                    impact:
                                                      0,

                                                    active:
                                                      true,

                                                    order:
                                                      item.answers.length + 1
                                                  }
                                                ]
                                              }
                                            }
                                          )
                                      )
                                    }
                                    className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-xs font-medium text-blue-500 transition hover:bg-blue-500/20"
                                  >
                                    + Ajouter une réponse
                                  </button>
                                </div>

                                <div className="mt-4 space-y-3">
                                  {question.answers.map(
                                    (answer, answerIndex) => (
                                      <div
                                        key={
                                          answer._id ||
                                          `${question.key}-${answer.key}-${answerIndex}`
                                        }
                                        className="rounded-lg dark:bg-slate-900/50 light:bg-gray-50 p-4"
                                      >
                                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.5fr_120px_auto_auto] lg:items-end">
                                          <label>
                                            <span className="text-xs dark:text-slate-400 light:text-gray-600">
                                              Key
                                            </span>

                                            <input
                                              type="text"
                                              value={
                                                answer.key
                                              }
                                              onChange={event =>
                                                setFeedbackQuestionsDraft(
                                                  previous =>
                                                    previous.map(
                                                      (item, itemIndex) =>
                                                        itemIndex === questionIndex
                                                          ? {
                                                              ...item,

                                                              answers:
                                                                item.answers.map(
                                                                  (
                                                                    currentAnswer,
                                                                    currentAnswerIndex
                                                                  ) =>
                                                                    currentAnswerIndex === answerIndex
                                                                      ? {
                                                                          ...currentAnswer,

                                                                          key:
                                                                            event.target.value
                                                                        }
                                                                      : currentAnswer
                                                                )
                                                            }
                                                          : item
                                                    )
                                                )
                                              }
                                              className="mt-1 block w-full rounded-lg border dark:border-slate-700 dark:bg-slate-900 light:border-gray-300 light:bg-white px-3 py-2"
                                            />
                                          </label>

                                          <label>
                                            <span className="text-xs dark:text-slate-400 light:text-gray-600">
                                              Label
                                            </span>

                                            <input
                                              type="text"
                                              value={
                                                answer.label
                                              }
                                              onChange={event =>
                                                setFeedbackQuestionsDraft(
                                                  previous =>
                                                    previous.map(
                                                      (item, itemIndex) =>
                                                        itemIndex === questionIndex
                                                          ? {
                                                              ...item,

                                                              answers:
                                                                item.answers.map(
                                                                  (
                                                                    currentAnswer,
                                                                    currentAnswerIndex
                                                                  ) =>
                                                                    currentAnswerIndex === answerIndex
                                                                      ? {
                                                                          ...currentAnswer,

                                                                          label:
                                                                            event.target.value
                                                                        }
                                                                      : currentAnswer
                                                                )
                                                            }
                                                          : item
                                                    )
                                                )
                                              }
                                              className="mt-1 block w-full rounded-lg border dark:border-slate-700 dark:bg-slate-900 light:border-gray-300 light:bg-white px-3 py-2"
                                            />
                                          </label>

                                          <label>
                                            <span className="text-xs dark:text-slate-400 light:text-gray-600">
                                              Impact
                                            </span>

                                            <input
                                              type="number"
                                              value={
                                                answer.impact ?? ''
                                              }
                                              onChange={event =>
                                                setFeedbackQuestionsDraft(
                                                  previous =>
                                                    previous.map(
                                                      (item, itemIndex) =>
                                                        itemIndex === questionIndex
                                                          ? {
                                                              ...item,

                                                              answers:
                                                                item.answers.map(
                                                                  (
                                                                    currentAnswer,
                                                                    currentAnswerIndex
                                                                  ) =>
                                                                    currentAnswerIndex === answerIndex
                                                                      ? {
                                                                          ...currentAnswer,

                                                                          impact:
                                                                            event.target.value === ''
                                                                              ? undefined
                                                                              : Number(
                                                                                  event.target.value
                                                                                )
                                                                        }
                                                                      : currentAnswer
                                                                )
                                                            }
                                                          : item
                                                    )
                                                )
                                              }
                                              className="mt-1 block w-full rounded-lg border dark:border-slate-700 dark:bg-slate-900 light:border-gray-300 light:bg-white px-3 py-2"
                                            />
                                          </label>

                                          <button
                                            type="button"
                                            role="switch"
                                            aria-checked={
                                              answer.active !== false
                                            }
                                            onClick={() =>
                                              setFeedbackQuestionsDraft(
                                                previous =>
                                                  previous.map(
                                                    (item, itemIndex) =>
                                                      itemIndex === questionIndex
                                                        ? {
                                                            ...item,

                                                            answers:
                                                              item.answers.map(
                                                                (
                                                                  currentAnswer,
                                                                  currentAnswerIndex
                                                                ) =>
                                                                  currentAnswerIndex === answerIndex
                                                                    ? {
                                                                        ...currentAnswer,

                                                                        active:
                                                                          currentAnswer.active === false
                                                                      }
                                                                    : currentAnswer
                                                              )
                                                          }
                                                        : item
                                                  )
                                              )
                                            }
                                            className={`relative mb-2 h-6 w-11 shrink-0 rounded-full transition ${
                                              answer.active !== false
                                                ? 'bg-green-500'
                                                : 'bg-slate-400'
                                            }`}
                                          >
                                            <span
                                              className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                                                answer.active !== false
                                                  ? 'left-6'
                                                  : 'left-1'
                                              }`}
                                            />
                                          </button>

                                          <button
                                            type="button"
                                            disabled={
                                              question.answers.length <= 1
                                            }
                                            onClick={() =>
                                              setFeedbackQuestionsDraft(
                                                previous =>
                                                  previous.map(
                                                    (item, itemIndex) =>
                                                      itemIndex === questionIndex
                                                        ? {
                                                            ...item,

                                                            answers:
                                                              item.answers
                                                                .filter(
                                                                  (_, currentAnswerIndex) =>
                                                                    currentAnswerIndex !== answerIndex
                                                                )
                                                                .map(
                                                                  (
                                                                    currentAnswer,
                                                                    currentAnswerIndex
                                                                  ) => ({
                                                                    ...currentAnswer,

                                                                    order:
                                                                      currentAnswerIndex + 1
                                                                  })
                                                                )
                                                          }
                                                        : item
                                                  )
                                              )
                                            }
                                            className="mb-1 rounded-lg px-3 py-2 text-xs font-medium text-red-500 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-40"
                                          >
                                            Supprimer
                                          </button>
                                        </div>
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      )}

                      <div className="mt-5 flex flex-col gap-3 border-t dark:border-slate-800 light:border-gray-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs dark:text-slate-400 light:text-gray-600">
                          Une question active doit conserver au moins une réponse active.
                          Pour les questions multiples, Max selections ne peut pas dépasser le nombre de réponses actives.
                        </p>

                        <button
                          type="button"
                          onClick={
                            handleSaveFeedbackAnswers
                          }
                          disabled={
                            savingFeedbackAnswers
                          }
                          className="inline-flex justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {savingFeedbackAnswers
                            ? 'Enregistrement...'
                            : `Enregistrer Answers V${draftConfig.version}`}
                        </button>
                      </div>
                    </>
                  )}
              </section>

              <section className="card p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="font-semibold">
                      AI Modules
                    </h2>

                    <p className="mt-1 text-sm dark:text-slate-400 light:text-gray-600">
                      Activez ou désactivez les modules historiques et feedback sans supprimer leur configuration.
                    </p>
                  </div>

                  {draftConfig && (
                    <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-500">
                      Editing V{draftConfig.version} Draft
                    </span>
                  )}
                </div>

                {!latestDraft && (
                  <div className="mt-5 rounded-lg dark:bg-slate-800 light:bg-gray-50 p-4">
                    <p className="text-sm">
                      Créez d’abord un brouillon pour modifier les modules AI.
                    </p>
                  </div>
                )}

                {draftConfig &&
                  moduleDraft &&
                  !draftLoading && (
                    <>
                      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="flex items-center justify-between gap-4 rounded-lg border dark:border-slate-800 light:border-gray-200 p-4">
                          <div>
                            <p className="text-sm font-medium">
                              Customer History
                            </p>

                            <p className="mt-1 text-xs dark:text-slate-400 light:text-gray-600">
                              Successful + failed delivery history.
                            </p>
                          </div>

                          <button
                            type="button"
                            role="switch"
                            aria-checked={
                              moduleDraft.customerHistory
                            }
                            onClick={() =>
                              setModuleDraft(
                                previous =>
                                  previous
                                    ? {
                                        ...previous,

                                        customerHistory:
                                          !previous.customerHistory
                                      }
                                    : previous
                              )
                            }
                            className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                              moduleDraft.customerHistory
                                ? 'bg-green-500'
                                : 'bg-slate-400'
                            }`}
                          >
                            <span
                              className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                                moduleDraft.customerHistory
                                  ? 'left-6'
                                  : 'left-1'
                              }`}
                            />
                          </button>
                        </div>

                        <div className="flex items-center justify-between gap-4 rounded-lg border dark:border-slate-800 light:border-gray-200 p-4">
                          <div>
                            <p className="text-sm font-medium">
                              Operator Feedback
                            </p>

                            <p className="mt-1 text-xs dark:text-slate-400 light:text-gray-600">
                              Questions, answers and operator signals.
                            </p>
                          </div>

                          <button
                            type="button"
                            role="switch"
                            aria-checked={
                              moduleDraft.operatorFeedback
                            }
                            onClick={() =>
                              setModuleDraft(
                                previous =>
                                  previous
                                    ? {
                                        ...previous,

                                        operatorFeedback:
                                          !previous.operatorFeedback
                                      }
                                    : previous
                              )
                            }
                            className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                              moduleDraft.operatorFeedback
                                ? 'bg-green-500'
                                : 'bg-slate-400'
                            }`}
                          >
                            <span
                              className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                                moduleDraft.operatorFeedback
                                  ? 'left-6'
                                  : 'left-1'
                              }`}
                            />
                          </button>
                        </div>
                      </div>

                      <div className="mt-5 flex flex-col gap-3 border-t dark:border-slate-800 light:border-gray-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs dark:text-slate-400 light:text-gray-600">
                          Désactiver un module ne supprime aucune règle.
                          Il pourra être réactivé plus tard avec la même configuration.
                        </p>

                        <button
                          type="button"
                          onClick={
                            handleSaveModules
                          }
                          disabled={
                            savingModules
                          }
                          className="inline-flex justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {savingModules
                            ? 'Enregistrement...'
                            : `Enregistrer Modules V${draftConfig.version}`}
                        </button>
                      </div>
                    </>
                  )}
              </section>

              <section className="card p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="font-semibold">
                      AI Scoring Simulator
                    </h2>

                    <p className="mt-1 text-sm dark:text-slate-400 light:text-gray-600">
                      Testez une commande fictive avec le vrai moteur de scoring,
                      sans créer ni modifier de commande.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-500">
                      {draftConfig
                        ? `Testing V${draftConfig.version} Draft`
                        : `Testing V${config?.version ?? '?'} Active`}
                    </span>

                    <span className="rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-medium text-green-500">
                      Read only
                    </span>
                  </div>
                </div>

                <div className="mt-5 rounded-lg border dark:border-slate-800 light:border-gray-200 p-4">
                  <p className="text-sm font-medium">
                    Commande de test
                  </p>

                  <p className="mt-1 text-xs dark:text-slate-400 light:text-gray-600">
                    Le Shop ID est optionnel. Sans Shop ID, les signaux historiques
                    client, montant, zone et heure utilisent un contexte vide.
                  </p>

                  <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <label>
                      <span className="text-xs dark:text-slate-400 light:text-gray-600">
                        Shop ID — optionnel
                      </span>

                      <input
                        type="text"
                        value={
                          simulatorForm.shopId
                        }
                        onChange={event =>
                          setSimulatorForm(
                            previous => ({
                              ...previous,
                              shopId:
                                event.target.value
                            })
                          )
                        }
                        placeholder="MongoDB ObjectId"
                        className="mt-1 block w-full rounded-lg border dark:border-slate-700 dark:bg-slate-900 light:border-gray-300 light:bg-white px-3 py-2"
                      />
                    </label>

                    <label>
                      <span className="text-xs dark:text-slate-400 light:text-gray-600">
                        Téléphone
                      </span>

                      <input
                        type="text"
                        value={
                          simulatorForm.phone
                        }
                        onChange={event =>
                          setSimulatorForm(
                            previous => ({
                              ...previous,
                              phone:
                                event.target.value
                            })
                          )
                        }
                        placeholder="22123456"
                        className="mt-1 block w-full rounded-lg border dark:border-slate-700 dark:bg-slate-900 light:border-gray-300 light:bg-white px-3 py-2"
                      />
                    </label>

                    <label>
                      <span className="text-xs dark:text-slate-400 light:text-gray-600">
                        Montant
                      </span>

                      <input
                        type="number"
                        min="0"
                        step="0.001"
                        value={
                          simulatorForm.totalAmount
                        }
                        onChange={event =>
                          setSimulatorForm(
                            previous => ({
                              ...previous,
                              totalAmount:
                                event.target.value
                            })
                          )
                        }
                        className="mt-1 block w-full rounded-lg border dark:border-slate-700 dark:bg-slate-900 light:border-gray-300 light:bg-white px-3 py-2"
                      />
                    </label>

                    <label>
                      <span className="text-xs dark:text-slate-400 light:text-gray-600">
                        Rue
                      </span>

                      <input
                        type="text"
                        value={
                          simulatorForm.street
                        }
                        onChange={event =>
                          setSimulatorForm(
                            previous => ({
                              ...previous,
                              street:
                                event.target.value
                            })
                          )
                        }
                        placeholder="10 Rue..."
                        className="mt-1 block w-full rounded-lg border dark:border-slate-700 dark:bg-slate-900 light:border-gray-300 light:bg-white px-3 py-2"
                      />
                    </label>

                    <label>
                      <span className="text-xs dark:text-slate-400 light:text-gray-600">
                        Ville
                      </span>

                      <input
                        type="text"
                        value={
                          simulatorForm.city
                        }
                        onChange={event =>
                          setSimulatorForm(
                            previous => ({
                              ...previous,
                              city:
                                event.target.value
                            })
                          )
                        }
                        placeholder="Sousse"
                        className="mt-1 block w-full rounded-lg border dark:border-slate-700 dark:bg-slate-900 light:border-gray-300 light:bg-white px-3 py-2"
                      />
                    </label>

                    <label>
                      <span className="text-xs dark:text-slate-400 light:text-gray-600">
                        Gouvernorat
                      </span>

                      <input
                        type="text"
                        value={
                          simulatorForm.state
                        }
                        onChange={event =>
                          setSimulatorForm(
                            previous => ({
                              ...previous,
                              state:
                                event.target.value
                            })
                          )
                        }
                        placeholder="Sousse"
                        className="mt-1 block w-full rounded-lg border dark:border-slate-700 dark:bg-slate-900 light:border-gray-300 light:bg-white px-3 py-2"
                      />
                    </label>

                    <label>
                      <span className="text-xs dark:text-slate-400 light:text-gray-600">
                        Code postal
                      </span>

                      <input
                        type="text"
                        value={
                          simulatorForm.zipCode
                        }
                        onChange={event =>
                          setSimulatorForm(
                            previous => ({
                              ...previous,
                              zipCode:
                                event.target.value
                            })
                          )
                        }
                        placeholder="4000"
                        className="mt-1 block w-full rounded-lg border dark:border-slate-700 dark:bg-slate-900 light:border-gray-300 light:bg-white px-3 py-2"
                      />
                    </label>

                    <label>
                      <span className="text-xs dark:text-slate-400 light:text-gray-600">
                        Région
                      </span>

                      <input
                        type="text"
                        value={
                          simulatorForm.region
                        }
                        onChange={event =>
                          setSimulatorForm(
                            previous => ({
                              ...previous,
                              region:
                                event.target.value
                            })
                          )
                        }
                        placeholder="Sousse"
                        className="mt-1 block w-full rounded-lg border dark:border-slate-700 dark:bg-slate-900 light:border-gray-300 light:bg-white px-3 py-2"
                      />
                    </label>

                    <label>
                      <span className="text-xs dark:text-slate-400 light:text-gray-600">
                        Date / heure
                      </span>

                      <input
                        type="datetime-local"
                        value={
                          simulatorForm.createdAt
                        }
                        onChange={event =>
                          setSimulatorForm(
                            previous => ({
                              ...previous,
                              createdAt:
                                event.target.value
                            })
                          )
                        }
                        className="mt-1 block w-full rounded-lg border dark:border-slate-700 dark:bg-slate-900 light:border-gray-300 light:bg-white px-3 py-2"
                      />
                    </label>
                  </div>

                  <div className="mt-5 flex flex-col gap-3 border-t dark:border-slate-800 light:border-gray-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs dark:text-slate-400 light:text-gray-600">
                      Aucune donnée de cette commande fictive n’est sauvegardée.
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        void handleRunSimulator()
                      }
                      disabled={
                        simulating
                      }
                      className="inline-flex justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {simulating
                        ? 'Simulation...'
                        : 'Lancer la simulation'}
                    </button>
                  </div>
                </div>

                {simulatorResult && (
                  <div className="mt-5 space-y-5">
                    <div className="flex flex-col gap-2 rounded-lg border border-green-500/20 bg-green-500/5 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold">
                          Résultat V{simulatorResult.version}
                        </p>

                        <p className="mt-1 text-xs dark:text-slate-400 light:text-gray-600">
                          Configuration {simulatorResult.status}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-500">
                          Risk: {simulatorResult.simulation.riskLevel}
                        </span>

                        <span className="rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-medium text-green-500">
                          Decision: {simulatorResult.simulation.decision}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
                      <div className="rounded-lg border dark:border-slate-800 light:border-gray-200 p-4">
                        <p className="text-xs dark:text-slate-400 light:text-gray-600">
                          Base
                        </p>

                        <p className="mt-2 text-2xl font-semibold">
                          {simulatorResult.simulation.baseScore}
                        </p>
                      </div>

                      <div className="rounded-lg border dark:border-slate-800 light:border-gray-200 p-4">
                        <p className="text-xs dark:text-slate-400 light:text-gray-600">
                          Calculated
                        </p>

                        <p className="mt-2 text-2xl font-semibold">
                          {simulatorResult.simulation.calculatedScore}
                        </p>
                      </div>

                      <div className="rounded-lg border dark:border-slate-800 light:border-gray-200 p-4">
                        <p className="text-xs dark:text-slate-400 light:text-gray-600">
                          Minimum
                        </p>

                        <p className="mt-2 text-2xl font-semibold">
                          {simulatorResult.simulation.minimumScore}
                        </p>
                      </div>

                      <div className="rounded-lg border dark:border-slate-800 light:border-gray-200 p-4">
                        <p className="text-xs dark:text-slate-400 light:text-gray-600">
                          Maximum
                        </p>

                        <p className="mt-2 text-2xl font-semibold">
                          {simulatorResult.simulation.maximumScore}
                        </p>
                      </div>

                      <div className="col-span-2 rounded-lg border border-green-500/30 bg-green-500/10 p-4 lg:col-span-1">
                        <p className="text-xs text-green-500">
                          Final Score
                        </p>

                        <p className="mt-2 text-3xl font-bold text-green-500">
                          {simulatorResult.simulation.finalScore}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-lg border dark:border-slate-800 light:border-gray-200 p-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold">
                            Scoring factors
                          </p>

                          <p className="mt-1 text-xs dark:text-slate-400 light:text-gray-600">
                            Signaux réellement évalués par le moteur.
                          </p>
                        </div>

                        <div className="flex gap-3 text-xs">
                          <span className="text-green-500">
                            +{
                              simulatorResult
                                .simulation
                                .factors
                                .filter(
                                  factor =>
                                    factor.impact > 0
                                )
                                .reduce(
                                  (
                                    total,
                                    factor
                                  ) =>
                                    total +
                                    factor.impact,
                                  0
                                )
                            }
                          </span>

                          <span className="text-red-500">
                            {
                              simulatorResult
                                .simulation
                                .factors
                                .filter(
                                  factor =>
                                    factor.impact < 0
                                )
                                .reduce(
                                  (
                                    total,
                                    factor
                                  ) =>
                                    total +
                                    factor.impact,
                                  0
                                )
                            }
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 space-y-2">
                        {simulatorResult
                          .simulation
                          .factors
                          .map(
                            factor => (
                              <div
                                key={
                                  factor.key
                                }
                                className="flex flex-col gap-2 rounded-lg dark:bg-slate-900/50 light:bg-gray-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                              >
                                <div>
                                  <p className="text-sm font-medium">
                                    {factor.label}
                                  </p>

                                  <p className="mt-1 text-xs dark:text-slate-400 light:text-gray-600">
                                    {String(
                                      factor.value ??
                                        '—'
                                    )}
                                  </p>
                                </div>

                                <div className="flex items-center gap-3">
                                  <span
                                    className={`text-xs ${
                                      factor.applied
                                        ? 'text-green-500'
                                        : 'dark:text-slate-500 light:text-gray-400'
                                    }`}
                                  >
                                    {factor.applied
                                      ? 'Applied'
                                      : 'Not applied'}
                                  </span>

                                  <span
                                    className={`min-w-[52px] text-right text-sm font-semibold ${
                                      factor.impact > 0
                                        ? 'text-green-500'
                                        : factor.impact < 0
                                          ? 'text-red-500'
                                          : 'dark:text-slate-400 light:text-gray-500'
                                    }`}
                                  >
                                    {factor.impact > 0
                                      ? `+${factor.impact}`
                                      : factor.impact}
                                  </span>
                                </div>
                              </div>
                            )
                          )}
                      </div>
                    </div>

                    <div className="rounded-lg dark:bg-slate-900/50 light:bg-gray-50 p-4">
                      <p className="text-sm font-medium">
                        Formule appliquée
                      </p>

                      <p className="mt-2 text-sm dark:text-slate-300 light:text-gray-700">
                        {simulatorResult.simulation.baseScore}
                        {' + signaux = '}
                        {simulatorResult.simulation.calculatedScore}
                        {' → clamp '}
                        {simulatorResult.simulation.minimumScore}
                        {' / '}
                        {simulatorResult.simulation.maximumScore}
                        {' → '}
                        <strong>
                          {simulatorResult.simulation.finalScore}
                        </strong>
                      </p>
                    </div>
                  </div>
                )}
              </section>

              <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="card p-5">
                  <p className="text-sm dark:text-slate-400 light:text-gray-600">
                    Base Score
                  </p>

                  <p className="mt-2 text-3xl font-semibold">
                    {config.general.baseScore}
                  </p>
                </div>

                <div className="card p-5">
                  <p className="text-sm dark:text-slate-400 light:text-gray-600">
                    Minimum Score
                  </p>

                  <p className="mt-2 text-3xl font-semibold">
                    {config.general.minimumScore}
                  </p>
                </div>

                <div className="card p-5">
                  <p className="text-sm dark:text-slate-400 light:text-gray-600">
                    Maximum Score
                  </p>

                  <p className="mt-2 text-3xl font-semibold">
                    {config.general.maximumScore}
                  </p>
                </div>
              </section>

              <section>
                <div className="mb-4">
                  <h2 className="text-lg font-semibold">
                    Scoring configuration
                  </h2>

                  <p className="mt-1 text-sm dark:text-slate-400 light:text-gray-600">
                    Vue générale de la configuration actuellement active.
                  </p>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  <SummaryCard
                    title="Address Scoring"
                    description="Analyse de la qualité et de la complétude de l’adresse."
                    enabled={
                      config.patterns?.enabled !== false &&
                      config.patterns?.address?.enabled !== false
                    }
                    detail="Street, City, Governorate & Postal Code"
                    icon={MapPinIcon}
                  />

                  <SummaryCard
                    title="Geographic Zone"
                    description="Règles géographiques configurables par zone."
                    enabled={
                      config.patterns?.enabled !== false &&
                      config.patterns?.geographicZone?.enabled !== false
                    }
                    detail={`${config.patterns?.geographicZone?.rules?.length ?? 0} règle(s) directe(s)`}
                    icon={AdjustmentsHorizontalIcon}
                  />

                  <SummaryCard
                    title="Order Patterns"
                    description="Valeur de commande et heure de création."
                    enabled={
                      config.patterns?.enabled !== false &&
                      (
                        config.patterns?.orderValue?.enabled !== false ||
                        config.patterns?.orderTime?.enabled !== false
                      )
                    }
                    detail="Order Value + Order Time"
                    icon={ClockIcon}
                  />

                  <SummaryCard
                    title="Customer History"
                    description="Historique des livraisons réussies et échouées."
                    enabled={
                      config.customerHistory?.enabled !== false
                    }
                    detail="Success + Failed Delivery history"
                    icon={UserGroupIcon}
                  />

                  <SummaryCard
                    title="Operator Feedback"
                    description="Questions dynamiques renseignées après l’appel opérateur."
                    enabled={
                      config.operatorFeedback?.enabled !== false
                    }
                    detail={`${config.operatorFeedback?.questions?.length ?? 0} question(s) configurée(s)`}
                    icon={ChatBubbleLeftRightIcon}
                  />
                </div>
              </section>

              <section className="card p-5">
                <h2 className="font-semibold">
                  Next configuration steps
                </h2>

                <p className="mt-2 text-sm dark:text-slate-400 light:text-gray-600">
                  Cette première vue est en lecture seule.
                  Les contrôles d’édition, les versions et le simulateur
                  seront ajoutés progressivement après validation de cette page.
                </p>
              </section>
            </>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
