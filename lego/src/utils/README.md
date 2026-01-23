# Utility Functions

This directory contains utility functions for the Lego editor.

## Performance Utilities

Located in `performance.ts`, these utilities help optimize high-frequency operations.

### debounce

Delays function execution until after a specified delay has elapsed since the last invocation.

**Usage:**
```typescript
import { debounce } from '@/utils/performance';

const handleInput = debounce((value: string) => {
  console.log('Input value:', value);
}, 300);

// Will only execute once after 300ms of no calls
handleInput('a');
handleInput('ab');
handleInput('abc'); // Only this will execute after 300ms
```

### throttle

Ensures a function is called at most once per specified interval.

**Usage:**
```typescript
import { throttle } from '@/utils/performance';

const handleScroll = throttle(() => {
  console.log('Scroll position:', window.scrollY);
}, 100);

window.addEventListener('scroll', handleScroll);
// Will execute at most once every 100ms
```

## Vue Composables

### useDebounce / useDebounceFn

Vue composables for debouncing reactive values and functions.

**Usage:**
```typescript
import { ref } from 'vue';
import { useDebounce, useDebounceFn } from '@/hooks/useDebounce';

// Debounce a reactive value
const searchQuery = ref('');
const debouncedQuery = useDebounce(searchQuery, 300);

// Debounce a function
const saveData = useDebounceFn((data: any) => {
  // Save logic
}, 500);
```

### useThrottle / useThrottleFn

Vue composables for throttling reactive values and functions.

**Usage:**
```typescript
import { ref } from 'vue';
import { useThrottle, useThrottleFn } from '@/hooks/useThrottle';

// Throttle a reactive value
const scrollPosition = ref(0);
const throttledPosition = useThrottle(scrollPosition, 100);

// Throttle a function
const updatePosition = useThrottleFn((pos: number) => {
  // Update logic
}, 100);
```
