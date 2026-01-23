/**
 * Performance optimization utilities
 * Provides debounce and throttle functions for optimizing high-frequency operations
 */

/**
 * Debounce function - delays execution until after a specified delay has elapsed
 * since the last invocation
 * @param fn - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): T {
  let timeoutId: number | null = null;
  
  return ((...args: any[]) => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = window.setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delay);
  }) as T;
}

/**
 * Throttle function - ensures function is called at most once per specified interval
 * @param fn - Function to throttle
 * @param interval - Minimum interval between calls in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  interval: number
): T {
  let lastCallTime = 0;
  let timeoutId: number | null = null;
  
  return ((...args: any[]) => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallTime;
    
    if (timeSinceLastCall >= interval) {
      lastCallTime = now;
      fn(...args);
    } else {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
      
      timeoutId = window.setTimeout(() => {
        lastCallTime = Date.now();
        fn(...args);
        timeoutId = null;
      }, interval - timeSinceLastCall);
    }
  }) as T;
}
