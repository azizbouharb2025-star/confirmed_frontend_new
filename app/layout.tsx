import './globals.css'
import { Inter } from 'next/font/google'
import ParticleBackground from '@/components/ui/ParticleBackground'
import AuthDebug from '@/components/debug/AuthDebug'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Confirmed - AI Order Management',
  description: 'Revolutionary AI-powered order confirmation platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <ParticleBackground />
        <div className="relative z-10">
          {children}
        </div>
        <AuthDebug />
      </body>
    </html>
  )
}