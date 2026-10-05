'use client';

/**
 * LockedWidget Component
 * Displays locked state for features above user's subscription plan
 * Requirements: 5.1, 5.2
 */

import { useState } from 'react';
import { LockClosedIcon, ArrowUpCircleIcon } from '@heroicons/react/24/outline';
import { SubscriptionPlan, getPlanDisplayName } from '@/types/subscription';
import { subscriptionService } from '@/services/subscriptionService';
import UpgradeModal from './UpgradeModal';
import { useLanguage } from '@/hooks/useLanguage';

export interface LockedWidgetProps {
  /** Display name of the locked feature */
  featureName: string;
  /** Description of what the feature provides */
  featureDescription: string;
  /** The minimum plan required to access this feature */
  requiredPlan: SubscriptionPlan;
  /** Optional callback when upgrade is clicked */
  onUpgradeClick?: () => void;
  /** Static premium preview: locked, visible and non-interactive */
  previewOnly?: boolean;
  /** Label displayed for static premium previews */
  previewLabel?: string;
}

/**
 * LockedWidget - Displays a locked state with upgrade prompt
 * 
 * Shows a semi-transparent overlay with lock icon, feature info,
 * required plan badge, and upgrade button.
 * 
 * Requirements:
 * - 5.1: Display semi-transparent overlay with lock icon
 * - 5.2: Display tooltip explaining feature and required plan
 */
export function LockedWidget({
  featureName,
  featureDescription,
  requiredPlan,
  onUpgradeClick,
  previewOnly = false,
  previewLabel = 'Bientôt disponible',
}: LockedWidgetProps): JSX.Element {
  const [showModal, setShowModal] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { t } = useLanguage();

  const planDisplayName = getPlanDisplayName(requiredPlan);
  const upgradeUrl = subscriptionService.getUpgradeUrl(requiredPlan);

  if (previewOnly) {
    return (
      <div
        className="group relative min-h-[220px] cursor-default select-none overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white via-white to-[#00BFFF]/[0.035] p-6 shadow-[0_10px_35px_rgba(15,23,42,0.055)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#ADFF2F]/35 hover:shadow-[0_16px_40px_rgba(15,23,42,0.09)] dark:border-slate-700/80 dark:from-slate-900 dark:via-slate-900 dark:to-[#00BFFF]/[0.045]"
        aria-disabled="true"
        data-testid="locked-widget-preview"
      >
        <div
          className="pointer-events-none absolute inset-x-10 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#ADFF2F] to-transparent opacity-80"
          aria-hidden="true"
        />

        <div
          className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[#00BFFF]/[0.08] blur-3xl"
          aria-hidden="true"
        />

        <div
          className="pointer-events-none absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-[#32CD32]/[0.07] blur-3xl"
          aria-hidden="true"
        />

        <div className="relative z-10 flex h-full min-h-[172px] flex-col">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#ADFF2F]/30 bg-gradient-to-br from-[#ADFF2F]/20 to-[#32CD32]/[0.08] shadow-[0_6px_18px_rgba(173,255,47,0.16)] ring-1 ring-[#ADFF2F]/10 transition-transform duration-300 group-hover:scale-105">
              <LockClosedIcon className="h-5 w-5 text-[#67b900] dark:text-[#ADFF2F]" />
            </div>

            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#ADFF2F]/35 bg-gradient-to-r from-[#ADFF2F]/15 to-[#32CD32]/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.04em] text-[#67b900] shadow-sm dark:text-[#ADFF2F]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#32CD32] shadow-[0_0_8px_rgba(50,205,50,0.7)]" />
              {previewLabel}
            </span>
          </div>

          <div className="flex flex-1 flex-col">
            <h3 className="mb-2 text-[17px] font-bold tracking-tight text-slate-950 dark:text-white">
              {featureName}
            </h3>

            <p className="mb-5 max-w-[95%] text-sm leading-6 text-slate-600 dark:text-slate-400">
              {featureDescription}
            </p>

            <div className="mt-auto border-t border-slate-200/80 pt-3 dark:border-slate-800">
              <div className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.02em] text-slate-500 dark:text-slate-400">
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#00BFFF]/10 text-[#00A6E6]">
                  ✦
                </span>
                <span>Fonctionnalité premium CONFIRMED</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleUpgradeClick = () => {
    if (onUpgradeClick) {
      onUpgradeClick();
    } else {
      setShowModal(true);
    }
  };

  const handleNavigateToUpgrade = () => {
    window.location.href = upgradeUrl;
  };

  return (
    <>
      <div
        className="relative card p-6 min-h-[200px] overflow-hidden cursor-pointer group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleUpgradeClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleUpgradeClick();
          }
        }}
        aria-label={`Locked feature: ${featureName}. Requires ${planDisplayName} plan. Click to upgrade.`}
      >
        {/* Semi-transparent overlay - Requirements 5.1 */}
        <div className="absolute inset-0 bg-slate-900/60 dark:bg-slate-900/70 light:bg-gray-100/80 backdrop-blur-sm z-10 transition-all duration-200 group-hover:bg-slate-900/50 dark:group-hover:bg-slate-900/60 light:group-hover:bg-gray-100/70" />

        {/* Locked content placeholder */}
        <div className="absolute inset-0 flex items-center justify-center opacity-20">
          <div className="w-full h-full p-4">
            <div className="h-4 w-1/3 bg-slate-600 dark:bg-slate-700 light:bg-gray-300 rounded mb-4" />
            <div className="h-20 w-full bg-slate-600 dark:bg-slate-700 light:bg-gray-300 rounded mb-4" />
            <div className="h-4 w-2/3 bg-slate-600 dark:bg-slate-700 light:bg-gray-300 rounded" />
          </div>
        </div>

        {/* Lock icon and content - Requirements 5.1, 5.2 */}
        <div className="relative z-20 flex flex-col items-center justify-center h-full min-h-[160px] text-center">
          <div className="mb-4 p-3 rounded-full bg-slate-800/50 dark:bg-slate-800/50 light:bg-gray-200/80 transition-transform duration-200 group-hover:scale-110">
            <LockClosedIcon className="w-8 h-8 text-slate-400 dark:text-slate-400 light:text-gray-500" />
          </div>

          <h3 className="text-lg font-semibold mb-2 dark:text-white light:text-gray-900">
            {featureName}
          </h3>

          {/* Tooltip/description - Requirements 5.2 */}
          <p className="text-sm text-slate-400 dark:text-slate-400 light:text-gray-600 mb-4 max-w-xs">
            {featureDescription}
          </p>

          {/* Required plan badge - Requirements 5.2 */}
          <div className="mb-4">
            <span 
              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 dark:bg-blue-500/20 dark:text-blue-400 light:bg-blue-100 light:text-blue-700"
              data-testid="required-plan-badge"
            >
              {t('widget.locked.requires')} {planDisplayName} {t('widget.locked.plan')}
            </span>
          </div>

          {/* Upgrade button */}
          <button
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors duration-200"
            onClick={(e) => {
              e.stopPropagation();
              handleUpgradeClick();
            }}
          >
            <ArrowUpCircleIcon className="w-4 h-4" />
            {t('widget.locked.upgradeNow')}
          </button>
        </div>

        {/* Hover tooltip with more details */}
        {isHovered && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-30 px-3 py-2 bg-slate-800 dark:bg-slate-800 light:bg-gray-800 rounded-lg shadow-lg text-xs text-white max-w-[200px] text-center animate-fade-in">
            {t('widget.locked.tooltip')}
          </div>
        )}
      </div>

      {/* Upgrade Modal - Requirements 5.3 */}
      {showModal && (
        <UpgradeModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          recommendedPlan={requiredPlan}
          onUpgrade={handleNavigateToUpgrade}
        />
      )}
    </>
  );
}

export default LockedWidget;
