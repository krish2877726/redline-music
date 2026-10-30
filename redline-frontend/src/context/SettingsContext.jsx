import React, { createContext, useContext, useState, useEffect } from 'react';

const STORAGE_KEY = 'redline_settings_v2';

const DEFAULT_SETTINGS = {
  // Account
  username: 'Demo Listener',
  profileBio: 'Exploring music on Redline with Snitify UX',
  
  // Media Quality
  audioQuality: 'high', // 'auto', 'low', 'normal', 'high', 'very_high'
  preferredAudioFormat: 'opus', // 'opus', 'aac'
  autoplay: true,
  normalizeVolume: false,
  equalizerEnabled: false,
  equalizerPreset: 'flat',
  equalizerBands: [0, 0, 0, 0, 0], // 60Hz, 230Hz, 910Hz, 3.6kHz, 14kHz (-12dB to +12dB)

  // Content & Display
  syncedLyrics: true,
  showExplicit: true,
  dynamicThemeGlow: true,
  vinylSpin: true,

  // Data Saving
  dataSaver: false,
  imageQuality: 'high', // 'low', 'normal', 'high'
};

export const EQ_PRESETS = {
  flat: [0, 0, 0, 0, 0],
  bass: [6, 4, 1, 0, -1],
  treble: [-1, 0, 1, 4, 6],
  vocal: [-2, 2, 5, 3, 0],
  rock: [5, 2, -1, 3, 5],
  electronic: [6, 3, 0, 2, 5],
};

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.warn('Failed to parse settings from storage:', e);
    }
    return DEFAULT_SETTINGS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to save settings:', e);
    }
  }, [settings]);

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const setEqualizerPreset = presetName => {
    const bands = EQ_PRESETS[presetName] || EQ_PRESETS.flat;
    setSettings(prev => ({
      ...prev,
      equalizerPreset: presetName,
      equalizerBands: [...bands],
    }));
  };

  const setEqualizerBand = (index, dbValue) => {
    setSettings(prev => {
      const newBands = [...prev.equalizerBands];
      newBands[index] = dbValue;
      return {
        ...prev,
        equalizerPreset: 'custom',
        equalizerBands: newBands,
      };
    });
  };

  const exportBackup = (libraryState) => {
    const backupData = {
      app: 'Redline Music',
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      settings,
      library: libraryState,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `redline-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importBackup = (jsonString) => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.settings) {
        setSettings({ ...DEFAULT_SETTINGS, ...parsed.settings });
      }
      return parsed.library || null;
    } catch (e) {
      throw new Error('Invalid backup file JSON');
    }
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSetting,
        setEqualizerPreset,
        setEqualizerBand,
        exportBackup,
        importBackup,
        resetSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within a SettingsProvider');
  return context;
}
