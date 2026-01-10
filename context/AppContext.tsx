import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppSettings, ScannedBarcode, DEFAULT_SETTINGS, BarcodeType } from '@/types/barcode';

const SETTINGS_STORAGE_KEY = '@barcode_scanner_settings';
const HISTORY_STORAGE_KEY = '@barcode_scanner_history';

interface AppContextType {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  toggleBarcodeType: (type: BarcodeType) => void;
  scanHistory: ScannedBarcode[];
  addScan: (barcode: Omit<ScannedBarcode, 'id' | 'timestamp'>) => void;
  clearHistory: () => void;
  removeScan: (id: string) => void;
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [scanHistory, setScanHistory] = useState<ScannedBarcode[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [settingsData, historyData] = await Promise.all([
        AsyncStorage.getItem(SETTINGS_STORAGE_KEY),
        AsyncStorage.getItem(HISTORY_STORAGE_KEY),
      ]);

      if (settingsData) {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(settingsData) });
      }
      if (historyData) {
        setScanHistory(JSON.parse(historyData));
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async (newSettings: AppSettings) => {
    try {
      await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  const saveHistory = async (history: ScannedBarcode[]) => {
    try {
      await AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Failed to save history:', error);
    }
  };

  const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      saveSettings(updated);
      return updated;
    });
  }, []);

  const toggleBarcodeType = useCallback((type: BarcodeType) => {
    setSettings(prev => {
      const enabled = prev.enabledBarcodeTypes.includes(type);
      const newTypes = enabled
        ? prev.enabledBarcodeTypes.filter(t => t !== type)
        : [...prev.enabledBarcodeTypes, type];

      const updated = { ...prev, enabledBarcodeTypes: newTypes };
      saveSettings(updated);
      return updated;
    });
  }, []);

  const addScan = useCallback((barcode: Omit<ScannedBarcode, 'id' | 'timestamp'>) => {
    const newScan: ScannedBarcode = {
      ...barcode,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };

    setScanHistory(prev => {
      const updated = [newScan, ...prev];
      saveHistory(updated);
      return updated;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setScanHistory([]);
    saveHistory([]);
  }, []);

  const removeScan = useCallback((id: string) => {
    setScanHistory(prev => {
      const updated = prev.filter(scan => scan.id !== id);
      saveHistory(updated);
      return updated;
    });
  }, []);

  return (
    <AppContext.Provider
      value={{
        settings,
        updateSettings,
        toggleBarcodeType,
        scanHistory,
        addScan,
        clearHistory,
        removeScan,
        isLoading,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
