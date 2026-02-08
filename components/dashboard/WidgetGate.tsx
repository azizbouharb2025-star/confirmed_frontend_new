'use client';

/**
 * WidgetGate Component
 * Feature gating wrapper that controls widget visibility based on subscription plan
 * Requirements: 2.4, 3.4, 4.4, 5.1
 */

import { ReactNode } from 'react';
import { SubscriptionPlan, canAccessPlan } from '@/types/subscription';
import LockedWidget from './LockedWidget';

export interface WidgetGateProps {
  /** The minimum subscription plan required to access this widget */
  requiredPlan: SubscriptionPlan;
  /** The user's current subscription plan */
  currentPlan: SubscriptionPlan;
  /** Display name of the feature being gated */
  featureName: string;
  /** Description of what the feature provides */
  featureDescription: string;
  /** The widget content to render if access is granted */
  children: ReactNode;
  /** Optional callback when upgrade is clicked */
  onUpgradeClick?: () => void;
}

/**
 * WidgetGate - Controls widget visibility based on subscription tier
 * 
 * Renders children if the user's plan has access to the required plan level.
 * Otherwise renders a LockedWidget component with upgrade prompt.
 * 
 * @example
 * <WidgetGate
 *   requiredPlan="pro"
 *   currentPlan={userPlan}
 *   featureName="AI Risk Score"
 *   featureDescription="View order risk distribution by AI confidence level"
 * >
 *   <RiskScoreWidget data={riskData} />
 * </WidgetGate>
 */
export function WidgetGate({
  requiredPlan,
  currentPlan,
  featureName,
  featureDescription,
  children,
  onUpgradeClick,
}: WidgetGateProps): JSX.Element {
  // Check if user's plan has access to the required plan level
  const hasAccess = canAccessPlan(currentPlan, requiredPlan);

  if (hasAccess) {
    // User has access - render the widget content
    return <>{children}</>;
  }

  // User doesn't have access - render locked state with upgrade prompt
  return (
    <LockedWidget
      featureName={featureName}
      featureDescription={featureDescription}
      requiredPlan={requiredPlan}
      onUpgradeClick={onUpgradeClick}
    />
  );
}

export default WidgetGate;
