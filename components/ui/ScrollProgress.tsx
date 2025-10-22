'use client'

import { motion, useScroll, useSpring } from 'framer-motion'
import { useTheme } from '@/hooks/useTheme'

export default function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const { theme } = useTheme()
  
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  })

  return (
    <motion.div
      className={`fixed top-0 left-0 right-0 h-1 z-50 origin-left ${
        theme === 'dark'
          ? 'bg-gradient-to-r from-[#ADFF2F] via-[#32CD32] to-[#00BFFF]'
          : 'bg-gradient-to-r from-green-500 via-blue-500 to-purple-500'
      }`}
      style={{ scaleX }}
    />
  )
}