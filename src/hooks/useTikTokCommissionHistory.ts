import { useState, useEffect } from 'react';

interface CommissionCalculation {
  id: string;
  timestamp: Date;
  productPrice: number;
  platformCommission: number;
  dynamicCommission: number;
  extraBoostCommission: number;
  cashbackCommission: number;
  affiliateCommission: number;
  totalCommissionAmount: number;
  settlementAmount: number;
  netProfitMargin: number;
  productName?: string;
  notes?: string;
  processingFee?: number;
}

const STORAGE_KEY = 'tiktok_commission_history';
const MAX_HISTORY_ITEMS = 20;

export const useTikTokCommissionHistory = () => {
  const [history, setHistory] = useState<CommissionCalculation[]>([]);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem(STORAGE_KEY);
      if (savedHistory) {
        const parsed = JSON.parse(savedHistory);
        // Convert timestamp strings back to Date objects
        const historyWithDates = parsed.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }));
        setHistory(historyWithDates);
      }
    } catch (error) {
      console.warn('Failed to load TikTok commission history:', error);
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (error) {
      console.warn('Failed to save TikTok commission history:', error);
    }
  }, [history]);

  const addCalculation = (calculation: Omit<CommissionCalculation, 'id' | 'timestamp'>) => {
    const newCalculation: CommissionCalculation = {
      ...calculation,
      id: `calc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };

    setHistory(prev => {
      // Add to beginning and limit to MAX_HISTORY_ITEMS
      const updated = [newCalculation, ...prev].slice(0, MAX_HISTORY_ITEMS);
      return updated;
    });

    return newCalculation.id;
  };

  const removeCalculation = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const clearHistory = () => {
    setHistory([]);
  };

  const updateCalculation = (id: string, updates: Partial<Omit<CommissionCalculation, 'id' | 'timestamp'>>) => {
    setHistory(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  const getCalculationById = (id: string): CommissionCalculation | undefined => {
    return history.find(item => item.id === id);
  };

  const getRecentCalculations = (limit: number = 5): CommissionCalculation[] => {
    return history.slice(0, limit);
  };

  const getTotalCalculations = (): number => {
    return history.length;
  };

  const getAverageSettlement = (): number => {
    if (history.length === 0) return 0;
    const total = history.reduce((sum, item) => sum + item.settlementAmount, 0);
    return total / history.length;
  };

  const getMostUsedCommissions = () => {
    if (history.length === 0) {
      return {
        dynamic: 0,
        extraBoost: 0,
        cashback: 0,
        affiliate: 0
      };
    }
    
    const totals = history.reduce((acc, item) => {
      acc.dynamic += item.dynamicCommission;
      acc.extraBoost += item.extraBoostCommission;
      acc.cashback += item.cashbackCommission;
      acc.affiliate += item.affiliateCommission;
      return acc;
    }, {
      dynamic: 0,
      extraBoost: 0,
      cashback: 0,
      affiliate: 0
    });

    const count = history.length;
    return {
      dynamic: Number((totals.dynamic / count).toFixed(2)),
      extraBoost: Number((totals.extraBoost / count).toFixed(2)),
      cashback: Number((totals.cashback / count).toFixed(2)),
      affiliate: Number((totals.affiliate / count).toFixed(2))
    };
  };

  const exportHistory = (): string => {
    const exportData = {
      exportDate: new Date().toISOString(),
      version: '1.0',
      calculations: history
    };
    return JSON.stringify(exportData, null, 2);
  };

  const importHistory = (jsonData: string): boolean => {
    try {
      const importData = JSON.parse(jsonData);
      if (importData.calculations && Array.isArray(importData.calculations)) {
        const importedCalculations = importData.calculations.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp),
          id: item.id || `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }));
        
        setHistory(prev => {
          const combined = [...importedCalculations, ...prev];
          // Remove duplicates based on id and limit to MAX_HISTORY_ITEMS
          const unique = combined.filter((item, index, arr) => 
            arr.findIndex(i => i.id === item.id) === index
          ).slice(0, MAX_HISTORY_ITEMS);
          return unique;
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to import history:', error);
      return false;
    }
  };

  return {
    history,
    addCalculation,
    removeCalculation,
    clearHistory,
    updateCalculation,
    getCalculationById,
    getRecentCalculations,
    getTotalCalculations,
    getAverageSettlement,
    getMostUsedCommissions,
    exportHistory,
    importHistory
  };
};