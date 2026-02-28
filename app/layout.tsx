import './globals.css'
import { Inter } from 'next/font/google'
import ThemeProvider from '@/components/providers/ThemeProvider'
import { WebSocketProvider } from '@/components/providers/WebSocketProvider'
import LanguageProvider from '@/components/providers/LanguageProvider'
import CookieConsent from '@/components/ui/CookieConsent'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Confirmed',
  description: 'Revolutionary AI-powered order confirmation platform',
  icons: {
    icon: [{ url: '/assets/logo3.png', sizes: '512x512', type: 'image/png' }],
    shortcut: [{ url: '/assets/logo3.png', sizes: '512x512', type: 'image/png' }],
    apple: [{ url: '/assets/logo3.png', sizes: '512x512', type: 'image/png' }],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={inter.className}>
        <LanguageProvider>
          <ThemeProvider>
            <WebSocketProvider>
              {children}
            </WebSocketProvider>
          </ThemeProvider>
        </LanguageProvider>
        <CookieConsent />
        <Toaster />
      </body>
    </html>
  )
}