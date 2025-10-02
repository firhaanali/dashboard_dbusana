import { useTranslation } from '../contexts/LanguageContext';

/**
 * Extended translation utilities for easier development
 */
export function useLanguageUtils() {
  const { t, formatCurrency, formatDate, formatNumber, language } = useTranslation();

  // Quick formatters for common business data
  const formatters = {
    // Currency formatting with automatic locale
    currency: (amount: number, showSymbol = true) => {
      if (!showSymbol) {
        return new Intl.NumberFormat(language === 'id' ? 'id-ID' : 'en-US').format(amount);
      }
      return formatCurrency(amount);
    },

    // Percentage formatting
    percentage: (value: number, decimals = 1) => {
      return new Intl.NumberFormat(language === 'id' ? 'id-ID' : 'en-US', {
        style: 'percent',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      }).format(value / 100);
    },

    // Compact number formatting (K, M, B)
    compactNumber: (num: number) => {
      return new Intl.NumberFormat(language === 'id' ? 'id-ID' : 'en-US', {
        notation: 'compact',
        compactDisplay: 'short'
      }).format(num);
    },

    // Date with time
    dateTime: (date: Date | string) => {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return new Intl.DateTimeFormat(language === 'id' ? 'id-ID' : 'en-US', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(dateObj);
    },

    // Relative time (ago)
    relativeTime: (date: Date | string) => {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      const rtf = new Intl.RelativeTimeFormat(language === 'id' ? 'id-ID' : 'en-US', {
        numeric: 'auto'
      });
      
      const diffTime = dateObj.getTime() - new Date().getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (Math.abs(diffDays) < 1) {
        const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
        return rtf.format(diffHours, 'hour');
      }
      
      return rtf.format(diffDays, 'day');
    }
  };

  // Common business translations with shortcuts
  const quick = {
    // Navigation shortcuts
    nav: (key: string) => t(`navigation.${key}`),
    
    // Common actions
    action: (key: string) => t(`common.${key}`),
    
    // Dashboard KPIs
    kpi: (key: string) => t(`dashboard.kpi.${key}`),
    
    // Settings related
    setting: (key: string) => t(`settings.${key}`),
    
    // Error messages
    error: (key: string) => t(`errors.${key}`)
  };

  // Marketplace name localization (basic)
  const marketplaceName = (marketplace: string) => {
    const marketplaceMap: Record<string, string> = {
      'shopee': 'Shopee',
      'tokopedia': 'Tokopedia',
      'lazada': 'Lazada',
      'tiktok_shop': 'TikTok Shop',
      'tiktok shop': 'TikTok Shop',
      'direct': language === 'id' ? 'Penjualan Langsung' : 'Direct Sales'
    };
    
    return marketplaceMap[marketplace.toLowerCase()] || marketplace;
  };

  // Status localization (basic)
  const statusName = (status: string) => {
    const statusMap: Record<string, string> = {
      'pending': language === 'id' ? 'Menunggu' : 'Pending',
      'processing': language === 'id' ? 'Diproses' : 'Processing',
      'shipped': language === 'id' ? 'Dikirim' : 'Shipped',
      'delivered': language === 'id' ? 'Terkirim' : 'Delivered',
      'cancelled': language === 'id' ? 'Dibatalkan' : 'Cancelled',
      'returned': language === 'id' ? 'Dikembalikan' : 'Returned'
    };
    
    return statusMap[status.toLowerCase()] || status;
  };

  // Month names
  const monthName = (monthIndex: number) => {
    const monthsId = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const monthsEn = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const months = language === 'id' ? monthsId : monthsEn;
    return months[monthIndex] || '';
  };

  // Current language info
  const languageInfo = {
    code: language,
    isIndonesian: language === 'id',
    isEnglish: language === 'en',
    name: language === 'id' ? 'Bahasa Indonesia' : 'English',
    locale: language === 'id' ? 'id-ID' : 'en-US'
  };

  return {
    t,
    language,
    languageInfo,
    formatters,
    quick,
    marketplaceName,
    statusName,
    monthName,
    formatCurrency,
    formatDate,
    formatNumber
  };
}