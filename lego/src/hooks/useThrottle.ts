/**
 * Vue composable for throttling values and functions
 */
import { ref, watch, Ref } from 'vue';
import { throttle } from '../utils/performance';

/**
 * Throttle a reactive value
 * @param value - Reactive value to throttle
 * @param interval - Minimum interval between updates in milliseconds
 * @returns Throttled reactive value
 */
export function useThrottle<T>(value: Ref<T>, interval: number): Ref<T> {
  const throttledValue = ref(value.value) as Ref<T>;
  
  const updateValue = throttle((newValue: T) => {
    throttledValue.value = newValue;
  }, interval);
  
  watch(value, (newValue) => {
    updateValue(newValue);
  });
  
  return throttledValue;
}

/**
 * Create a throttled function
 * @param fn - Function to throttle
 * @param interval - Minimum interval between calls in milliseconds
 * @returns Throttled function
 */
export function useThrottleFn<T extends (...args: any[]) => any>(
  fn: T,
  interval: number
): T {
  return throttle(fn, interval);
}
