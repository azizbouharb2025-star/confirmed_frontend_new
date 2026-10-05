'use client'

import { motion } from 'framer-motion'
import { useLanguage } from '@/hooks/useLanguage'
import { useTheme } from '@/hooks/useTheme'
import { BoltIcon, ChartBarIcon } from '@heroicons/react/24/outline'
import { TargetIcon } from 'lucide-react'

const chartHeights = [34, 52, 43, 69, 58, 82, 66, 94]

export default function ProductSection() {
  const { t } = useLanguage()
  const { theme } = useTheme()

  const isDark = theme === 'dark'

  const metrics = [
    {
      label: 'Orders',
      value: '1,250',
      accent: 'bg-[#00BFFF]',
      glow: 'bg-[#00BFFF]/10',
    },
    {
      label: 'Confirmed',
      value: '1,031',
      accent: 'bg-[#32CD32]',
      glow: 'bg-[#32CD32]/10',
    },
    {
      label: 'Rate',
      value: '82.5%',
      accent: 'bg-[#ADFF2F]',
      glow: 'bg-[#ADFF2F]/12',
    },
  ]

  const points = [
    {
      icon: BoltIcon,
      title: t('product.feature1.title'),
      desc: t('product.feature1.desc'),
      accent: 'cyan',
    },
    {
      icon: TargetIcon,
      title: t('product.feature2.title'),
      desc: t('product.feature2.desc'),
      accent: 'lime',
    },
    {
      icon: ChartBarIcon,
      title: t('product.feature3.title'),
      desc: t('product.feature3.desc'),
      accent: 'green',
    },
  ]

  return (
    <section
      className={`relative flex min-h-[100svh] items-center overflow-hidden py-20 sm:py-24 lg:py-28 ${
        isDark ? 'bg-[#101010]' : 'bg-[#F8FAFC]'
      }`}
    >
      {/* Decorative Confirmed atmosphere */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
      >
        <div className="absolute -left-32 top-16 h-80 w-80 rounded-full bg-[#ADFF2F]/[0.07] blur-3xl" />
        <div className="absolute -right-28 top-40 h-96 w-96 rounded-full bg-[#00BFFF]/[0.08] blur-3xl" />
        <div className="absolute bottom-0 left-[38%] h-64 w-64 rounded-full bg-[#32CD32]/[0.055] blur-3xl" />

        <div
          className={`absolute inset-x-0 top-0 h-px ${
            isDark
              ? 'bg-gradient-to-r from-transparent via-white/10 to-transparent'
              : 'bg-gradient-to-r from-transparent via-slate-300/70 to-transparent'
          }`}
        />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="space-y-12 lg:space-y-16"
        >
          {/* Section heading */}
          <div className="mx-auto max-w-3xl space-y-5 text-center">
            <div
              className="mx-auto flex w-fit items-center gap-2"
              aria-hidden="true"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#00BFFF]" />
              <span className="h-px w-10 bg-gradient-to-r from-[#00BFFF] to-[#ADFF2F]" />
              <span className="h-2 w-2 rotate-45 rounded-[2px] bg-[#ADFF2F]" />
              <span className="h-px w-10 bg-gradient-to-r from-[#ADFF2F] to-[#32CD32]" />
              <span className="h-1.5 w-1.5 rounded-full bg-[#32CD32]" />
            </div>

            <h2
              className={`text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl ${
                isDark ? 'text-white' : 'text-slate-950'
              }`}
            >
              {t('product.title')}
            </h2>

            <p
              className={`mx-auto max-w-2xl text-base leading-7 sm:text-lg ${
                isDark ? 'text-slate-300' : 'text-slate-600'
              }`}
            >
              {t('product.description')}
            </p>
          </div>

          {/* Product showcase */}
          <motion.div
            initial={{ y: 50, scale: 0.97, opacity: 0 }}
            whileInView={{ y: 0, scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            viewport={{ once: true }}
            className="relative mx-auto max-w-5xl"
          >
            {/* Glow behind mockup */}
            <div
              className="pointer-events-none absolute -inset-10 bg-[radial-gradient(circle_at_center,rgba(173,255,47,0.10),transparent_58%)]"
              aria-hidden="true"
            />

            <div
              className={`relative overflow-hidden rounded-[30px] border p-2.5 shadow-[0_28px_90px_rgba(15,23,42,0.15)] sm:p-3 ${
                isDark
                  ? 'border-white/10 bg-white/[0.045] shadow-black/40'
                  : 'border-white bg-white/80 shadow-slate-300/40'
              }`}
            >
              {/* Brand accent */}
              <div
                className="absolute inset-x-20 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#ADFF2F] to-transparent"
                aria-hidden="true"
              />

              <div
                className={`overflow-hidden rounded-[23px] border ${
                  isDark
                    ? 'border-white/[0.07] bg-[#151515]'
                    : 'border-slate-200/80 bg-white'
                }`}
              >
                {/* Browser top bar */}
                <div
                  className={`flex items-center border-b px-4 py-3 sm:px-5 ${
                    isDark
                      ? 'border-white/[0.07] bg-[#1D1D1D]'
                      : 'border-slate-200/80 bg-slate-50/90'
                  }`}
                >
                  <div className="flex shrink-0 gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
                  </div>

                  <div
                    className={`mx-auto hidden w-full max-w-sm items-center rounded-lg border px-3 py-1.5 text-left text-[11px] sm:flex ${
                      isDark
                        ? 'border-white/[0.06] bg-black/25 text-slate-400'
                        : 'border-slate-200 bg-white text-slate-500 shadow-sm'
                    }`}
                  >
                    <span className="mr-2 h-1.5 w-1.5 rounded-full bg-[#32CD32]" />
                    confirmed.app/dashboard
                  </div>

                  <div className="w-[49px]" />
                </div>

                {/* Fake dashboard */}
                <div
                  className={`relative space-y-5 p-4 sm:p-6 lg:p-8 ${
                    isDark ? 'bg-[#141414]' : 'bg-[#FBFCFD]'
                  }`}
                >
                  <div
                    className="pointer-events-none absolute right-0 top-0 h-52 w-52 rounded-full bg-[#00BFFF]/[0.05] blur-3xl"
                    aria-hidden="true"
                  />

                  {/* Dashboard header */}
                  <div className="relative flex items-center justify-between">
                    <div>
                      <h3
                        className={`text-xl font-bold tracking-tight sm:text-2xl ${
                          isDark ? 'text-white' : 'text-slate-950'
                        }`}
                      >
                        Dashboard
                      </h3>

                      <div className="mt-2 h-1.5 w-24 rounded-full bg-gradient-to-r from-[#ADFF2F] via-[#32CD32] to-[#00BFFF]" />
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="h-9 w-9 rounded-xl border border-[#ADFF2F]/25 bg-[#ADFF2F]/10" />
                      <div
                        className={`h-9 w-9 rounded-xl border ${
                          isDark
                            ? 'border-white/10 bg-white/[0.05]'
                            : 'border-slate-200 bg-white'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
                    {metrics.map((metric) => (
                      <div
                        key={metric.label}
                        className={`relative overflow-hidden rounded-xl border p-3 text-left shadow-sm sm:rounded-2xl sm:p-4 ${
                          isDark
                            ? 'border-white/[0.07] bg-white/[0.035]'
                            : 'border-slate-200/80 bg-white'
                        }`}
                      >
                        <div
                          className={`absolute -right-8 -top-8 h-20 w-20 rounded-full blur-2xl ${metric.glow}`}
                          aria-hidden="true"
                        />

                        <div
                          className={`mb-3 h-2 w-2 rounded-full sm:h-2.5 sm:w-2.5 ${metric.accent}`}
                        />

                        <div
                          className={`relative text-lg font-extrabold tracking-tight sm:text-2xl ${
                            isDark ? 'text-white' : 'text-slate-950'
                          }`}
                        >
                          {metric.value}
                        </div>

                        <div
                          className={`relative mt-0.5 text-[10px] font-medium sm:text-xs ${
                            isDark ? 'text-slate-400' : 'text-slate-500'
                          }`}
                        >
                          {metric.label}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Chart */}
                  <div
                    className={`relative overflow-hidden rounded-2xl border p-4 sm:p-5 ${
                      isDark
                        ? 'border-white/[0.07] bg-white/[0.03]'
                        : 'border-slate-200/80 bg-white'
                    }`}
                  >
                    <div
                      className="pointer-events-none absolute inset-0 opacity-50"
                      aria-hidden="true"
                    >
                      {[25, 50, 75].map((position) => (
                        <div
                          key={position}
                          className={`absolute inset-x-0 border-t ${
                            isDark
                              ? 'border-white/[0.05]'
                              : 'border-slate-100'
                          }`}
                          style={{ top: `${position}%` }}
                        />
                      ))}
                    </div>

                    <div className="relative flex h-28 items-end justify-between gap-2 sm:h-36 sm:gap-3">
                      {chartHeights.map((height, index) => (
                        <motion.div
                          key={index}
                          initial={{ height: 0 }}
                          whileInView={{ height: `${height}%` }}
                          transition={{
                            duration: 0.65,
                            delay: 0.08 * index,
                          }}
                          viewport={{ once: true }}
                          className={`w-full rounded-t-md ${
                            index === chartHeights.length - 1
                              ? 'bg-gradient-to-t from-[#32CD32] to-[#ADFF2F]'
                              : index % 3 === 0
                                ? 'bg-[#00BFFF]/75'
                                : 'bg-[#32CD32]/65'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Laptop base */}
            <div
              className={`mx-auto h-3 w-[86%] rounded-b-[50%] border-x border-b ${
                isDark
                  ? 'border-white/10 bg-[#272727]'
                  : 'border-slate-300 bg-gradient-to-b from-slate-200 to-slate-300'
              }`}
            />
          </motion.div>

          {/* Key points */}
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 md:grid-cols-3">
            {points.map((point, index) => {
              const IconComponent = point.icon

              const accentClasses =
                point.accent === 'cyan'
                  ? {
                      icon: 'bg-[#00BFFF]/10 text-[#00A6E6]',
                      line: 'via-[#00BFFF]',
                      glow: 'bg-[#00BFFF]/10',
                    }
                  : point.accent === 'lime'
                    ? {
                        icon: 'bg-[#ADFF2F]/15 text-[#64A900] dark:text-[#ADFF2F]',
                        line: 'via-[#ADFF2F]',
                        glow: 'bg-[#ADFF2F]/10',
                      }
                    : {
                        icon: 'bg-[#32CD32]/10 text-green-600 dark:text-green-400',
                        line: 'via-[#32CD32]',
                        glow: 'bg-[#32CD32]/10',
                      }

              return (
                <motion.div
                  key={point.title}
                  initial={{ y: 24, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  whileHover={{ y: -4 }}
                  transition={{
                    delay: index * 0.08,
                    duration: 0.5,
                  }}
                  viewport={{ once: true }}
                  className={`group relative overflow-hidden rounded-2xl border p-5 text-left shadow-sm transition-shadow duration-300 hover:shadow-lg ${
                    isDark
                      ? 'border-white/[0.08] bg-white/[0.035]'
                      : 'border-slate-200/80 bg-white/85'
                  }`}
                >
                  <div
                    className={`absolute inset-x-10 top-0 h-[2px] bg-gradient-to-r from-transparent ${accentClasses.line} to-transparent`}
                    aria-hidden="true"
                  />

                  <div
                    className={`pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full blur-3xl ${accentClasses.glow}`}
                    aria-hidden="true"
                  />

                  <div
                    className={`relative mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${accentClasses.icon}`}
                  >
                    <IconComponent className="h-5 w-5" />
                  </div>

                  <h3
                    className={`relative text-lg font-bold ${
                      isDark ? 'text-white' : 'text-slate-950'
                    }`}
                  >
                    {point.title}
                  </h3>

                  <p
                    className={`relative mt-2 text-sm leading-6 ${
                      isDark ? 'text-slate-400' : 'text-slate-600'
                    }`}
                  >
                    {point.desc}
                  </p>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
