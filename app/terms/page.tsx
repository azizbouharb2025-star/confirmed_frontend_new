'use client'

import { useLanguage } from '@/hooks/useLanguage'
import { useTheme } from '@/hooks/useTheme'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function TermsPage() {
  const { language } = useLanguage()
  const { theme } = useTheme()

  const content = {
    en: {
      title: 'Terms of Service',
      lastUpdate: 'Last updated: January 2025',
      sections: [
        { title: '1. Acceptance', content: 'By accessing Confirmed, you agree to these Terms of Service and Tunisian Law n°2004-63.' },
        { title: '2. Service Description', content: 'Confirmed provides AI-powered order confirmation services for e-commerce businesses in Tunisia.' },
        { title: '3. User Accounts', content: 'You must provide accurate information, maintain account security, and notify us of unauthorized access.' },
        { title: '4. Subscription Plans', content: 'Free, Premium, and Enterprise plans available. Prices in TND. Billing monthly. Cancel anytime.' },
        { title: '5. User Obligations', content: 'Use services lawfully, not interfere with platform, respect intellectual property, maintain data accuracy.' },
        { title: '6. Intellectual Property', content: 'All platform content, trademarks, and technology are owned by Confirmed. Limited license granted for service use.' },
        { title: '7. Data Protection (Loi n°2004-63)', content: 'We process data per Tunisian law. See Privacy Policy. You retain ownership of your business data.' },
        { title: '8. Service Availability', content: '99.9% uptime target. Maintenance windows notified in advance. No liability for force majeure.' },
        { title: '9. Limitation of Liability', content: 'Service provided "as is". Liability limited to subscription fees paid. No liability for indirect damages.' },
        { title: '10. Termination', content: 'Either party may terminate. We may suspend for violations. Data export available for 30 days post-termination.' },
        { title: '11. Modifications', content: 'We may modify terms with 30 days notice. Continued use constitutes acceptance.' },
        { title: '12. Governing Law', content: 'Governed by Tunisian law. Disputes resolved in Tunisian courts. Mediation encouraged first.' },
        { title: '13. Contact', content: 'Email: support@confirmed.tn | Address: Tunisia' }
      ]
    },
    fr: {
      title: 'Conditions d\'Utilisation',
      lastUpdate: 'Dernière mise à jour : Janvier 2025',
      sections: [
        { title: '1. Acceptation', content: 'En accédant à Confirmed, vous acceptez ces Conditions et la Loi tunisienne n°2004-63.' },
        { title: '2. Description du Service', content: 'Confirmed fournit des services de confirmation de commandes par IA pour les entreprises e-commerce en Tunisie.' },
        { title: '3. Comptes Utilisateurs', content: 'Fournir des informations exactes, maintenir la sécurité du compte, notifier tout accès non autorisé.' },
        { title: '4. Plans d\'Abonnement', content: 'Plans Gratuit, Premium et Entreprise disponibles. Prix en TND. Facturation mensuelle. Annulation à tout moment.' },
        { title: '5. Obligations', content: 'Utiliser légalement, ne pas interférer avec la plateforme, respecter la propriété intellectuelle, maintenir l\'exactitude des données.' },
        { title: '6. Propriété Intellectuelle', content: 'Tout le contenu, marques et technologie appartiennent à Confirmed. Licence limitée accordée pour l\'utilisation.' },
        { title: '7. Protection des Données (Loi n°2004-63)', content: 'Traitement selon la loi tunisienne. Voir Politique de Confidentialité. Vous conservez la propriété de vos données.' },
        { title: '8. Disponibilité', content: 'Objectif 99,9% de disponibilité. Maintenance notifiée à l\'avance. Pas de responsabilité pour force majeure.' },
        { title: '9. Limitation de Responsabilité', content: 'Service fourni "tel quel". Responsabilité limitée aux frais d\'abonnement. Pas de responsabilité pour dommages indirects.' },
        { title: '10. Résiliation', content: 'Chaque partie peut résilier. Suspension possible pour violations. Export de données disponible 30 jours après résiliation.' },
        { title: '11. Modifications', content: 'Modification possible avec préavis de 30 jours. L\'utilisation continue constitue acceptation.' },
        { title: '12. Loi Applicable', content: 'Régi par la loi tunisienne. Litiges résolus par tribunaux tunisiens. Médiation encouragée d\'abord.' },
        { title: '13. Contact', content: 'Email : support@confirmed.tn | Adresse : Tunisie' }
      ]
    },
    ar: {
      title: 'شروط الخدمة',
      lastUpdate: 'آخر تحديث: يناير 2025',
      sections: [
        { title: '1. القبول', content: 'بالوصول إلى Confirmed، توافق على هذه الشروط والقانون التونسي رقم 2004-63.' },
        { title: '2. وصف الخدمة', content: 'توفر Confirmed خدمات تأكيد الطلبات بالذكاء الاصطناعي لشركات التجارة الإلكترونية في تونس.' },
        { title: '3. حسابات المستخدمين', content: 'يجب تقديم معلومات دقيقة، الحفاظ على أمان الحساب، إخطارنا بالوصول غير المصرح به.' },
        { title: '4. خطط الاشتراك', content: 'خطط مجانية ومميزة ومؤسسية متاحة. الأسعار بالدينار التونسي. فوترة شهرية. إلغاء في أي وقت.' },
        { title: '5. الالتزامات', content: 'استخدام قانوني، عدم التدخل في المنصة، احترام الملكية الفكرية، الحفاظ على دقة البيانات.' },
        { title: '6. الملكية الفكرية', content: 'جميع المحتوى والعلامات والتكنولوجيا مملوكة لـ Confirmed. ترخيص محدود للاستخدام.' },
        { title: '7. حماية البيانات (القانون 2004-63)', content: 'معالجة وفق القانون التونسي. راجع سياسة الخصوصية. تحتفظ بملكية بيانات عملك.' },
        { title: '8. التوفر', content: 'هدف توفر 99.9%. إشعار بالصيانة مسبقاً. لا مسؤولية عن القوة القاهرة.' },
        { title: '9. حدود المسؤولية', content: 'الخدمة "كما هي". المسؤولية محدودة برسوم الاشتراك. لا مسؤولية عن أضرار غير مباشرة.' },
        { title: '10. الإنهاء', content: 'يمكن لأي طرف الإنهاء. قد نوقف للانتهاكات. تصدير البيانات متاح 30 يوماً بعد الإنهاء.' },
        { title: '11. التعديلات', content: 'قد نعدل الشروط بإشعار 30 يوماً. الاستخدام المستمر يشكل قبولاً.' },
        { title: '12. القانون الحاكم', content: 'يحكمه القانون التونسي. النزاعات تحل في المحاكم التونسية. الوساطة مشجعة أولاً.' },
        { title: '13. الاتصال', content: 'البريد: support@confirmed.tn | العنوان: تونس' }
      ]
    }
  }

  const currentContent = content[language as keyof typeof content]

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-gray-50'}`}>
      <div className="max-w-4xl mx-auto px-4 py-16">
        <Link href="/" className={`inline-block mb-8 ${theme === 'dark' ? 'text-[#ADFF2F]' : 'text-[#32CD32]'} hover:underline`}>
          ← {language === 'ar' ? 'العودة' : language === 'fr' ? 'Retour' : 'Back'}
        </Link>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className={`text-4xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            {currentContent.title}
          </h1>
          <p className={`mb-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            {currentContent.lastUpdate}
          </p>

          <div className="space-y-6">
            {currentContent.sections.map((section, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`p-6 rounded-2xl ${theme === 'dark' ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200'}`}
              >
                <h2 className={`text-xl font-bold mb-3 ${theme === 'dark' ? 'text-[#ADFF2F]' : 'text-[#32CD32]'}`}>
                  {section.title}
                </h2>
                <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  {section.content}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
