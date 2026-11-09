import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export const DEFAULT_CUSTOMIZATION = {
  appearance: {
    themeMode: 'light', // 'light' | 'dark' | 'high-contrast'
    accentColor: '#4F46E5', // '#4F46E5' (Charming Indigo), '#0284C7' (Sky Blue), '#10B981' (Emerald), '#7C3AED' (Violet)
    density: 'standard', // 'compact' | 'standard' | 'comfortable'
    codeFont: 'jetbrains', // 'jetbrains' | 'system'
  },
  layout: {
    containerWidth: 'contained', // 'contained' | 'fluid'
    sidebarDefault: 'expanded', // 'expanded' | 'collapsed'
    tableDensity: 'standard', // 'compact' | 'standard'
    findingsPageSize: 10, // 5 | 10 | 25 | 50
  },
  navigation: {
    defaultLanding: '/dashboard', // '/dashboard' | '/scanner' | '/scans'
    quickScanHotkey: 'ctrl_k', // 'ctrl_k' | 'slash' | 'disabled'
    showBreadcrumbs: true,
    confirmNavigationOnScan: true,
  },
  notifications: {
    emailAlertsCritical: true,
    emailAlertsHigh: false,
    inAppSoundAlerts: false,
    digestFrequency: 'daily', // 'instant' | 'daily' | 'weekly' | 'off'
    webhookEnabled: false,
    webhookUrl: '',
  },
  dashboard: {
    defaultTimeRange: '30d', // '7d' | '30d' | '90d'
    autoRefreshInterval: 0, // 0 (off), 15, 30, 60
    chartType: 'area', // 'area' | 'bar'
    showVelocityMetric: true,
  },
  localization: {
    timezone: 'LOCAL', // 'LOCAL' | 'UTC'
    dateFormat: 'ISO', // 'ISO' (YYYY-MM-DD) | 'DMY' (DD/MM/YYYY) | 'MDY' (MM/DD/YYYY)
    clockFormat: '24h', // '24h' | '12h'
    numberFormat: 'standard', // 'standard' | 'compact'
  },
  accessibility: {
    highContrast: false,
    reducedMotion: false,
    enhancedFocusRing: true,
    screenReaderOptimized: false,
  },
  advanced: {
    debugTelemetry: false,
    cacheScansLocally: true,
    anonymizeTargetUrls: false,
  },
};

const STORAGE_KEY = 'securescan_customization_v1';

const CustomizationContext = createContext(null);

export function CustomizationProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Deep merge with defaults to ensure all keys exist
        return {
          appearance: { ...DEFAULT_CUSTOMIZATION.appearance, ...parsed.appearance },
          layout: { ...DEFAULT_CUSTOMIZATION.layout, ...parsed.layout },
          navigation: { ...DEFAULT_CUSTOMIZATION.navigation, ...parsed.navigation },
          notifications: { ...DEFAULT_CUSTOMIZATION.notifications, ...parsed.notifications },
          dashboard: { ...DEFAULT_CUSTOMIZATION.dashboard, ...parsed.dashboard },
          localization: { ...DEFAULT_CUSTOMIZATION.localization, ...parsed.localization },
          accessibility: { ...DEFAULT_CUSTOMIZATION.accessibility, ...parsed.accessibility },
          advanced: { ...DEFAULT_CUSTOMIZATION.advanced, ...parsed.advanced },
        };
      }
    } catch {
      // Fallback to default
    }
    return DEFAULT_CUSTOMIZATION;
  });

  // Apply DOM side-effects (accessibility, CSS vars, contrast, density)
  useEffect(() => {
    const root = document.documentElement;

    // High Contrast
    if (settings.accessibility.highContrast || settings.appearance.themeMode === 'high-contrast') {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Reduced Motion
    if (settings.accessibility.reducedMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }

    // Accent Color
    root.style.setProperty('--accent-color', settings.appearance.accentColor);

    // Density
    root.setAttribute('data-density', settings.appearance.density || 'standard');

    // Code font
    root.setAttribute('data-code-font', settings.appearance.codeFont || 'jetbrains');

    // Theme mode
    root.setAttribute('data-theme', settings.appearance.themeMode || 'light');

    // Save to localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Storage quota or sandboxed private window
    }
  }, [settings]);

  // Update a single setting
  const updateSetting = useCallback((section, key, value) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
  }, []);

  // Reset a specific section back to enterprise defaults
  const resetSection = useCallback((section) => {
    if (DEFAULT_CUSTOMIZATION[section]) {
      setSettings((prev) => ({
        ...prev,
        [section]: { ...DEFAULT_CUSTOMIZATION[section] },
      }));
    }
  }, []);

  // Reset all preferences back to enterprise defaults
  const resetAllToDefaults = useCallback(() => {
    setSettings(DEFAULT_CUSTOMIZATION);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  // Export settings as clean JSON
  const exportSettingsJson = useCallback(() => {
    return JSON.stringify(settings, null, 2);
  }, [settings]);

  // Import settings from JSON string
  const importSettingsJson = useCallback((jsonString) => {
    try {
      const parsed = JSON.parse(jsonString);
      if (typeof parsed !== 'object' || parsed === null) {
        return { success: false, error: 'Invalid configuration file: root must be an object' };
      }
      setSettings({
        appearance: { ...DEFAULT_CUSTOMIZATION.appearance, ...parsed.appearance },
        layout: { ...DEFAULT_CUSTOMIZATION.layout, ...parsed.layout },
        navigation: { ...DEFAULT_CUSTOMIZATION.navigation, ...parsed.navigation },
        notifications: { ...DEFAULT_CUSTOMIZATION.notifications, ...parsed.notifications },
        dashboard: { ...DEFAULT_CUSTOMIZATION.dashboard, ...parsed.dashboard },
        localization: { ...DEFAULT_CUSTOMIZATION.localization, ...parsed.localization },
        accessibility: { ...DEFAULT_CUSTOMIZATION.accessibility, ...parsed.accessibility },
        advanced: { ...DEFAULT_CUSTOMIZATION.advanced, ...parsed.advanced },
      });
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message || 'Failed to parse JSON file' };
    }
  }, []);

  return (
    <CustomizationContext.Provider
      value={{
        settings,
        updateSetting,
        resetSection,
        resetAllToDefaults,
        exportSettingsJson,
        importSettingsJson,
      }}
    >
      {children}
    </CustomizationContext.Provider>
  );
}

export function useCustomization() {
  const context = useContext(CustomizationContext);
  if (!context) {
    throw new Error('useCustomization must be used within a CustomizationProvider');
  }
  return context;
}

