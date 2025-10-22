'use client'

import { motion } from 'framer-motion'
import { useLanguage } from '@/hooks/useLanguage'
import { useTheme } from '@/hooks/useTheme'
import { StarIcon } from '@heroicons/react/24/solid'
import { UserIcon } from '@heroicons/react/24/outline'

export default function TestimonialsSection() {
  const { t } = useLanguage()
  const { theme } = useTheme()

  const testimonials = [
    {
      quote: t('testimonials.testimonial1.quote'),
      author: t('testimonials.testimonial1.author'),
      company: t('testimonials.testimonial1.company'),
      avatar: '👨‍💼',
      rating: 5
    },
    {
      quote: t('testimonials.testimonial2.quote'),
      author: t('testimonials.testimonial2.author'),
      company: t('testimonials.testimonial2.company'),
      avatar: '👩‍💼',
      rating: 5
    }
  ]

  return (
    <section className={`py-20 ${
      theme === 'dark' ? 'bg-[#121212]' : 'bg-white'
    }`}>
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className={`text-4xl lg:text-5xl font-bold mb-6 ${
            theme === 'dark' ? 'text-white' : 'text-[#1A1A1A]'
          }`}>
            {t('testimonials.title')}
          </h2>
          <p className={`text-xl max-w-3xl mx-auto ${
            theme === 'dark' ? 'text-[#E0E0E0]' : 'text-[#6C757D]'
          }`}>
            {t('testimonials.subtitle')}
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ x: index === 0 ? -50 : 50, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.2, duration: 0.8 }}
              viewport={{ once: true }}
              className={`relative p-8 rounded-3xl shadow-lg transform ${
                index === 0 ? 'lg:rotate-1' : 'lg:-rotate-1'
              } hover:rotate-0 transition-all duration-300 ${
                theme === 'dark' 
                  ? index === 0 
                    ? 'bg-gradient-to-br from-[#2A2A2A] to-[#1E1E1E]'
                    : 'bg-gradient-to-br from-[#1E1E1E] to-[#2A2A2A]'
                  : index === 0
                    ? 'bg-gradient-to-br from-white to-[#F8F9FA]'
                    : 'bg-gradient-to-br from-[#F8F9FA] to-white'
              }`}
            >
              {/* Quote mark */}
              <div className="absolute -top-4 -left-4 w-8 h-8 bg-[#ADFF2F] rounded-full flex items-center justify-center">
                <span className="text-black font-bold text-xl">"</span>
              </div>

              <div className="space-y-6">
                {/* Stars */}
                <div className="flex space-x-1">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <StarIcon key={i} className="w-5 h-5 text-[#ADFF2F]" />
                  ))}
                </div>

                {/* Quote */}
                <blockquote className={`text-lg leading-relaxed italic ${
                  theme === 'dark' ? 'text-[#E0E0E0]' : 'text-[#1A1A1A]'
                }`}>
                  "{testimonial.quote}"
                </blockquote>

                {/* Author */}
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    theme === 'dark' ? 'bg-[#ADFF2F]/10' : 'bg-[#32CD32]/10'
                  }`}>
                    <UserIcon className={`w-6 h-6 ${
                      theme === 'dark' ? 'text-[#ADFF2F]' : 'text-[#32CD32]'
                    }`} />
                  </div>
                  <div>
                    <div className={`font-semibold ${
                      theme === 'dark' ? 'text-white' : 'text-[#1A1A1A]'
                    }`}>
                      {testimonial.author}
                    </div>
                    <div className={`text-sm ${
                      theme === 'dark' ? 'text-[#E0E0E0]' : 'text-[#6C757D]'
                    }`}>
                      {testimonial.company}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}