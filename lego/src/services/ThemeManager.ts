/**
 * Theme Manager Service
 * Manages theme switching and CSS variable application
 */

export type Theme = 'light' | 'dark';

export interface ThemeColors {
  primary: string;
  background: string;
  surface: string;
  text: string;
  border: string;
  textSecondary: string;
  hover: string;
  active: string;
}

const THEMES: Record<Theme, ThemeColors> = {
  light: {
    primary: '#1890ff',
    background: '#ffffff',
    surface: '#f0f2f5',
    text: '#000000',
    border: '#d9d9d9',
    textSecondary: '#595959',
    hover: '#e6f7ff',
    active: '#096dd9'
  },
  dark: {
    primary: '#177ddc',
    background: '#141414',
    surface: '#1f1f1f',
    text: '#ffffff',
    border: '#434343',
    textSecondary: '#a6a6a6',
    hover: '#262626',
    active: '#1890ff'
  }
};

const STORAGE_KEY = 'lego-editor-theme';

export class ThemeManager {
  private currentTheme: Theme;

  constructor() {
    this.currentTheme = this.loadTheme();
    this.applyTheme(this.currentTheme);
  }

  /**
   * Switch to a different theme
   * @param theme - Theme to switch to
   */
  switchTheme(theme: Theme): void {
    this.currentTheme = theme;
    this.applyTheme(theme);
    this.saveTheme(theme);
  }

  /**
   * Get the current theme
   * @returns Current theme
   */
  getCurrentTheme(): Theme {
    return this.currentTheme;
  }

  /**
   * Toggle between light and dark themes
   */
  toggleTheme(): void {
    const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.switchTheme(newTheme);
  }

  /**
   * Apply theme CSS variables to the document
   * @param theme - Theme to apply
   */
  applyTheme(theme: Theme): void {
    const colors = THEMES[theme];
    const root = document.documentElement;

    // Apply CSS variables
    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(`--theme-${key}`, value);
    });

    // Add theme class to body for additional styling
    document.body.classList.remove('theme-light', 'theme-dark');
    document.body.classList.add(`theme-${theme}`);
  }

  /**
   * Get colors for a specific theme
   * @param theme - Theme to get colors for
   * @returns Theme colors
   */
  getThemeColors(theme: Theme): ThemeColors {
    return { ...THEMES[theme] };
  }

  /**
   * Save theme preference to localStorage
   * @param theme - Theme to save
   */
  private saveTheme(theme: Theme): void {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (error) {
      console.warn('Failed to save theme preference:', error);
    }
  }

  /**
   * Load theme preference from localStorage
   * @returns Saved theme or default 'light'
   */
  private loadTheme(): Theme {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'light' || stored === 'dark') {
        return stored;
      }
    } catch (error) {
      console.warn('Failed to load theme preference:', error);
    }
    return 'light';
  }
}

// Export singleton instance
export const themeManager = new ThemeManager();
