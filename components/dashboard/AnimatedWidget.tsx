'use client';

/**
 * AnimatedWidget Component
 * Wrapper that adds fade transitions for widget updates
 * Requirements: 6.4
 */

import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode, useEffect, useState, useRef } from 'react';

export interface AnimatedWidgetProps {
  /** Child content to render */
  children: ReactNode;
  /** Key to trigger re-animation (e.g., data version or timestamp) */
  animationKey?: string | number;
  /** Duration of fade animation in seconds */
  duration?: number;
  /** Whether to animate on initial mount */
  animateOnMount?: boolean;
  /** CSS class name for the wrapper */
  className?: string;
}

/**
 * AnimatedWidget - Adds smooth fade transitions when widget content updates
 * 
 * Features:
 * - Fade in/out transitions on content change
 * - Configurable animation duration
 * - Optional mount animation
 * 
 * Requirements: 6.4 - Add fade transitions for widget updates
 */
export default function AnimatedWidget({
  children,
  animationKey,
  duration = 0.3,
  animateOnMount = true,
  className = '',
}: AnimatedWidgetProps): JSX.Element {
  const [isFirstRender, setIsFirstRender] = useState(true);
  const previousKeyRef = useRef(animationKey);

  useEffect(() => {
    setIsFirstRender(false);
  }, []);

  // Determine if we should animate
  const shouldAnimate = animateOnMount || !isFirstRender;

  useEffect(() => {
    previousKeyRef.current = animationKey;
  }, [animationKey]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={animationKey}
        initial={shouldAnimate ? { opacity: 0, y: 10 } : false}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{
          duration,
          ease: 'easeOut',
        }}
        className={className}
        data-testid="animated-widget"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Hook to generate animation keys based on data changes
 * Useful for triggering widget re-animation when data updates
 */
export function useAnimationKey(data: unknown): string {
  const [key, setKey] = useState(() => Date.now().toString());
  const previousDataRef = useRef<string>('');

  useEffect(() => {
    const dataString = JSON.stringify(data);
    if (dataString !== previousDataRef.current) {
      previousDataRef.current = dataString;
      setKey(Date.now().toString());
    }
  }, [data]);

  return key;
}

export { AnimatedWidget };
