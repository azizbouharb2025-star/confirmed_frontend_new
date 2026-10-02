'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { WalletIcon } from '@heroicons/react/24/outline'
import api from '@/lib/api'
import { useTheme } from '@/hooks/useTheme'

interface ShopWalletResponse {
  wallet: {
    id: string
    shopId: string
    availableBalance: number
    pendingBalance: number
    currency: 'TND'
  }
}

function formatAmount(value: number) {
  return value.toLocaleString('fr-TN', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  })
}

export default function ShopWalletButton() {
  const router = useRouter()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [balance, setBalance] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const fetchWallet = async () => {
      try {
        const response = await api.get('/api/wallet')
        const data = response.data as ShopWalletResponse

        if (!cancelled) {
          setBalance(data.wallet?.availableBalance ?? 0)
        }
      } catch {
        if (!cancelled) {
          setBalance(null)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchWallet()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <button
      type="button"
      onClick={() => router.push('/panel/client/wallet')}
      className={`flex h-10 items-center gap-2 rounded-xl border px-2.5 sm:px-3 transition-all ${
        isDark
          ? 'border-slate-700 bg-slate-800/70 text-slate-100 hover:bg-slate-800'
          : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
      }`}
      aria-label="Wallet"
      title="Wallet"
    >
      <WalletIcon className="h-5 w-5 shrink-0" />

      <span className="hidden sm:flex items-baseline gap-1 whitespace-nowrap">
        <span className="text-sm font-semibold">
          {loading
            ? '...'
            : balance === null
              ? '—'
              : formatAmount(balance)}
        </span>

        <span
          className={`text-[11px] font-medium ${
            isDark ? 'text-slate-400' : 'text-gray-500'
          }`}
        >
          DT
        </span>
      </span>
    </button>
  )
}
