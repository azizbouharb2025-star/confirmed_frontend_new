'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { 
  HomeIcon,
  ShoppingBagIcon,
  PhoneIcon
} from '@heroicons/react/24/outline'
import { useTheme } from '@/hooks/useTheme'
import { useLanguage } from '@/hooks/useLanguage'

export default function OperatorNavbar() {
  const pathname = usePathname()
  const { theme } = useTheme()
  const { t } = useLanguage()

  const navItems = [
    { 
      name: t('nav.dashboard'), 
      href: '/panel/op', 
      icon: HomeIcon
    },
    { 
      name: t('nav.callQueue'), 
      href: '/panel/op/queue', 
      icon: PhoneIcon
    },
    { 
      name: t('nav.orders'), 
      href: '/panel/op/orders', 
      icon: ShoppingBagIcon
    }
  ]

  return (
    <div className="fixed left-0 top-0 h-full w-20 lg:w-64 z-40">
      <motion.div
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="h-full glass-card border-0 border-r border-white/10 backdrop-blur-xl"
      >
        <div className="flex h-16 items-center justify-center lg:justify-start lg:px-6">
          <Link href="/">
            <Image 
              src={theme === 'dark' ? '/assets/logo2.png' : '/assets/logo1.png'}
              alt="Confirmed"
              width={120}
              height={40}
              className="object-contain transition-all duration-300 hidden lg:block"
            />
          </Link>
          <div className="lg:hidden w-8 h-8 bg-gradient-to-r from-neon-green to-accent-blue rounded-lg flex items-center justify-center">
            <span className="text-black font-bold text-sm">C</span>
          </div>
        </div>
        
        {/* Navigation Links */}
        <nav className="mt-8 px-3 lg:px-6">
          <ul className="space-y-2">
            {navItems.map((item, index) => {
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
                    className={`group flex items-center gap-3 rounded-xl p-3 text-sm font-semibold transition-all duration-300 ${
                      isActive
                        ? 'bg-gradient-to-r from-neon-green/20 to-accent-blue/20 text-white border border-neon-green/30 shadow-neon'
                        : theme === 'dark' 
                          ? 'text-slate-300 hover:text-white hover:bg-white/10' 
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <item.icon className="h-6 w-6 shrink-0" />
                    <span className="hidden lg:block">{item.name}</span>
                  </Link>
                </motion.li>
              )
            })}
          </ul>
        </nav>
      </motion.div>
    </div>
  )
}