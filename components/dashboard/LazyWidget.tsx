'use client';

/**
 * LazyWidget Component
 * Lazy loads widgets when they enter the viewport using Intersection Observer
 * Requirements: 9.4, 9.5
 * 
 * - Uses Intersection Observer for off-screen widgets
 * - Supports dynamic imports for chart libraries
 * - Shows loading placeholders for lazy widgets
 */

import { ReactNode, useEffect, useRef, useState, Suspense, ComponentType } from 'react';

export interface LazyWidgetProps {
  /** Widget content to render when visible */
  children: ReactNode;
  /** Optional placeholder to show while loading */
  placeholder?: ReactNode;
  /** Root margin for intersection observer (default: '100px') */
  rootMargin?: string;
  /** Threshold for intersection observer (default: 0) */
  threshold?: number;
  /** Additional CSS classes */
  className?: string;
  /** Minimum height for the placeholder (default: '200px') */
  minHeight?: string;
}

/**
 * Default loading placeholder with skeleton animation
 * Requirements: 9.5 - Add loading placeholders for lazy widgets
 */
export function LazyWidgetPlaceholder({ 
  minHeight = '200px' 
}: { 
  minHeight?: string 
}): JSX.Element {
  return (
    <div 
      className="card p-4 sm:p-6 animate-pulse"
      style={{ minHeight }}
      data-testid="lazy-widget-placeholder"
    >
      <div className="space-y-4">
        {/* Header skeleton */}
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-slate-700 dark:bg-slate-700 light:bg-gray-200 rounded" />
          <div className="h-4 bg-slate-700 dark:bg-slate-700 light:bg-gray-200 rounded w-32" />
        </div>
        {/* Content skeleton */}
        <div className="h-32 bg-slate-700 dark:bg-slate-700 light:bg-gray-200 rounded" />
        <div className="h-4 bg-slate-700 dark:bg-slate-700 light:bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-slate-700 dark:bg-slate-700 light:bg-gray-200 rounded w-1/2" />
      </div>
    </div>
  );
}

/**
 * LazyWidget - Lazy loads content when it enters the viewport
 * 
 * Uses Intersection Observer API to detect when the widget
 * enters the viewport and only renders the content then.
 * 
 * Requirements:
 * - 9.4: Lazy-load chart libraries to optimize initial page load
 * - 9.5: Lazy-load off-screen widgets to improve performance
 * 
 * @example
 * <LazyWidget>
 *   <RiskScoreWidget data={data} />
 * </LazyWidget>
 */
export function LazyWidget({
  children,
  placeholder,
  rootMargin = '100px',
  threshold = 0,
  className = '',
  minHeight = '200px',
}: LazyWidgetProps): JSX.Element {
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    // Check if IntersectionObserver is supported
    if (!('IntersectionObserver' in window)) {
      // Fallback: render immediately if IntersectionObserver not supported
      setIsVisible(true);
      setHasBeenVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            setHasBeenVisible(true);
          } else {
            setIsVisible(false);
          }
        });
      },
      {
        rootMargin,
        threshold,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [rootMargin, threshold]);

  // Once visible, keep the content rendered (don't unmount on scroll away)
  const shouldRender = hasBeenVisible;

  return (
    <div 
      ref={containerRef} 
      className={className}
      data-testid="lazy-widget-container"
      data-visible={isVisible}
    >
      {shouldRender ? (
        <Suspense fallback={placeholder || <LazyWidgetPlaceholder minHeight={minHeight} />}>
          {children}
        </Suspense>
      ) : (
        placeholder || <LazyWidgetPlaceholder minHeight={minHeight} />
      )}
    </div>
  );
}

/**
 * Higher-order component for creating lazy-loaded widget components
 * Useful for widgets that use heavy chart libraries
 * 
 * Requirements: 9.4 - Lazy load chart libraries with dynamic imports
 * 
 * @example
 * const LazyRiskScoreWidget = createLazyWidget(
 *   () => import('./widgets/RiskScoreWidget')
 * );
 */
export function createLazyWidget<P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>
): ComponentType<P & { lazyProps?: Omit<LazyWidgetProps, 'children'> }> {
  const LazyComponent = (props: P & { lazyProps?: Omit<LazyWidgetProps, 'children'> }) => {
    const { lazyProps, ...componentProps } = props;
    const [Component, setComponent] = useState<ComponentType<P> | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Intersection Observer to detect visibility
    useEffect(() => {
      const element = containerRef.current;
      if (!element) return;

      if (!('IntersectionObserver' in window)) {
        setIsVisible(true);
        return;
      }

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setIsVisible(true);
              observer.disconnect();
            }
          });
        },
        {
          rootMargin: lazyProps?.rootMargin || '100px',
          threshold: lazyProps?.threshold || 0,
        }
      );

      observer.observe(element);

      return () => {
        observer.disconnect();
      };
    }, [lazyProps?.rootMargin, lazyProps?.threshold]);

    // Load component when visible
    useEffect(() => {
      if (isVisible && !Component) {
        importFn().then((module) => {
          setComponent(() => module.default);
        });
      }
    }, [isVisible, Component]);

    return (
      <div 
        ref={containerRef}
        className={lazyProps?.className}
        data-testid="lazy-widget-hoc-container"
      >
        {Component ? (
          <Component {...(componentProps as P)} />
        ) : (
          lazyProps?.placeholder || <LazyWidgetPlaceholder minHeight={lazyProps?.minHeight} />
        )}
      </div>
    );
  };

  return LazyComponent;
}

export default LazyWidget;
