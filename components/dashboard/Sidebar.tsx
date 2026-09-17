'use client'

import Link from 'next/link'
import type { ElementType } from 'react'
import { usePathname } from 'next/navigation'
import {
  XMarkIcon,
  HomeIcon,
  ShoppingBagIcon,
  UsersIcon,
  ChartBarIcon,
  CogIcon,
  PhoneIcon,
  BuildingStorefrontIcon,
  DocumentTextIcon,
  ExclamationCircleIcon,
  QrCodeIcon,
  UserGroupIcon,
  TruckIcon,
  ChartPieIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline'
import { useLanguage } from '@/hooks/useLanguage'
import { useTheme } from '@/hooks/useTheme'
import { TranslationKey } from '@/lib/i18n'
import Image from 'next/image'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  userRole: 'admin' | 'operator' | 'shop_owner'
}

interface NavigationItem {
  name: string
  href: string
  icon: ElementType
  badge?: string
  disabled?: boolean
  hidden?: boolean
}

const getNavigationItems = (
  t: (key: TranslationKey) => string
): Record<SidebarProps['userRole'], NavigationItem[]> => ({
  admin: [
    { name: t('nav.dashboard'), href: '/panel/admin', icon: HomeIcon },
    { name: t('nav.users'), href: '/panel/admin/users', icon: UsersIcon },
    { name: 'Opérateurs', href: '/panel/admin/operators', icon: UserGroupIcon },
    { name: t('nav.orders'), href: '/panel/admin/orders', icon: ShoppingBagIcon },
    { name: t('nav.analytics'), href: '/panel/admin/analytics', icon: ChartBarIcon },
    { name: t('nav.shops'), href: '/panel/admin/shops', icon: BuildingStorefrontIcon },
    { name: t('import.historyNavLabel'), href: '/panel/admin/import-history', icon: ArrowDownTrayIcon },
    { name: t('nav.settings'), href: '/panel/admin/settings', icon: CogIcon },
  ],

  operator: [
    { name: t('nav.dashboard'), href: '/panel/op', icon: HomeIcon },
    { name: t('nav.callQueue'), href: '/panel/op/queue', icon: PhoneIcon },
    { name: t('nav.myStats'), href: '/panel/op/stats', icon: ChartBarIcon },
    { name: t('nav.orders'), href: '/panel/op/orders', icon: ShoppingBagIcon },
  ],

  shop_owner: [
    {
      name: t('nav.dashboard'),
      href: '/panel/client',
      icon: HomeIcon
    },
    {
      name: t('nav.myShops'),
      href: '/panel/client/shops',
      icon: BuildingStorefrontIcon,
      badge: t('nav.comingSoon')
    },
    {
      name: t('nav.orders'),
      href: '/panel/client/orders',
      icon: ShoppingBagIcon
    },
    {
      name: t('nav.products'),
      href: '/panel/client/products',
      icon: DocumentTextIcon
    },
    // Caché temporairement selon le nouveau dashboard PDF.
    // La route et la logique restent conservées.
    {
      name: t('nav.complaints'),
      href: '/panel/client/complaints',
      icon: ExclamationCircleIcon,
      hidden: true
    },

    // Caché temporairement selon le nouveau dashboard PDF.
    // La route et la logique restent conservées.
    {
      name: t('nav.supportCards'),
      href: '/panel/client/support-cards',
      icon: QrCodeIcon,
      hidden: true
    },

    {
      name: t('nav.team'),
      href: '/panel/client/team',
      icon: UserGroupIcon,
      badge: t('nav.comingSoon'),
      disabled: true
    },

    {
      name: t('nav.deliveryCompany'),
      href: '/panel/client/delivery-company',
      icon: TruckIcon
    },

    // Caché temporairement selon le nouveau dashboard PDF.
    // La route et la logique restent conservées.
    {
      name: t('analytics.title'),
      href: '/panel/client/analytics',
      icon: ChartPieIcon,
      hidden: true
    },

    {
      name: t('nav.api'),
      href: '/panel/client/api',
      icon: CogIcon
    },
  ]
})

function ComingSoonBadge({
  label,
  isActive = false,
}: {
  label: string
  isActive?: boolean
}) {
  return (
    <span
      className={`ml-auto shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold leading-4 ${
        isActive
          ? 'border-white/40 bg-white/15 text-white'
          : 'border-[#ADFF2F]/40 bg-[#ADFF2F]/10 text-[#8fdc00]'
      }`}
    >
      {label}
    </span>
  )
}

export default function Sidebar({
  isOpen,
  onClose,
  userRole
}: SidebarProps) {
  const pathname = usePathname()
  const { t } = useLanguage()
  const { theme } = useTheme()

  const navigationItems = getNavigationItems(t)
  const navigation =
    navigationItems[userRole] || navigationItems.shop_owner

  const visibleNavigation = navigation.filter((item) => !item.hidden)

  const isDark = theme === 'dark'

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div
          className={`flex grow flex-col gap-y-5 overflow-y-auto border-r px-6 ${
            isDark
              ? 'bg-slate-900 border-slate-800'
              : 'bg-white border-gray-200'
          }`}
        >
          <div className="-mx-3 flex h-24 shrink-0 items-center justify-center">
            <Link
              href="/"
              className="flex w-full items-center justify-center"
            >
              <Image
                src={isDark ? '/assets/logo2.png' : '/assets/logo1.png'}
                alt="Confirmed"
                width={220}
                height={72}
                className="h-auto w-[220px] object-contain"
                priority
              />
            </Link>
          </div>

          <nav className="flex flex-1 flex-col">
            <ul className="space-y-1">
              {visibleNavigation.map((item) => {
                const isActive = pathname === item.href

                if (item.disabled) {
                  return (
                    <li key={item.name}>
                      <div
                        aria-disabled="true"
                        className={`flex cursor-default select-none items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${
                          isDark
                            ? 'text-slate-400'
                            : 'text-gray-500'
                        }`}
                      >
                        <item.icon className="h-6 w-6 shrink-0" />

                        <span className="min-w-0 flex-1">
                          {item.name}
                        </span>

                        {item.badge && (
                          <ComingSoonBadge label={item.badge} />
                        )}
                      </div>
                    </li>
                  )
                }

                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-blue-500 text-white'
                          : isDark
                            ? 'text-slate-300 hover:bg-slate-800'
                            : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <item.icon className="h-6 w-6 shrink-0" />

                      <span className="min-w-0 flex-1">
                        {item.name}
                      </span>

                      {item.badge && (
                        <ComingSoonBadge
                          label={item.badge}
                          isActive={isActive}
                        />
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>
        </div>
      </div>

      {/* Mobile sidebar */}
      {isOpen && (
        <div className="fixed inset-y-0 z-50 flex w-72 max-w-[85vw] flex-col lg:hidden">
          <div
            className={`flex grow flex-col gap-y-5 overflow-y-auto border-r px-6 shadow-2xl ${
              isDark
                ? 'bg-slate-900 border-slate-800'
                : 'bg-white border-gray-200'
            }`}
          >
            <div className="relative flex h-24 shrink-0 items-center justify-center">
              <Link
                href="/"
                className="flex items-center justify-center"
              >
                <Image
                  src={isDark ? '/assets/logo2.png' : '/assets/logo1.png'}
                  alt="Confirmed"
                  width={205}
                  height={68}
                  className="h-auto w-[205px] object-contain"
                  priority
                />
              </Link>

              <button
                onClick={onClose}
                className={`absolute right-0 rounded-lg p-2 transition-colors ${
                  isDark
                    ? 'hover:bg-slate-800 text-slate-300'
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
                aria-label="Close sidebar"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex flex-1 flex-col">
              <ul className="space-y-1">
                {visibleNavigation.map((item) => {
                  const isActive = pathname === item.href

                  if (item.disabled) {
                    return (
                      <li key={item.name}>
                        <div
                          aria-disabled="true"
                          className={`flex cursor-default select-none items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
                            isDark
                              ? 'text-slate-400'
                              : 'text-gray-500'
                          }`}
                        >
                          <item.icon className="h-5 w-5 shrink-0" />

                          <span className="min-w-0 flex-1">
                            {item.name}
                          </span>

                          {item.badge && (
                            <ComingSoonBadge label={item.badge} />
                          )}
                        </div>
                      </li>
                    )
                  }

                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        onClick={onClose}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-blue-500 text-white'
                            : isDark
                              ? 'text-slate-300 hover:bg-slate-800'
                              : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <item.icon className="h-5 w-5 shrink-0" />

                        <span className="min-w-0 flex-1">
                          {item.name}
                        </span>

                        {item.badge && (
                          <ComingSoonBadge
                            label={item.badge}
                            isActive={isActive}
                          />
                        )}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </nav>
          </div>
        </div>
      )}
    </>
  )
}
