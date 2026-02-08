'use client';

/**
 * MissionsWidget Component
 * Displays daily/weekly goals with progress bars for operators
 * Requirements: 7.2
 */

import { useState } from 'react';
import { TrophyIcon, CheckCircleIcon, ClockIcon, FireIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';
import WidgetContainer from '../WidgetContainer';

/**
 * Mission type definition
 */
export interface Mission {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  reward: number;
  rewardType?: 'cash' | 'points' | 'badge';
  type: 'daily' | 'weekly' | 'monthly';
  status?: 'active' | 'completed' | 'expired';
  expiresAt: string;
  completedAt?: string;
}

export interface MissionsWidgetProps {
  /** List of missions to display */
  missions: Mission[];
  /** Callback when a mission is completed */
  onMissionComplete?: (missionId: string) => void;
  /** Whether the widget is loading */
  isLoading?: boolean;
  /** Error message */
  error?: string;
  /** Retry callback */
  onRetry?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Calculate progress percentage for a mission
 * Property 7: Missions widget shows progress correctly
 * For any mission, the progress bar SHALL display current/target ratio as a percentage between 0 and 100.
 * 
 * @param current - Current progress value
 * @param target - Target value to reach
 * @returns Progress percentage clamped between 0 and 100
 */
export function calculateMissionProgress(current: number, target: number): number {
  if (target <= 0) return 0;
  const progress = (current / target) * 100;
  return Math.min(100, Math.max(0, progress));
}

/**
 * Get the type badge color based on mission type
 */
function getTypeBadgeColor(type: Mission['type']): string {
  switch (type) {
    case 'daily':
      return 'bg-blue-500/10 text-blue-500';
    case 'weekly':
      return 'bg-purple-500/10 text-purple-500';
    case 'monthly':
      return 'bg-amber-500/10 text-amber-500';
    default:
      return 'bg-slate-500/10 text-slate-400';
  }
}

/**
 * Get reward icon based on reward type
 */
function getRewardIcon(rewardType?: Mission['rewardType']): JSX.Element {
  switch (rewardType) {
    case 'badge':
      return <TrophyIcon className="w-4 h-4" />;
    case 'points':
      return <FireIcon className="w-4 h-4" />;
    default:
      return <span className="text-xs font-medium">$</span>;
  }
}

/**
 * Format time remaining until expiration
 */
function formatTimeRemaining(expiresAt: string): string {
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diffMs = expiry.getTime() - now.getTime();
  
  if (diffMs <= 0) return 'Expired';
  
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffDays > 0) return `${diffDays}d left`;
  if (diffHours > 0) return `${diffHours}h left`;
  return 'Expiring soon';
}

/**
 * Single mission card component
 */
function MissionCard({ 
  mission, 
  onComplete,
  showAnimation 
}: { 
  mission: Mission; 
  onComplete?: () => void;
  showAnimation: boolean;
}): JSX.Element {
  const progress = calculateMissionProgress(mission.current, mission.target);
  const isCompleted = mission.status === 'completed' || progress >= 100;
  const isExpired = mission.status === 'expired';
  
  return (
    <div 
      className={`p-4 rounded-lg border transition-all duration-300 ${
        isCompleted 
          ? 'bg-green-500/5 border-green-500/20' 
          : isExpired
            ? 'bg-slate-500/5 border-slate-500/20 opacity-60'
            : 'bg-slate-800/50 border-slate-700 dark:bg-slate-800/50 dark:border-slate-700 light:bg-gray-50 light:border-gray-200'
      } ${showAnimation && isCompleted ? 'animate-pulse' : ''}`}
      data-testid="mission-card"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${getTypeBadgeColor(mission.type)}`}>
              {mission.type}
            </span>
            {isCompleted && (
              <CheckCircleSolidIcon className="w-4 h-4 text-green-500" />
            )}
          </div>
          <h4 className="font-medium text-sm">{mission.title}</h4>
          <p className="text-xs text-slate-400 dark:text-slate-400 light:text-gray-500 mt-0.5">
            {mission.description}
          </p>
        </div>
        
        {/* Reward badge */}
        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/10 text-amber-500">
          {getRewardIcon(mission.rewardType)}
          <span className="text-xs font-medium">{mission.reward}</span>
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="mb-2">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-slate-400 dark:text-slate-400 light:text-gray-500">
            {mission.current} / {mission.target}
          </span>
          <span className="font-medium" data-testid="mission-progress-percent">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="h-2 bg-slate-700 dark:bg-slate-700 light:bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${
              isCompleted ? 'bg-green-500' : 'bg-blue-500'
            }`}
            style={{ width: `${progress}%` }}
            data-testid="mission-progress-bar"
          />
        </div>
      </div>
      
      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs text-slate-400">
          <ClockIcon className="w-3 h-3" />
          <span>{formatTimeRemaining(mission.expiresAt)}</span>
        </div>
        
        {isCompleted && !mission.completedAt && onComplete && (
          <button
            onClick={onComplete}
            className="text-xs font-medium text-green-500 hover:text-green-400 transition-colors"
          >
            Claim Reward
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Empty state when no missions available
 */
function EmptyState(): JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="mb-4 p-3 rounded-full bg-slate-500/10">
        <TrophyIcon className="w-8 h-8 text-slate-400" />
      </div>
      <p className="text-sm text-slate-400 dark:text-slate-400 light:text-gray-600">
        No active missions available
      </p>
      <p className="text-xs text-slate-500 mt-1">
        Check back later for new challenges
      </p>
    </div>
  );
}

/**
 * MissionsWidget - Displays operator missions with progress tracking
 * 
 * Features:
 * - Mission cards with progress bars
 * - Target, current, and reward display
 * - Completion animation
 * - Time remaining indicator
 * 
 * Requirements: 7.2 - Display missions widget showing daily and weekly goals with progress bars
 */
export function MissionsWidget({
  missions,
  onMissionComplete,
  isLoading = false,
  error,
  onRetry,
  className = '',
}: MissionsWidgetProps): JSX.Element {
  const [completedMissionId, setCompletedMissionId] = useState<string | null>(null);

  const handleMissionComplete = (missionId: string) => {
    setCompletedMissionId(missionId);
    
    // Trigger celebration animation
    setTimeout(() => {
      setCompletedMissionId(null);
      onMissionComplete?.(missionId);
    }, 1000);
  };

  // Sort missions: active first, then by type (daily, weekly, monthly)
  const sortedMissions = [...missions].sort((a, b) => {
    // Completed/expired missions go to the end
    if (a.status === 'completed' && b.status !== 'completed') return 1;
    if (a.status !== 'completed' && b.status === 'completed') return -1;
    if (a.status === 'expired' && b.status !== 'expired') return 1;
    if (a.status !== 'expired' && b.status === 'expired') return -1;
    
    // Sort by type priority
    const typePriority = { daily: 0, weekly: 1, monthly: 2 };
    return typePriority[a.type] - typePriority[b.type];
  });

  return (
    <WidgetContainer
      title="Missions"
      icon={<TrophyIcon className="w-5 h-5" />}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      className={className}
    >
      {sortedMissions.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-3" data-testid="missions-list">
          {sortedMissions.map((mission) => (
            <MissionCard
              key={mission.id}
              mission={mission}
              onComplete={() => handleMissionComplete(mission.id)}
              showAnimation={completedMissionId === mission.id}
            />
          ))}
        </div>
      )}
    </WidgetContainer>
  );
}

export default MissionsWidget;
