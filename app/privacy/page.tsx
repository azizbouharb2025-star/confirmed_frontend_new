'use client'

import { useLanguage } from '@/hooks/useLanguage'
import { useTheme } from '@/hooks/useTheme'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function PrivacyPage() {
  const { language } = useLanguage()
  const { theme } = useTheme()

  const content = {
    en: {
      title: 'Privacy Policy',
      lastUpdate: 'Last updated: January 2025',
      sections: [
        { title: '1. Introduction', content: 'Confirmed is committed to protecting your privacy in accordance with Tunisian Law n°2004-63 on the Protection of Personal Data.' },
        { title: '2. Data Controller', content: 'Confirmed is the data controller. Contact: privacy@confirmed.tn' },
        { title: '3. Information We Collect', content: 'Personal identification, business information, order data, usage analytics, communication records.' },
        { title: '4. Legal Basis', content: 'Your consent, contract performance, legal obligations, legitimate interests.' },
        { title: '5. How We Use Data', content: 'Provide services, process orders, send notifications, improve platform, comply with law, prevent fraud.' },
        { title: '6. Data Sharing', content: 'Service providers, payment processors, legal authorities. We do not sell your data.' },
        { title: '7. Your Rights (Loi n°2004-63)', content: 'Access, rectify, delete, object, data portability, withdraw consent. Contact: privacy@confirmed.tn' },
        { title: '8. Security', content: 'Technical and organizational measures to protect your data.' },
        { title: '9. Retention', content: 'Data retained as necessary or required by law (minimum 5 years for commercial records).' },
        { title: '10. International Transfers', content: 'Adequate protection measures for data transfers outside Tunisia.' },
        { title: '11. Cookies', content: 'We use cookies. Control via browser settings.' },
        { title: '12. Changes', content: 'We may update this policy. Notification via email or platform.' },
        { title: '13. Contact', content: 'Email: privacy@confirmed.tn | Instance Nationale de Protection des Données Personnelles (INPDP)' }
      ]
    },
    fr: {
      title: 'Politique de Confidentialité',
      lastUpdate: 'Dernière mise à jour : Janvier 2025',
      sections: [
        { title: '1. Introduction', content: 'Confirmed s\'engage à protéger votre vie privée conformément à la Loi tunisienne n°2004-63 relative à la Protection des Données Personnelles.' },
        { title: '2. Responsable', content: 'Confirmed est le responsable du traitement. Contact : privacy@confirmed.tn' },
        { title: '3. Données Collectées', content: 'Identification personnelle, informations professionnelles, données de commandes, analytiques, communications.' },
        { title: '4. Base Légale', content: 'Votre consentement, exécution du contrat, obligations légales, intérêts légitimes.' },
        { title: '5. Utilisation', content: 'Fournir services, traiter commandes, envoyer notifications, améliorer plateforme, respecter la loi, prévenir fraude.' },
        { title: '6. Partage', content: 'Prestataires, processeurs de paiement, autorités légales. Nous ne vendons pas vos données.' },
        { title: '7. Vos Droits (Loi n°2004-63)', content: 'Accès, rectification, suppression, opposition, portabilité, retrait du consentement. Contact : privacy@confirmed.tn' },
        { title: '8. Sécurité', content: 'Mesures techniques et organisationnelles pour protéger vos données.' },
        { title: '9. Conservation', content: 'Données conservées selon nécessité ou loi (minimum 5 ans pour registres commerciaux).' },
        { title: '10. Transferts', content: 'Mesures de protection pour transferts hors Tunisie.' },
        { title: '11. Cookies', content: 'Nous utilisons des cookies. Contrôle via paramètres navigateur.' },
        { title: '12. Modifications', content: 'Mise à jour possible. Notification par email ou plateforme.' },
        { title: '13. Contact', content: 'Email : privacy@confirmed.tn | Instance Nationale de Protection des Données Personnelles (INPDP)' }
      ]
    },
    ar: {
      title: 'سياسة الخصوصية',
      lastUpdate: 'آخر تحديث: يناير 2025',
      sections: [
        { title: '1. المقدمة', content: 'تلتزم Confirmed بحماية خصوصيتك وفقاً للقانون التونسي رقم 2004-63 المتعلق بحماية البيانات الشخصية.' },
        { title: '2. المسؤول', content: 'Confirmed هي المسؤولة عن البيانات. الاتصال: privacy@confirmed.tn' },
        { title: '3. البيانات المجمعة', content: 'التعريف الشخصي، معلومات العمل، بيانات الطلبات، التحليلات، الاتصالات.' },
        { title: '4. الأساس القانوني', content: 'موافقتك، تنفيذ العقد، الالتزامات القانونية، المصالح المشروعة.' },
        { title: '5. الاستخدام', content: 'توفير الخدمات، معالجة الطلبات، إرسال الإشعارات، تحسين المنصة، الامتثال للقانون، منع الاحتيال.' },
        { title: '6. المشاركة', content: 'مقدمو الخدمات، معالجو الدفع، السلطات القانونية. لا نبيع بياناتك.' },
        { title: '7. حقوقك (القانون 2004-63)', content: 'الوصول، التصحيح، الحذف، الاعتراض، النقل، سحب الموافقة. الاتصال: privacy@confirmed.tn' },
        { title: '8. الأمان', content: 'تدابير تقنية وتنظيمية لحماية بياناتك.' },
        { title: '9. الاحتفاظ', content: 'الاحتفاظ بالبيانات حسب الضرورة أو القانون (5 سنوات كحد أدنى للسجلات التجارية).' },
        { title: '10. النقل الدولي', content: 'تدابير حماية للنقل خارج تونس.' },
        { title: '11. ملفات تعريف الارتباط', content: 'نستخدم ملفات تعريف الارتباط. التحكم عبر إعدادات المتصفح.' },
        { title: '12. التغييرات', content: 'قد نحدث السياسة. إشعار عبر البريد أو المنصة.' },
        { title: '13. الاتصال', content: 'البريد: privacy@confirmed.tn | الهيئة الوطنية لحماية البيانات الشخصية (INPDP)' }
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
