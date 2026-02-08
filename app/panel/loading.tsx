'use client'

export default function PanelLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a0a] via-[#121212] to-[#1a1a1a]">
      <div className="glass-card-confirmed p-8 flex flex-col items-center gap-6">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-purple-500/30 rounded-full animate-spin border-t-[#97FE00]" />
          <div className="absolute inset-2 w-16 h-16 border-4 border-transparent rounded-full animate-spin border-b-[#00BFFF] animation-delay-150" />
        </div>
        <div className="text-center">
          <p className="text-white font-medium">Loading Dashboard</p>
          <p className="text-gray-400 text-sm mt-1">Please wait...</p>
        </div>
      </div>
    </div>
  )
}
