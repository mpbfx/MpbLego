/**
 * Unit tests for performance utilities
 */
import { debounce, throttle } from '@/utils/performance';

describe('Performance Utilities', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('debounce', () => {
    it('should delay function execution', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 300);

      debouncedFn('test');
      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(300);
      expect(mockFn).toHaveBeenCalledWith('test');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should cancel previous calls when invoked multiple times', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 300);

      debouncedFn('first');
      jest.advanceTimersByTime(100);
      debouncedFn('second');
      jest.advanceTimersByTime(100);
      debouncedFn('third');
      jest.advanceTimersByTime(300);

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('third');
    });

    it('should handle multiple arguments', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 300);

      debouncedFn('arg1', 'arg2', 'arg3');
      jest.advanceTimersByTime(300);

      expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2', 'arg3');
    });
  });

  describe('throttle', () => {
    it('should execute function immediately on first call', () => {
      const mockFn = jest.fn();
      const throttledFn = throttle(mockFn, 300);

      throttledFn('test');
      expect(mockFn).toHaveBeenCalledWith('test');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should limit function calls to once per interval', () => {
      const mockFn = jest.fn();
      const throttledFn = throttle(mockFn, 300);

      throttledFn('first');
      expect(mockFn).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(100);
      throttledFn('second');
      expect(mockFn).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(300);
      expect(mockFn).toHaveBeenCalledTimes(2);
      expect(mockFn).toHaveBeenLastCalledWith('second');
    });

    it('should handle rapid successive calls', () => {
      const mockFn = jest.fn();
      const throttledFn = throttle(mockFn, 300);

      throttledFn('call1');
      throttledFn('call2');
      throttledFn('call3');

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('call1');

      jest.advanceTimersByTime(300);
      expect(mockFn).toHaveBeenCalledTimes(2);
      expect(mockFn).toHaveBeenLastCalledWith('call3');
    });
  });
});
