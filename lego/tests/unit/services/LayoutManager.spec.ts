/**
 * Unit tests for LayoutManager service
 */
import { LayoutManager, LayoutPreferences } from '@/services/LayoutManager';

describe('LayoutManager', () => {
  let layoutManager: LayoutManager;
  const mockPreferences: LayoutPreferences = {
    leftPanelWidth: 350,
    rightPanelWidth: 320,
    rightPanelCollapsed: true,
    theme: 'dark'
  };

  beforeEach(() => {
    layoutManager = new LayoutManager();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('savePreferences', () => {
    it('should save preferences to localStorage', () => {
      layoutManager.savePreferences(mockPreferences);
      const stored = localStorage.getItem('lego-editor-layout-preferences');
      expect(stored).toBeTruthy();
      expect(JSON.parse(stored!)).toEqual(mockPreferences);
    });
  });

  describe('loadPreferences', () => {
    it('should load preferences from localStorage', () => {
      localStorage.setItem('lego-editor-layout-preferences', JSON.stringify(mockPreferences));
      const loaded = layoutManager.loadPreferences();
      expect(loaded).toEqual(mockPreferences);
    });

    it('should return null if no preferences are stored', () => {
      const loaded = layoutManager.loadPreferences();
      expect(loaded).toBeNull();
    });

    it('should return null if stored data is invalid', () => {
      localStorage.setItem('lego-editor-layout-preferences', 'invalid json');
      const loaded = layoutManager.loadPreferences();
      expect(loaded).toBeNull();
    });

    it('should return null if stored preferences are incomplete', () => {
      const incomplete = { leftPanelWidth: 300 };
      localStorage.setItem('lego-editor-layout-preferences', JSON.stringify(incomplete));
      const loaded = layoutManager.loadPreferences();
      expect(loaded).toBeNull();
    });
  });

  describe('resetToDefault', () => {
    it('should reset to default preferences', () => {
      layoutManager.savePreferences(mockPreferences);
      const defaults = layoutManager.resetToDefault();
      
      expect(defaults).toEqual({
        leftPanelWidth: 300,
        rightPanelWidth: 300,
        rightPanelCollapsed: false,
        theme: 'light'
      });
      
      const stored = layoutManager.loadPreferences();
      expect(stored).toEqual(defaults);
    });
  });

  describe('updatePreferences', () => {
    it('should update specific preference values', () => {
      layoutManager.savePreferences(mockPreferences);
      const updated = layoutManager.updatePreferences({ leftPanelWidth: 400 });
      
      expect(updated.leftPanelWidth).toBe(400);
      expect(updated.rightPanelWidth).toBe(mockPreferences.rightPanelWidth);
      expect(updated.theme).toBe(mockPreferences.theme);
    });

    it('should create new preferences if none exist', () => {
      const updated = layoutManager.updatePreferences({ theme: 'dark' });
      expect(updated.theme).toBe('dark');
      expect(updated.leftPanelWidth).toBe(300); // default value
    });
  });

  describe('getPreferences', () => {
    it('should return stored preferences', () => {
      layoutManager.savePreferences(mockPreferences);
      const prefs = layoutManager.getPreferences();
      expect(prefs).toEqual(mockPreferences);
    });

    it('should return defaults if no preferences are stored', () => {
      const prefs = layoutManager.getPreferences();
      expect(prefs).toEqual({
        leftPanelWidth: 300,
        rightPanelWidth: 300,
        rightPanelCollapsed: false,
        theme: 'light'
      });
    });
  });
});
