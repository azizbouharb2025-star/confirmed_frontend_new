import './globals.css'
import { Inter } from 'next/font/google'
import ThemeProvider from '@/components/providers/ThemeProvider'
import AuthDebug from '@/components/debug/AuthDebug'
import CookieConsent from '@/components/ui/CookieConsent'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Confirmed - AI Order Management',
  description: 'Revolutionary AI-powered order confirmation platform',
  icons: {
    icon: '/assets/logo3.png',
    shortcut: '/assets/logo3.png',
    apple: '/assets/logo3.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
        <AuthDebug />
        <CookieConsent />
      </body>
    </html>
  )
}