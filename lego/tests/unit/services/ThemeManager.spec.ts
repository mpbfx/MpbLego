/**
 * Unit tests for ThemeManager service
 */
import { ThemeManager, Theme } from '@/services/ThemeManager';

describe('ThemeManager', () => {
  let themeManager: ThemeManager;

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.style.cssText = '';
    document.body.className = '';
    themeManager = new ThemeManager();
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.style.cssText = '';
    document.body.className = '';
  });

  describe('constructor', () => {
    it('should initialize with light theme by default', () => {
      expect(themeManager.getCurrentTheme()).toBe('light');
    });

    it('should load saved theme from localStorage', () => {
      localStorage.setItem('lego-editor-theme', 'dark');
      const newManager = new ThemeManager();
      expect(newManager.getCurrentTheme()).toBe('dark');
    });
  });

  describe('switchTheme', () => {
    it('should switch to dark theme', () => {
      themeManager.switchTheme('dark');
      expect(themeManager.getCurrentTheme()).toBe('dark');
    });

    it('should apply CSS variables when switching theme', () => {
      themeManager.switchTheme('dark');
      const root = document.documentElement;
      expect(root.style.getPropertyValue('--theme-primary')).toBe('#177ddc');
      expect(root.style.getPropertyValue('--theme-background')).toBe('#141414');
    });

    it('should add theme class to body', () => {
      themeManager.switchTheme('dark');
      expect(document.body.classList.contains('theme-dark')).toBe(true);
      expect(document.body.classList.contains('theme-light')).toBe(false);
    });

    it('should save theme to localStorage', () => {
      themeManager.switchTheme('dark');
      expect(localStorage.getItem('lego-editor-theme')).toBe('dark');
    });
  });

  describe('toggleTheme', () => {
    it('should toggle from light to dark', () => {
      expect(themeManager.getCurrentTheme()).toBe('light');
      themeManager.toggleTheme();
      expect(themeManager.getCurrentTheme()).toBe('dark');
    });

    it('should toggle from dark to light', () => {
      themeManager.switchTheme('dark');
      themeManager.toggleTheme();
      expect(themeManager.getCurrentTheme()).toBe('light');
    });
  });

  describe('applyTheme', () => {
    it('should apply light theme CSS variables', () => {
      themeManager.applyTheme('light');
      const root = document.documentElement;
      expect(root.style.getPropertyValue('--theme-primary')).toBe('#1890ff');
      expect(root.style.getPropertyValue('--theme-background')).toBe('#ffffff');
      expect(root.style.getPropertyValue('--theme-text')).toBe('#000000');
    });

    it('should apply dark theme CSS variables', () => {
      themeManager.applyTheme('dark');
      const root = document.documentElement;
      expect(root.style.getPropertyValue('--theme-primary')).toBe('#177ddc');
      expect(root.style.getPropertyValue('--theme-background')).toBe('#141414');
      expect(root.style.getPropertyValue('--theme-text')).toBe('#ffffff');
    });

    it('should update body class', () => {
      themeManager.applyTheme('light');
      expect(document.body.classList.contains('theme-light')).toBe(true);
      
      themeManager.applyTheme('dark');
      expect(document.body.classList.contains('theme-dark')).toBe(true);
      expect(document.body.classList.contains('theme-light')).toBe(false);
    });
  });

  describe('getThemeColors', () => {
    it('should return light theme colors', () => {
      const colors = themeManager.getThemeColors('light');
      expect(colors.primary).toBe('#1890ff');
      expect(colors.background).toBe('#ffffff');
    });

    it('should return dark theme colors', () => {
      const colors = themeManager.getThemeColors('dark');
      expect(colors.primary).toBe('#177ddc');
      expect(colors.background).toBe('#141414');
    });

    it('should return a copy of colors object', () => {
      const colors1 = themeManager.getThemeColors('light');
      const colors2 = themeManager.getThemeColors('light');
      expect(colors1).not.toBe(colors2);
      expect(colors1).toEqual(colors2);
    });
  });
});
