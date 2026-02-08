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

export interface LockedWidgetProps {
  /** Display name of the locked feature */
  featureName: string;
  /** Description of what the feature provides */
  featureDescription: string;
  /** The minimum plan required to access this feature */
  requiredPlan: SubscriptionPlan;
  /** Optional callback when upgrade is clicked */
  onUpgradeClick?: () => void;
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
}: LockedWidgetProps): JSX.Element {
  const [showModal, setShowModal] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const planDisplayName = getPlanDisplayName(requiredPlan);
  const upgradeUrl = subscriptionService.getUpgradeUrl(requiredPlan);

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
              Requires {planDisplayName} Plan
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
            Upgrade Now
          </button>
        </div>

        {/* Hover tooltip with more details */}
        {isHovered && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-30 px-3 py-2 bg-slate-800 dark:bg-slate-800 light:bg-gray-800 rounded-lg shadow-lg text-xs text-white max-w-[200px] text-center animate-fade-in">
            Click to see plan comparison and upgrade options
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
