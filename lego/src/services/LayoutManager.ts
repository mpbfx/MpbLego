/**
 * Layout Manager Service
 * Manages panel layout preferences and persistence
 */

export interface LayoutPreferences {
  leftPanelWidth: number;
  rightPanelWidth: number;
  rightPanelCollapsed: boolean;
  theme: 'light' | 'dark';
}

const DEFAULT_PREFERENCES: LayoutPreferences = {
  leftPanelWidth: 300,
  rightPanelWidth: 300,
  rightPanelCollapsed: false,
  theme: 'light'
};

const STORAGE_KEY = 'lego-editor-layout-preferences';

export class LayoutManager {
  /**
   * Save layout preferences to localStorage
   * @param prefs - Layout preferences to save
   */
  savePreferences(prefs: LayoutPreferences): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch (error) {
      console.warn('Failed to save layout preferences:', error);
    }
  }

  /**
   * Load layout preferences from localStorage
   * @returns Saved preferences or null if not found
   */
  loadPreferences(): LayoutPreferences | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Validate the loaded preferences
        if (this.isValidPreferences(parsed)) {
          return parsed;
        }
      }
    } catch (error) {
      console.warn('Failed to load layout preferences:', error);
    }
    return null;
  }

  /**
   * Reset to default layout preferences
   * @returns Default preferences
   */
  resetToDefault(): LayoutPreferences {
    const defaults = { ...DEFAULT_PREFERENCES };
    this.savePreferences(defaults);
    return defaults;
  }

  /**
   * Update specific preference values
   * @param updates - Partial preferences to update
   * @returns Updated preferences
   */
  updatePreferences(updates: Partial<LayoutPreferences>): LayoutPreferences {
    const current = this.loadPreferences() || DEFAULT_PREFERENCES;
    const updated = { ...current, ...updates };
    this.savePreferences(updated);
    return updated;
  }

  /**
   * Get current preferences or defaults
   * @returns Current preferences
   */
  getPreferences(): LayoutPreferences {
    return this.loadPreferences() || { ...DEFAULT_PREFERENCES };
  }

  /**
   * Validate preferences object
   * @param prefs - Preferences to validate
   * @returns True if valid
   */
  private isValidPreferences(prefs: any): prefs is LayoutPreferences {
    return (
      typeof prefs === 'object' &&
      typeof prefs.leftPanelWidth === 'number' &&
      typeof prefs.rightPanelWidth === 'number' &&
      typeof prefs.rightPanelCollapsed === 'boolean' &&
      (prefs.theme === 'light' || prefs.theme === 'dark')
    );
  }
}

// Export singleton instance
export const layoutManager = new LayoutManager();
