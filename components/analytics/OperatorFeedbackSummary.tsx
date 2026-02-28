'use client'

import { OperatorFeedbackSummaryData } from '@/types/analytics'
import { useLanguage } from '@/hooks/useLanguage'
import { useTheme } from '@/hooks/useTheme'
import { StarIcon, ChatBubbleLeftIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/solid'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface OperatorFeedbackSummaryProps {
  data: OperatorFeedbackSummaryData
}

export default function OperatorFeedbackSummary({ data }: OperatorFeedbackSummaryProps) {
  const { t } = useLanguage()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  // Calculate trend
  const trendData = data.trendData
  const trend = trendData.length >= 2
    ? trendData[trendData.length - 1].averageRating - trendData[0].averageRating
    : 0

  return (
    <div className={`p-6 rounded-xl border ${
      isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
    }`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-lg ${
            isDark ? 'bg-purple-500/20' : 'bg-purple-100'
          }`}>
            <ChatBubbleLeftIcon className="w-6 h-6 text-purple-500" />
          </div>
          <div>
            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {t('analytics.operatorFeedback')}
            </h2>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
              Summary of operator feedback and ratings
            </p>
          </div>
        </div>

        {/* Trend Indicator */}
        {trend !== 0 && (
          <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
            trend > 0
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}>
            {trend > 0 ? (
              <ArrowTrendingUpIcon className="w-4 h-4" />
            ) : (
              <ArrowTrendingDownIcon className="w-4 h-4" />
            )}
            {Math.abs(trend).toFixed(1)}
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className={`p-4 rounded-lg ${
          isDark ? 'bg-slate-700/50' : 'bg-gray-50'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <StarIcon className="w-5 h-5 text-yellow-500" />
            <span className={`text-sm font-medium ${
              isDark ? 'text-slate-300' : 'text-gray-600'
            }`}>
              {t('analytics.averageRating')}
            </span>
          </div>
          <div className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {data.averageRating.toFixed(1)}
            <span className="text-lg text-gray-500">/5.0</span>
          </div>
        </div>

        <div className={`p-4 rounded-lg ${
          isDark ? 'bg-slate-700/50' : 'bg-gray-50'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <ChatBubbleLeftIcon className="w-5 h-5 text-blue-500" />
            <span className={`text-sm font-medium ${
              isDark ? 'text-slate-300' : 'text-gray-600'
            }`}>
              {t('analytics.totalFeedback')}
            </span>
          </div>
          <div className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {data.totalFeedback.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Trend Chart */}
      {trendData.length > 0 && (
        <div className="mb-6">
          <h3 className={`text-sm font-medium mb-3 ${
            isDark ? 'text-slate-300' : 'text-gray-700'
          }`}>
            Rating Trend
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e5e7eb'} />
              <XAxis
                dataKey="date"
                stroke={isDark ? '#94a3b8' : '#6b7280'}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                domain={[0, 5]}
                stroke={isDark ? '#94a3b8' : '#6b7280'}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? '#1e293b' : '#ffffff',
                  border: `1px solid ${isDark ? '#334155' : '#e5e7eb'}`,
                  borderRadius: '8px',
                }}
                labelStyle={{ color: isDark ? '#e2e8f0' : '#1f2937' }}
              />
              <Line
                type="monotone"
                dataKey="averageRating"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={{ fill: '#8b5cf6', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Top Tags */}
      <div>
        <h3 className={`text-sm font-medium mb-3 ${
          isDark ? 'text-slate-300' : 'text-gray-700'
        }`}>
          Top Feedback Tags
        </h3>
        <div className="space-y-2">
          {data.topTags.map((tag, index) => {
            const percentage = (tag.count / data.totalFeedback) * 100
            return (
              <div key={index}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                    {tag.tag}
                  </span>
                  <span className={`text-sm font-medium ${
                    isDark ? 'text-slate-400' : 'text-gray-600'
                  }`}>
                    {tag.count} ({percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className={`h-2 rounded-full overflow-hidden ${
                  isDark ? 'bg-slate-700' : 'bg-gray-200'
                }`}>
                  <div
                    className="h-full bg-purple-500 transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
