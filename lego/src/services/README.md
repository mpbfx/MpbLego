# Services

This directory contains service classes for managing application-wide concerns.

## LayoutManager

Manages panel layout preferences and persistence using localStorage.

**Features:**
- Save and load layout preferences
- Reset to default layout
- Update specific preferences
- Automatic validation of stored data

**Usage:**
```typescript
import { layoutManager } from '@/services/LayoutManager';

// Get current preferences
const prefs = layoutManager.getPreferences();

// Update preferences
layoutManager.updatePreferences({
  leftPanelWidth: 350,
  rightPanelCollapsed: true
});

// Reset to defaults
layoutManager.resetToDefault();
```

**Preferences Interface:**
```typescript
interface LayoutPreferences {
  leftPanelWidth: number;      // Width of left panel (200-400px)
  rightPanelWidth: number;     // Width of right panel (200-400px)
  rightPanelCollapsed: boolean; // Whether right panel is collapsed
  theme: 'light' | 'dark';     // Current theme
}
```

## ThemeManager

Manages theme switching and CSS variable application.

**Features:**
- Switch between light and dark themes
- Apply CSS variables to document
- Persist theme preference
- Toggle theme with single method

**Usage:**
```typescript
import { themeManager } from '@/services/ThemeManager';

// Switch to dark theme
themeManager.switchTheme('dark');

// Toggle between themes
themeManager.toggleTheme();

// Get current theme
const currentTheme = themeManager.getCurrentTheme();

// Get theme colors
const colors = themeManager.getThemeColors('dark');
```

**CSS Variables:**
The ThemeManager applies the following CSS variables:
- `--theme-primary`: Primary color
- `--theme-background`: Background color
- `--theme-surface`: Surface color (panels, cards)
- `--theme-text`: Text color
- `--theme-border`: Border color
- `--theme-textSecondary`: Secondary text color
- `--theme-hover`: Hover state color
- `--theme-active`: Active state color

**Using in Components:**
```vue
<template>
  <div class="panel" :style="{ backgroundColor: 'var(--theme-surface)' }">
    <h2 :style="{ color: 'var(--theme-text)' }">Panel Title</h2>
  </div>
</template>

<style scoped>
.panel {
  border: 1px solid var(--theme-border);
}
</style>
```
