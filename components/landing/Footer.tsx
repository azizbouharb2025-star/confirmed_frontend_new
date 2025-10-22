'use client'

import { motion } from 'framer-motion'
import { useLanguage } from '@/hooks/useLanguage'
import { useTheme } from '@/hooks/useTheme'
import Link from 'next/link'
import Image from 'next/image'
import { ChatBubbleLeftRightIcon, BriefcaseIcon } from '@heroicons/react/24/outline'

export default function Footer() {
  const { t } = useLanguage()
  const { theme } = useTheme()

  const footerLinks = {
    product: [
      { name: t('footer.product.features'), href: '#features' },
      { name: t('footer.product.pricing'), href: '#pricing' },
      { name: t('footer.product.integrations'), href: '#integrations' },
      { name: t('footer.product.api'), href: '#api' }
    ],
    resources: [
      { name: t('footer.resources.docs'), href: '#docs' },
      { name: t('footer.resources.blog'), href: '#blog' },
      { name: t('footer.resources.support'), href: '#support' },
      { name: t('footer.resources.status'), href: '#status' }
    ],
    company: [
      { name: t('footer.company.about'), href: '#about' },
      { name: t('footer.company.careers'), href: '#careers' },
      { name: t('footer.company.contact'), href: '#contact' },
      { name: t('footer.company.privacy'), href: '#privacy' }
    ]
  }

  const socialLinks = [
    { name: 'Twitter', icon: ChatBubbleLeftRightIcon, href: '#' },
    { name: 'LinkedIn', icon: BriefcaseIcon, href: '#' },
    { name: 'GitHub', icon: ChatBubbleLeftRightIcon, href: '#' },
    { name: 'Discord', icon: ChatBubbleLeftRightIcon, href: '#' }
  ]

  return (
    <footer className={`py-16 border-t ${
      theme === 'dark' 
        ? 'bg-[#1E1E1E] border-[#333333]' 
        : 'bg-[#F8F9FA] border-[#E0E0E0]'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-8">
          {/* Company Info */}
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <Link href="/" className="flex items-center space-x-3">
              <Image 
                src={theme === 'dark' ? '/assets/logo2.png' : '/assets/logo1.png'}
                alt="Confirmed"
                width={200}
                height={200}
                className="w-20 h-20 object-contain"
              />
              
             
            </Link>
            
            <p className={`text-sm leading-relaxed max-w-xs ${
              theme === 'dark' ? 'text-[#E0E0E0]' : 'text-[#6C757D]'
            }`}>
              {t('footer.description')}
            </p>

            <div className="flex space-x-4">
              {socialLinks.map((social, index) => (
                <motion.a
                  key={social.name}
                  href={social.href}
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                  viewport={{ once: true }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 ${
                    theme === 'dark' 
                      ? 'bg-[#2A2A2A] hover:bg-[#333333]' 
                      : 'bg-white hover:bg-gray-100'
                  } shadow-lg`}
                >
                  <social.icon className={`w-5 h-5 ${
                    theme === 'dark' ? 'text-[#ADFF2F]' : 'text-[#32CD32]'
                  }`} />
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Product Links */}
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <h3 className={`font-semibold ${
              theme === 'dark' ? 'text-white' : 'text-[#1A1A1A]'
            }`}>
              {t('footer.product.title')}
            </h3>
            <ul className="space-y-3">
              {footerLinks.product.map((link, index) => (
                <li key={index}>
                  <Link 
                    href={link.href}
                    className={`text-sm transition-colors hover:text-[#ADFF2F] ${
                      theme === 'dark' ? 'text-[#E0E0E0]' : 'text-[#6C757D]'
                    }`}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Resources Links */}
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <h3 className={`font-semibold ${
              theme === 'dark' ? 'text-white' : 'text-[#1A1A1A]'
            }`}>
              {t('footer.resources.title')}
            </h3>
            <ul className="space-y-3">
              {footerLinks.resources.map((link, index) => (
                <li key={index}>
                  <Link 
                    href={link.href}
                    className={`text-sm transition-colors hover:text-[#ADFF2F] ${
                      theme === 'dark' ? 'text-[#E0E0E0]' : 'text-[#6C757D]'
                    }`}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Company Links */}
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <h3 className={`font-semibold ${
              theme === 'dark' ? 'text-white' : 'text-[#1A1A1A]'
            }`}>
              {t('footer.company.title')}
            </h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link, index) => (
                <li key={index}>
                  <Link 
                    href={link.href}
                    className={`text-sm transition-colors hover:text-[#ADFF2F] ${
                      theme === 'dark' ? 'text-[#E0E0E0]' : 'text-[#6C757D]'
                    }`}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Bottom Bar */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          viewport={{ once: true }}
          className={`mt-12 pt-8 border-t flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 text-center sm:text-left ${
            theme === 'dark' ? 'border-[#333333]' : 'border-[#E0E0E0]'
          }`}
        >
          <p className={`text-sm ${
            theme === 'dark' ? 'text-[#E0E0E0]' : 'text-[#6C757D]'
          }`}>
            © 2024 Confirmed. {t('footer.rights')}
          </p>
          
          <div className="flex space-x-6">
            <Link 
              href="/privacy"
              className={`text-sm transition-colors hover:text-[#ADFF2F] ${
                theme === 'dark' ? 'text-[#E0E0E0]' : 'text-[#6C757D]'
              }`}
            >
              {t('footer.privacy')}
            </Link>
            <Link 
              href="/terms"
              className={`text-sm transition-colors hover:text-[#ADFF2F] ${
                theme === 'dark' ? 'text-[#E0E0E0]' : 'text-[#6C757D]'
              }`}
            >
              {t('footer.terms')}
            </Link>
          </div>
        </motion.div>
      </div>
    </footer>
  )
}