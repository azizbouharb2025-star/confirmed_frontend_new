import Link from 'next/link'
import {
  CheckCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'
import AuthCard from '@/components/ui/AuthCard'

export default function AccountPendingPage() {
  return (
    <AuthCard
      title="Activation en attente"
      subtitle="Votre compte a bien été créé. 🎉"
    >
      <div className="space-y-6">
        <div className="flex justify-center">
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-[#ADFF2F]/10">
            <CheckCircleIcon className="h-12 w-12 text-[#32CD32]" />

            <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow dark:bg-slate-800">
              <ClockIcon className="h-5 w-5 text-gray-600 dark:text-slate-300" />
            </div>
          </div>
        </div>

        <div className="space-y-4 text-center text-sm leading-6 text-gray-600 dark:text-slate-300">
          <p>
            Merci de votre inscription sur{' '}
            <strong className="text-gray-900 dark:text-white">
              CONFIRMED
            </strong>.
          </p>

          <p>
            Afin de garantir une expérience de qualité,
            chaque nouveau compte est validé par notre équipe.
          </p>

          <p>
            Nous vous contacterons très prochainement pour
            confirmer l&apos;activation de votre compte,
            vous présenter la plateforme et répondre à vos
            éventuelles questions.
          </p>

          <div className="rounded-xl border border-[#ADFF2F]/30 bg-[#ADFF2F]/5 p-4 text-gray-700 dark:text-slate-200">
            Une fois votre compte activé, vous pourrez accéder
            à l&apos;ensemble des fonctionnalités de CONFIRMED.
          </div>

          <p className="font-medium text-gray-800 dark:text-slate-100">
            Merci de votre confiance.
          </p>
        </div>

        <Link
          href="/panel/login"
          className="flex w-full items-center justify-center rounded-xl bg-[#ADFF2F] px-4 py-3 font-semibold text-gray-900 transition hover:brightness-95"
        >
          Retour à la connexion
        </Link>
      </div>
    </AuthCard>
  )
}
