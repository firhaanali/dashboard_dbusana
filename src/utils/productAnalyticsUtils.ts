export interface DateRange {
  start: Date;
  end: Date;
}

export interface PredefinedPeriod {
  key: string;
  label: string;
  getDateRange: () => DateRange;
}

export const getPredefinedPeriods = (): PredefinedPeriod[] => {
  const now = new Date();
  
  return [
    {
      key: 'today',
      label: 'Hari Ini',
      getDateRange: () => {
        const start = new Date(now);
        start.setHours(0, 0, 0, 0);
        const end = new Date(now);
        end.setHours(23, 59, 59, 999);
        return { start, end };
      }
    },
    {
      key: 'yesterday',
      label: 'Kemarin', 
      getDateRange: () => {
        const start = new Date(now);
        start.setDate(now.getDate() - 1);
        start.setHours(0, 0, 0, 0);
        const end = new Date(now);
        end.setDate(now.getDate() - 1);
        end.setHours(23, 59, 59, 999);
        return { start, end };
      }
    },
    {
      key: 'last-7-days',
      label: '7 Hari Terakhir',
      getDateRange: () => {
        const start = new Date(now);
        start.setDate(now.getDate() - 7);
        start.setHours(0, 0, 0, 0);
        const end = new Date(now);
        end.setHours(23, 59, 59, 999);
        return { start, end };
      }
    },
    {
      key: 'last-30-days',
      label: '30 Hari Terakhir',
      getDateRange: () => {
        const start = new Date(now);
        start.setDate(now.getDate() - 30);
        start.setHours(0, 0, 0, 0);
        const end = new Date(now);
        end.setHours(23, 59, 59, 999);
        return { start, end };
      }
    },
    {
      key: 'current-month',
      label: 'Bulan Ini',
      getDateRange: () => {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        start.setHours(0, 0, 0, 0);
        const end = new Date(now);
        end.setHours(23, 59, 59, 999);
        return { start, end };
      }
    },
    {
      key: 'last-month',
      label: 'Bulan Lalu',
      getDateRange: () => {
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        start.setHours(0, 0, 0, 0);
        const end = new Date(now.getFullYear(), now.getMonth(), 0);
        end.setHours(23, 59, 59, 999);
        return { start, end };
      }
    },
    {
      key: 'august-2024',
      label: 'Agustus 2024',
      getDateRange: () => {
        const start = new Date(2024, 7, 1); // August is month 7 (0-indexed)
        start.setHours(0, 0, 0, 0);
        const end = new Date(2024, 7, 31);
        end.setHours(23, 59, 59, 999);
        return { start, end };
      }
    },
    {
      key: 'july-2024',
      label: 'Juli 2024',
      getDateRange: () => {
        const start = new Date(2024, 6, 1); // July is month 6 (0-indexed)
        start.setHours(0, 0, 0, 0);
        const end = new Date(2024, 6, 31);
        end.setHours(23, 59, 59, 999);
        return { start, end };
      }
    },
    {
      key: 'current-quarter',
      label: 'Kuartal Ini',
      getDateRange: () => {
        const currentQuarter = Math.floor(now.getMonth() / 3);
        const start = new Date(now.getFullYear(), currentQuarter * 3, 1);
        start.setHours(0, 0, 0, 0);
        const end = new Date(now);
        end.setHours(23, 59, 59, 999);
        return { start, end };
      }
    },
    {
      key: 'current-year',
      label: 'Tahun Ini',
      getDateRange: () => {
        const start = new Date(now.getFullYear(), 0, 1);
        start.setHours(0, 0, 0, 0);
        const end = new Date(now);
        end.setHours(23, 59, 59, 999);
        return { start, end };
      }
    },
    {
      key: 'last-year',
      label: 'Tahun Lalu',
      getDateRange: () => {
        const start = new Date(now.getFullYear() - 1, 0, 1);
        start.setHours(0, 0, 0, 0);
        const end = new Date(now.getFullYear() - 1, 11, 31);
        end.setHours(23, 59, 59, 999);
        return { start, end };
      }
    },
    {
      key: 'all-time',
      label: 'Sepanjang Waktu',
      getDateRange: () => {
        const start = new Date(2020, 0, 1);
        start.setHours(0, 0, 0, 0);
        const end = new Date(2030, 11, 31);
        end.setHours(23, 59, 59, 999);
        return { start, end };
      }
    }
  ];
};

// Format number with Indonesian locale
export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('id-ID').format(num);
};

// Format currency in Indonesian Rupiah
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

// Format percentage
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

// Format date for display
export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

// Get growth indicator (positive, negative, neutral)
export const getGrowthIndicator = (currentValue: number, previousValue: number) => {
  if (previousValue === 0) {
    return { type: 'neutral' as const, percentage: 0 };
  }
  
  const growth = ((currentValue - previousValue) / Math.abs(previousValue)) * 100;
  
  return {
    type: growth > 0 ? 'positive' as const : growth < 0 ? 'negative' as const : 'neutral' as const,
    percentage: Math.abs(growth)
  };
};

// Get marketplace badge color
export const getMarketplaceBadgeColor = (marketplace: string): string => {
  const colors: { [key: string]: string } = {
    'Shopee': 'bg-orange-100 text-orange-700 border-orange-300',
    'Tokopedia': 'bg-green-100 text-green-700 border-green-300',
    'Lazada': 'bg-blue-100 text-blue-700 border-blue-300',
    'Blibli': 'bg-purple-100 text-purple-700 border-purple-300',
    'TikTok Shop': 'bg-pink-100 text-pink-700 border-pink-300',
    'Bukalapak': 'bg-red-100 text-red-700 border-red-300',
    'Unknown': 'bg-gray-100 text-gray-700 border-gray-300'
  };
  
  return colors[marketplace] || colors['Unknown'];
};

// Search products with fuzzy matching
export const searchProducts = (products: string[], query: string, limit: number = 10): string[] => {
  if (!query.trim()) return [];
  
  const normalizedQuery = query.toLowerCase().trim();
  
  // Exact matches first
  const exactMatches = products.filter(product => 
    product.toLowerCase() === normalizedQuery
  );
  
  // Starts with matches
  const startsWithMatches = products.filter(product => 
    product.toLowerCase().startsWith(normalizedQuery) && 
    !exactMatches.includes(product)
  );
  
  // Contains matches
  const containsMatches = products.filter(product => 
    product.toLowerCase().includes(normalizedQuery) && 
    !exactMatches.includes(product) && 
    !startsWithMatches.includes(product)
  );
  
  // Word matches (split by space and check if any word starts with query)
  const wordMatches = products.filter(product => {
    const words = product.toLowerCase().split(/\s+/);
    return words.some(word => word.startsWith(normalizedQuery)) && 
           !exactMatches.includes(product) && 
           !startsWithMatches.includes(product) && 
           !containsMatches.includes(product);
  });
  
  return [
    ...exactMatches,
    ...startsWithMatches,
    ...containsMatches,
    ...wordMatches
  ].slice(0, limit);
};