/**
 * Vue composable for debouncing values and functions
 */
import { ref, watch, Ref } from 'vue';
import { debounce } from '../utils/performance';

/**
 * Debounce a reactive value
 * @param value - Reactive value to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced reactive value
 */
export function useDebounce<T>(value: Ref<T>, delay: number): Ref<T> {
  const debouncedValue = ref(value.value) as Ref<T>;
  
  const updateValue = debounce((newValue: T) => {
    debouncedValue.value = newValue;
  }, delay);
  
  watch(value, (newValue) => {
    updateValue(newValue);
  });
  
  return debouncedValue;
}

/**
 * Create a debounced function
 * @param fn - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 */
export function useDebounceFn<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): T {
  return debounce(fn, delay);
}
