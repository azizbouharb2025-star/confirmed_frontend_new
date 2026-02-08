'use client';

/**
 * AnimatedValue Component
 * Animates numeric value changes with smooth transitions
 * Requirements: 6.4
 */

import { motion } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';

export interface AnimatedValueProps {
  /** The current value to display */
  value: number;
  /** Prefix for the value (e.g., '$') */
  prefix?: string;
  /** Suffix for the value (e.g., '%') */
  suffix?: string;
  /** Number of decimal places */
  decimals?: number;
  /** Duration of the animation in seconds */
  duration?: number;
  /** CSS class name for styling */
  className?: string;
  /** Format number with thousand separators */
  formatNumber?: boolean;
}

/**
 * Format a number with thousand separators
 */
function formatWithSeparators(value: number, decimals: number): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * AnimatedValue - Smoothly animates between numeric values
 * 
 * Features:
 * - Smooth counting animation between values
 * - Flash highlight on value change
 * - Configurable duration and formatting
 * 
 * Requirements: 6.4 - Animate metric value changes
 */
export default function AnimatedValue({
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  duration = 0.5,
  className = '',
  formatNumber = true,
}: AnimatedValueProps): JSX.Element {
  const [displayValue, setDisplayValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);
  const previousValueRef = useRef(value);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const previousValue = previousValueRef.current;
    
    // Skip animation if value hasn't changed
    if (previousValue === value) {
      return;
    }

    setIsAnimating(true);
    previousValueRef.current = value;

    const startTime = performance.now();
    const startValue = displayValue;
    const endValue = value;
    const durationMs = duration * 1000;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      
      // Ease out cubic for smooth deceleration
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      
      const currentValue = startValue + (endValue - startValue) * easeProgress;
      setDisplayValue(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(endValue);
        setIsAnimating(false);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const formattedValue = formatNumber
    ? formatWithSeparators(displayValue, decimals)
    : displayValue.toFixed(decimals);

  return (
    <motion.span
      className={className}
      animate={{
        scale: isAnimating ? [1, 1.02, 1] : 1,
        color: isAnimating ? ['inherit', 'var(--highlight-color, #22c55e)', 'inherit'] : 'inherit',
      }}
      transition={{ duration: 0.3 }}
      data-testid="animated-value"
    >
      {prefix}
      {formattedValue}
      {suffix}
    </motion.span>
  );
}

export { AnimatedValue };
