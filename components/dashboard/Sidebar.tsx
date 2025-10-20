'use client'

import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
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
  CreditCardIcon,
  TruckIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'
import { useLanguage } from '@/hooks/useLanguage'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  userRole: 'admin' | 'operator' | 'shop_owner'
}

const getNavigationItems = (t: (key: string) => string) => ({
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
    { name: t('nav.orders'), href: '/panel/client/orders', icon: ShoppingBagIcon },
    { name: t('nav.products'), href: '/panel/client/products', icon: DocumentTextIcon },
    { name: t('nav.analytics'), href: '/panel/client/analytics', icon: ChartBarIcon },
    { name: t('nav.delivery'), href: '/panel/client/delivery', icon: TruckIcon },
    { name: t('nav.subscription'), href: '/panel/client/subscription', icon: CreditCardIcon },
    { name: t('nav.settings'), href: '/panel/client/settings', icon: CogIcon },
  ]
})

export default function Sidebar({ isOpen, onClose, userRole }: SidebarProps) {
  const pathname = usePathname()
  const { t } = useLanguage()
  const navigation = getNavigationItems(t)[userRole]

  const sidebarVariants = {
    open: { x: 0 },
    closed: { x: '-100%' }
  }

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="flex grow flex-col gap-y-5 overflow-y-auto glass-card border-0 border-r border-white/10 px-6 pb-4"
        >
          <div className="flex h-16 shrink-0 items-center">
            <h1 className="text-2xl font-bold gradient-text">Confirmed</h1>
          </div>
          
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item, index) => {
                    const isActive = pathname === item.href
                    return (
                      <motion.li
                        key={item.name}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Link
                          href={item.href}
                          className={`
                            group flex gap-x-3 rounded-xl p-3 text-sm leading-6 font-semibold transition-all duration-300
                            ${isActive 
                              ? 'bg-gradient-to-r from-primary-600/20 to-purple-600/20 text-white border border-primary-500/30 shadow-neon' 
                              : 'text-slate-300 hover:text-white hover:bg-white/10'
                            }
                          `}
                        >
                          <item.icon className="h-6 w-6 shrink-0" />
                          {item.name}
                        </Link>
                      </motion.li>
                    )
                  })}
                </ul>
              </li>
            </ul>
          </nav>
        </motion.div>
      </div>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial="closed"
            animate="open"
            exit="closed"
            variants={sidebarVariants}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 z-50 flex w-72 flex-col lg:hidden"
          >
            <div className="flex grow flex-col gap-y-5 overflow-y-auto glass-card px-6 pb-4">
              <div className="flex h-16 shrink-0 items-center justify-between">
                <h1 className="text-2xl font-bold gradient-text">Confirmed</h1>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl hover:bg-white/10 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <nav className="flex flex-1 flex-col">
                <ul role="list" className="flex flex-1 flex-col gap-y-7">
                  <li>
                    <ul role="list" className="-mx-2 space-y-1">
                      {navigation.map((item, index) => {
                        const isActive = pathname === item.href
                        return (
                          <motion.li
                            key={item.name}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                          >
                            <Link
                              href={item.href}
                              onClick={onClose}
                              className={`
                                group flex gap-x-3 rounded-xl p-3 text-sm leading-6 font-semibold transition-all duration-300
                                ${isActive 
                                  ? 'bg-gradient-to-r from-primary-600/20 to-purple-600/20 text-white border border-primary-500/30 shadow-neon' 
                                  : 'text-slate-300 hover:text-white hover:bg-white/10'
                                }
                              `}
                            >
                              <item.icon className="h-6 w-6 shrink-0" />
                              {item.name}
                            </Link>
                          </motion.li>
                        )
                      })}
                    </ul>
                  </li>
                </ul>
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}