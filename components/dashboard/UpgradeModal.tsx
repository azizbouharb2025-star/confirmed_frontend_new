'use client';

/**
 * UpgradeModal Component
 * Displays plan comparison and upgrade options
 * Requirements: 5.3, 5.4
 */

import { Fragment } from 'react';
import { XMarkIcon, CheckIcon, StarIcon } from '@heroicons/react/24/outline';
import { SubscriptionPlan, getPlanDisplayName, ALL_PLANS } from '@/types/subscription';
import { subscriptionService } from '@/services/subscriptionService';

export interface UpgradeModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback to close the modal */
  onClose: () => void;
  /** The recommended plan to highlight */
  recommendedPlan: SubscriptionPlan;
  /** Callback when upgrade button is clicked */
  onUpgrade?: () => void;
}

interface PlanFeatureRow {
  feature: string;
  starter: boolean | string;
  pro: boolean | string;
  business: boolean | string;
  enterprise: boolean | string;
}

const PLAN_FEATURES_COMPARISON: PlanFeatureRow[] = [
  { feature: 'Basic KPI Cards', starter: true, pro: true, business: true, enterprise: true },
  { feature: 'Recent Orders Table', starter: true, pro: true, business: true, enterprise: true },
  { feature: 'AI Risk Score Widget', starter: false, pro: true, business: true, enterprise: true },
  { feature: 'Operator Feedback Metrics', starter: false, pro: true, business: true, enterprise: true },
  { feature: 'Complaints Analytics', starter: false, pro: false, business: true, enterprise: true },
  { feature: 'Courier Performance', starter: false, pro: false, business: true, enterprise: true },
  { feature: 'Predictive Analytics', starter: false, pro: false, business: false, enterprise: true },
  { feature: 'Automation Recommendations', starter: false, pro: false, business: false, enterprise: true },
  { feature: 'Max Operators', starter: '5', pro: '20', business: '100', enterprise: 'Unlimited' },
  { feature: 'AI Calls/Month', starter: '100', pro: '500', business: '2,000', enterprise: 'Unlimited' },
];

const PLAN_PRICES: Record<SubscriptionPlan, string> = {
  starter: '29 TND',
  pro: '79 TND',
  business: '199 TND',
  enterprise: '499 TND',
};

/**
 * UpgradeModal - Displays plan comparison with upgrade options
 * 
 * Requirements:
 * - 5.3: Display plan comparison table
 * - 5.4: Navigate to subscription upgrade page with recommended plan pre-selected
 */
export function UpgradeModal({
  isOpen,
  onClose,
  recommendedPlan,
  onUpgrade,
}: UpgradeModalProps): JSX.Element | null {
  if (!isOpen) return null;

  const handleUpgrade = (plan: SubscriptionPlan) => {
    const upgradeUrl = subscriptionService.getUpgradeUrl(plan);
    if (onUpgrade) {
      onUpgrade();
    } else {
      window.location.href = upgradeUrl;
    }
  };

  const renderFeatureValue = (value: boolean | string) => {
    if (typeof value === 'boolean') {
      return value ? (
        <CheckIcon className="w-5 h-5 text-green-500 mx-auto" />
      ) : (
        <XMarkIcon className="w-5 h-5 text-slate-500 mx-auto" />
      );
    }
    return <span className="text-sm">{value}</span>;
  };

  return (
    <Fragment>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div
          className="relative w-full max-w-5xl bg-slate-900 dark:bg-slate-900 light:bg-white rounded-2xl shadow-2xl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="upgrade-modal-title"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-800 dark:border-slate-800 light:border-gray-200">
            <div>
              <h2
                id="upgrade-modal-title"
                className="text-2xl font-bold dark:text-white light:text-gray-900"
              >
                Upgrade Your Plan
              </h2>
              <p className="text-sm text-slate-400 dark:text-slate-400 light:text-gray-600 mt-1">
                Unlock more features and grow your business
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-800 light:hover:bg-gray-100 transition-colors"
              aria-label="Close modal"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Plan comparison table - Requirements 5.3 */}
          <div className="p-6 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left py-4 px-4 text-sm font-medium text-slate-400 dark:text-slate-400 light:text-gray-600">
                    Features
                  </th>
                  {ALL_PLANS.map((plan) => (
                    <th
                      key={plan}
                      className={`py-4 px-4 text-center ${
                        plan === recommendedPlan
                          ? 'bg-blue-500/10 rounded-t-xl'
                          : ''
                      }`}
                    >
                      <div className="flex flex-col items-center">
                        {plan === recommendedPlan && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 mb-2 text-xs font-medium bg-blue-500 text-white rounded-full">
                            <StarIcon className="w-3 h-3" />
                            Recommended
                          </span>
                        )}
                        <span className="text-lg font-semibold dark:text-white light:text-gray-900">
                          {getPlanDisplayName(plan)}
                        </span>
                        <span className="text-2xl font-bold text-blue-500 mt-1">
                          {PLAN_PRICES[plan]}
                          <span className="text-sm font-normal text-slate-400">/mo</span>
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PLAN_FEATURES_COMPARISON.map((row, index) => (
                  <tr
                    key={row.feature}
                    className={
                      index % 2 === 0
                        ? 'bg-slate-800/30 dark:bg-slate-800/30 light:bg-gray-50'
                        : ''
                    }
                  >
                    <td className="py-3 px-4 text-sm dark:text-slate-300 light:text-gray-700">
                      {row.feature}
                    </td>
                    {ALL_PLANS.map((plan) => (
                      <td
                        key={`${row.feature}-${plan}`}
                        className={`py-3 px-4 text-center ${
                          plan === recommendedPlan
                            ? 'bg-blue-500/10'
                            : ''
                        }`}
                      >
                        {renderFeatureValue(row[plan])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Upgrade buttons - Requirements 5.4 */}
          <div className="p-6 border-t border-slate-800 dark:border-slate-800 light:border-gray-200">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {ALL_PLANS.map((plan) => (
                <button
                  key={plan}
                  onClick={() => handleUpgrade(plan)}
                  className={`py-3 px-4 rounded-lg font-medium transition-colors ${
                    plan === recommendedPlan
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-slate-800 hover:bg-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 light:bg-gray-100 light:hover:bg-gray-200 dark:text-white light:text-gray-900'
                  }`}
                >
                  {plan === recommendedPlan ? 'Upgrade to ' : 'Select '}
                  {getPlanDisplayName(plan)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Fragment>
  );
}

export default UpgradeModal;
