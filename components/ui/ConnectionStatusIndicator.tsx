/**
 * Connection Status Indicator - Shows WebSocket connection state
 * Requirements: 7.3
 */

'use client';

import { useConnectionStatus } from '@/stores/orderStore';
import { ConnectionStatus } from '@/stores/orderStore';

/**
 * Props for ConnectionStatusIndicator
 */
export interface ConnectionStatusIndicatorProps {
  /** Show text label alongside indicator */
  showLabel?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Additional CSS classes */
  className?: string;
}

/**
 * Status configuration for each connection state
 */
interface StatusConfig {
  color: string;
  bgColor: string;
  pulseColor: string;
  label: string;
  animate: boolean;
}

/**
 * Get status configuration based on connection state
 */
function getStatusConfig(status: ConnectionStatus): StatusConfig {
  switch (status) {
    case 'connected':
      return {
        color: 'bg-green-500',
        bgColor: 'bg-green-500/20',
        pulseColor: 'bg-green-400',
        label: 'Connected',
        animate: false,
      };
    case 'reconnecting':
      return {
        color: 'bg-yellow-500',
        bgColor: 'bg-yellow-500/20',
        pulseColor: 'bg-yellow-400',
        label: 'Reconnecting...',
        animate: true,
      };
    case 'disconnected':
    default:
      return {
        color: 'bg-red-500',
        bgColor: 'bg-red-500/20',
        pulseColor: 'bg-red-400',
        label: 'Disconnected',
        animate: false,
      };
  }
}

/**
 * Get size classes based on size variant
 */
function getSizeClasses(size: 'sm' | 'md' | 'lg'): { dot: string; container: string; text: string } {
  switch (size) {
    case 'sm':
      return { dot: 'w-2 h-2', container: 'gap-1.5', text: 'text-xs' };
    case 'lg':
      return { dot: 'w-4 h-4', container: 'gap-3', text: 'text-base' };
    case 'md':
    default:
      return { dot: 'w-3 h-3', container: 'gap-2', text: 'text-sm' };
  }
}

/**
 * Connection Status Indicator Component
 * Displays the current WebSocket connection status with visual feedback
 * Requirements: 7.3 - Display connection status indicator and show reconnecting state
 */
export function ConnectionStatusIndicator({
  showLabel = false,
  size = 'md',
  className = '',
}: ConnectionStatusIndicatorProps) {
  const connectionStatus = useConnectionStatus();
  const config = getStatusConfig(connectionStatus);
  const sizeClasses = getSizeClasses(size);

  return (
    <div 
      className={`flex items-center ${sizeClasses.container} ${className}`}
      title={config.label}
      role="status"
      aria-label={`Connection status: ${config.label}`}
    >
      <div className="relative flex items-center justify-center">
        {/* Pulse animation for reconnecting state */}
        {config.animate && (
          <span 
            className={`absolute ${sizeClasses.dot} ${config.pulseColor} rounded-full animate-ping opacity-75`}
          />
        )}
        {/* Status dot */}
        <span 
          className={`relative ${sizeClasses.dot} ${config.color} rounded-full`}
        />
      </div>
      
      {showLabel && (
        <span className={`${sizeClasses.text} text-slate-400 dark:text-slate-400 light:text-gray-600`}>
          {config.label}
        </span>
      )}
    </div>
  );
}

/**
 * Compact connection indicator for header use
 */
export function HeaderConnectionIndicator() {
  const connectionStatus = useConnectionStatus();
  const config = getStatusConfig(connectionStatus);

  // Only show indicator when not connected (to avoid clutter when everything is fine)
  if (connectionStatus === 'connected') {
    return (
      <div 
        className="flex items-center gap-2 px-2 py-1 rounded-md"
        title="Real-time updates active"
      >
        <span className="w-2 h-2 bg-green-500 rounded-full" />
      </div>
    );
  }

  return (
    <div 
      className={`flex items-center gap-2 px-3 py-1.5 rounded-md ${config.bgColor}`}
      role="status"
      aria-label={`Connection status: ${config.label}`}
    >
      <div className="relative flex items-center justify-center">
        {config.animate && (
          <span className={`absolute w-2 h-2 ${config.pulseColor} rounded-full animate-ping opacity-75`} />
        )}
        <span className={`relative w-2 h-2 ${config.color} rounded-full`} />
      </div>
      <span className="text-xs font-medium text-slate-300 dark:text-slate-300 light:text-gray-700">
        {config.label}
      </span>
    </div>
  );
}

export default ConnectionStatusIndicator;
