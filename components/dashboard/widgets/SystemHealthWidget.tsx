'use client';

/**
 * SystemHealthWidget Component
 * Displays service health status indicators with latency metrics
 * Requirements: 8.4
 * 
 * Feature: subscription-tiered-dashboards, Property 10: System health shows all services
 * Validates: Requirements 8.4
 */

import { ServerIcon, CheckCircleIcon, ExclamationCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import WidgetContainer from '../WidgetContainer';
import { useLanguage } from '@/hooks/useLanguage';
import type { TranslationKey } from '@/lib/i18n';

export type ServiceStatus = 'healthy' | 'degraded' | 'down';

export interface ServiceHealth {
  name: string;
  status: ServiceStatus;
  latency?: number;
  lastCheck: string;
}

export interface SystemHealthWidgetProps {
  /** Array of service health data */
  services: ServiceHealth[];
  /** Whether the widget is loading */
  isLoading?: boolean;
  /** Error message if data fetch failed */
  error?: string;
  /** Callback when retry is clicked */
  onRetry?: () => void;
  /** Optional class name for styling */
  className?: string;
}

/**
 * Required services that must be displayed
 * Property 10: System health shows all services (API, database, queue)
 */
export const REQUIRED_SERVICES = ['API', 'Database', 'Queue'];

/**
 * Check if all required services are present in the services array
 * Property 10: System health shows all services
 */
export function hasAllRequiredServices(services: ServiceHealth[]): boolean {
  const serviceNames = services.map(s => s.name.toLowerCase());
  return REQUIRED_SERVICES.every(required => 
    serviceNames.some(name => name.includes(required.toLowerCase()))
  );
}

/**
 * Get status icon based on service status
 */
function getStatusIcon(status: ServiceStatus): JSX.Element {
  switch (status) {
    case 'healthy':
      return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
    case 'degraded':
      return <ExclamationCircleIcon className="w-5 h-5 text-yellow-500" />;
    case 'down':
      return <XCircleIcon className="w-5 h-5 text-red-500" />;
  }
}


/**
 * Get status color class based on service status
 */
function getStatusColorClass(status: ServiceStatus): string {
  switch (status) {
    case 'healthy':
      return 'bg-green-500/10 border-green-500/20';
    case 'degraded':
      return 'bg-yellow-500/10 border-yellow-500/20';
    case 'down':
      return 'bg-red-500/10 border-red-500/20';
  }
}

/**
 * Get status text color class
 */
function getStatusTextColor(status: ServiceStatus): string {
  switch (status) {
    case 'healthy':
      return 'text-green-500';
    case 'degraded':
      return 'text-yellow-500';
    case 'down':
      return 'text-red-500';
  }
}

/**
 * Get latency color based on value
 */
function getLatencyColor(latency: number): string {
  if (latency < 100) return 'text-green-400';
  if (latency < 500) return 'text-yellow-400';
  return 'text-red-400';
}

/**
 * Format timestamp to relative time
 */
function formatLastCheck(timestamp: string, t: (key: TranslationKey) => string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  
  if (diffSecs < 60) return `${diffSecs}${t('widget.time.sAgo')}`;
  if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)}${t('widget.time.mAgo')}`;
  return `${Math.floor(diffSecs / 3600)}${t('widget.time.hAgo')}`;
}

/**
 * Empty state when no data is available
 */
function EmptyState({ t }: { t: (key: TranslationKey) => string }): JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="mb-4 p-3 rounded-full bg-slate-500/10">
        <ServerIcon className="w-8 h-8 text-slate-400" />
      </div>
      <p className="text-sm text-slate-400 dark:text-slate-400 light:text-gray-600">
        {t('widget.systemHealth.empty')}
      </p>
    </div>
  );
}

/**
 * Overall system status summary
 */
function SystemStatusSummary({ services, t }: { services: ServiceHealth[]; t: (key: TranslationKey) => string }): JSX.Element {
  const healthyCount = services.filter(s => s.status === 'healthy').length;
  const degradedCount = services.filter(s => s.status === 'degraded').length;
  const downCount = services.filter(s => s.status === 'down').length;
  
  let overallStatus: ServiceStatus = 'healthy';
  let statusText = t('widget.systemHealth.allOperational');
  
  if (downCount > 0) {
    overallStatus = 'down';
    statusText = `${downCount} ${t('widget.systemHealth.servicesDown')}`;
  } else if (degradedCount > 0) {
    overallStatus = 'degraded';
    statusText = `${degradedCount} ${t('widget.systemHealth.servicesDegraded')}`;
  }
  
  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border ${getStatusColorClass(overallStatus)}`}>
      {getStatusIcon(overallStatus)}
      <div className="flex-1">
        <p className={`text-sm font-medium ${getStatusTextColor(overallStatus)}`}>
          {statusText}
        </p>
        <p className="text-xs text-slate-400">
          {healthyCount}/{services.length} {t('widget.systemHealth.servicesHealthy')}
        </p>
      </div>
    </div>
  );
}


/**
 * SystemHealthWidget - Displays service health status
 * 
 * Shows:
 * - Overall system status summary
 * - Individual service status indicators
 * - Latency metrics for each service
 * - Color coded: green (healthy), yellow (degraded), red (down)
 * 
 * Requirements: 8.4 - Display system health indicators for API, database, and queue services
 */
export function SystemHealthWidget({
  services,
  isLoading = false,
  error,
  onRetry,
  className = '',
}: SystemHealthWidgetProps): JSX.Element {
  const hasData = services.length > 0;
  const { t } = useLanguage();

  return (
    <WidgetContainer
      title={t('widget.systemHealth')}
      icon={<ServerIcon className="w-5 h-5" />}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      className={className}
    >
      {!hasData ? (
        <EmptyState t={t} />
      ) : (
        <div className="space-y-4" data-testid="system-health-content">
          {/* Overall status summary */}
          <SystemStatusSummary services={services} t={t} />
          
          {/* Individual service status */}
          <div className="space-y-2" data-testid="service-list">
            {services.map((service) => (
              <div
                key={service.name}
                className={`flex items-center justify-between p-3 rounded-lg border ${getStatusColorClass(service.status)}`}
                data-testid={`service-${service.name.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(service.status)}
                  <div>
                    <p className="text-sm font-medium">{service.name}</p>
                    <p className="text-xs text-slate-400">
                      {t('widget.systemHealth.lastCheck')}: {formatLastCheck(service.lastCheck, t)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold capitalize ${getStatusTextColor(service.status)}`}>
                    {t(`widget.status.${service.status}` as TranslationKey)}
                  </p>
                  {service.latency !== undefined && (
                    <p className={`text-xs ${getLatencyColor(service.latency)}`}>
                      {service.latency}ms
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </WidgetContainer>
  );
}

export default SystemHealthWidget;
