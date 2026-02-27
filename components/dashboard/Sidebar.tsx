'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { XMarkIcon, HomeIcon, ShoppingBagIcon, UsersIcon, ChartBarIcon, CogIcon, PhoneIcon, BuildingStorefrontIcon, DocumentTextIcon, ExclamationCircleIcon, QrCodeIcon } from '@heroicons/react/24/outline'
import { useLanguage } from '@/hooks/useLanguage'
import { useTheme } from '@/hooks/useTheme'
import { TranslationKey } from '@/lib/i18n'
import Image from 'next/image'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  userRole: 'admin' | 'operator' | 'shop_owner'
}

const getNavigationItems = (t: (key: TranslationKey) => string) => ({
  admin: [
    { name: t('nav.dashboard'), href: '/panel/admin', icon: HomeIcon },
    { name: t('nav.users'), href: '/panel/admin/users', icon: UsersIcon },
    { name: t('nav.orders'), href: '/panel/admin/orders', icon: ShoppingBagIcon },
    { name: t('nav.analytics'), href: '/panel/admin/analytics', icon: ChartBarIcon },
    { name: t('nav.shops'), href: '/panel/admin/shops', icon: BuildingStorefrontIcon },
    { name: t('nav.settings'), href: '/panel/admin/settings', icon: CogIcon },
  ],
  operator: [
    { name: t('nav.dashboard'), href: '/panel/op', icon: HomeIcon },
    { name: t('nav.callQueue'), href: '/panel/op/queue', icon: PhoneIcon },
    { name: t('nav.myStats'), href: '/panel/op/stats', icon: ChartBarIcon },
    { name: t('nav.orders'), href: '/panel/op/orders', icon: ShoppingBagIcon },
  ],
  shop_owner: [
    { name: t('nav.dashboard'), href: '/panel/client', icon: HomeIcon },
    { name: t('nav.myShops'), href: '/panel/client/shops', icon: BuildingStorefrontIcon },
    { name: t('nav.orders'), href: '/panel/client/orders', icon: ShoppingBagIcon },
    { name: t('nav.products'), href: '/panel/client/products', icon: DocumentTextIcon },
    { name: t('nav.complaints'), href: '/panel/client/complaints', icon: ExclamationCircleIcon },
    { name: t('nav.supportCards'), href: '/panel/client/support-cards', icon: QrCodeIcon },
    { name: t('nav.api'), href: '/panel/client/api', icon: CogIcon },
  ]
})

export default function Sidebar({ isOpen, onClose, userRole }: SidebarProps) {
  const pathname = usePathname()
  const { t } = useLanguage()
  const { theme } = useTheme()
  const navigationItems = getNavigationItems(t)
  const navigation = navigationItems[userRole] || navigationItems.shop_owner
  const isDark = theme === 'dark'

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div className={`flex grow flex-col gap-y-5 overflow-y-auto border-r px-6 ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'
        }`}>
          <div className="flex h-16 shrink-0 items-center">
            <Link href="/">
              <Image src={isDark ? '/assets/logo2.png' : '/assets/logo1.png'} alt="Confirmed" width={160} height={50} className="object-contain" />
            </Link>
          </div>
          
          <nav className="flex flex-1 flex-col">
            <ul className="space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <li key={item.name}>
                    <Link href={item.href} className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive 
                        ? 'bg-blue-500 text-white' 
                        : isDark
                          ? 'text-slate-300 hover:bg-slate-800'
                          : 'text-gray-700 hover:bg-gray-100'
                    }`}>
                      <item.icon className="h-6 w-6" />
                      {item.name}
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
          <div className={`flex grow flex-col gap-y-5 overflow-y-auto px-6 border-r shadow-2xl ${
            isDark
              ? 'bg-slate-900 border-slate-800'
              : 'bg-white border-gray-200'
          }`}>
            <div className="flex h-16 shrink-0 items-center justify-between">
              <Image src={isDark ? '/assets/logo2.png' : '/assets/logo1.png'} alt="Confirmed" width={120} height={40} />
              <button
                onClick={onClose}
                className={`p-2 rounded-lg transition-colors ${
                  isDark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-gray-100 text-gray-600'
                }`}
                aria-label="Close sidebar"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            
            <nav className="flex flex-1 flex-col">
              <ul className="space-y-1">
                {navigation.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <li key={item.name}>
                      <Link href={item.href} onClick={onClose} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                        isActive 
                          ? 'bg-blue-500 text-white' 
                          : isDark
                            ? 'text-slate-300 hover:bg-slate-800'
                            : 'text-gray-700 hover:bg-gray-100'
                      }`}>
                        <item.icon className="h-5 w-5" />
                        {item.name}
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