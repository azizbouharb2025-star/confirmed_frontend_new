'use client'

import { motion } from 'framer-motion'
import { useTheme } from '@/hooks/useTheme'
import HeroSection from '@/components/landing/HeroSection'
import TrustSection from '@/components/landing/TrustSection'
import ProductSection from '@/components/landing/ProductSection'
import FeaturesSection from '@/components/landing/FeaturesSection'
import MobileAppSection from '@/components/landing/MobileAppSection'
import BenefitsSection from '@/components/landing/BenefitsSection'
import IntegrationsSection from '@/components/landing/IntegrationsSection'
import MidPageCTASection from '@/components/landing/MidPageCTASection'
import PricingSection from '@/components/landing/PricingSection'
import TestimonialsSection from '@/components/landing/TestimonialsSection'
import CTASection from '@/components/landing/CTASection'
import Footer from '@/components/landing/Footer'
import Header from '@/components/landing/Header'
import ParticleBackground from '@/components/ui/ParticleBackground'
import FloatingActionButton from '@/components/ui/FloatingActionButton'
import ScrollProgress from '@/components/ui/ScrollProgress'

export default function HomePage() {
  const { theme } = useTheme()


  
  return (
    <div className={`min-h-screen transition-colors duration-300 relative overflow-hidden ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-[#0a0a0a] via-[#121212] to-[#1a1a1a] text-white' 
        : 'bg-gradient-to-br from-white via-gray-50 to-blue-50 text-[#1A1A1A]'
    }`}>
      <ScrollProgress />
      <ParticleBackground />
      <div className="relative z-10">
        <Header />
        <main>
          <HeroSection />
          <TrustSection />
          <section id="product">
            <ProductSection />
          </section>
          <section id="features">
            <FeaturesSection />
          </section>
          <MobileAppSection />
          <BenefitsSection />
          <IntegrationsSection />
          <section id="pricing">
            <PricingSection />
          </section>
          <MidPageCTASection />
          <section id="testimonials">
            <TestimonialsSection />
          </section>
          <section id="about">
            <CTASection />
          </section>
        </main>
        <Footer />
      </div>
      <FloatingActionButton />
    </div>
  )
}