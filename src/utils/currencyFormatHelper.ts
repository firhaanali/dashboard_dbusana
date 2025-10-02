// Simple currency formatting helper for components that need basic formatting
// This provides a consistent formatCurrency function to avoid import errors

/**
 * Basic currency formatting function
 * Uses Indonesian locale and IDR currency
 */
export const formatCurrency = (value: number | undefined | null): string => {
  const safeValue = Number(value) || 0;
  
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(safeValue);
};

/**
 * Format currency with short notation for large numbers
 */
export const formatCurrencyShort = (value: number | undefined | null): string => {
  const safeValue = Number(value) || 0;
  const absValue = Math.abs(safeValue);
  const sign = safeValue < 0 ? '-' : '';
  
  if (absValue >= 1_000_000_000) {
    const billions = absValue / 1_000_000_000;
    return `${sign}Rp ${billions.toFixed(2)}M`;
  } else if (absValue >= 1_000_000) {
    const millions = absValue / 1_000_000;
    return `${sign}Rp ${millions.toFixed(2)}M`;
  } else if (absValue >= 1_000) {
    const thousands = absValue / 1_000;
    return `${sign}Rp ${thousands.toFixed(1)}K`;
  } else {
    return formatCurrency(safeValue);
  }
};

/**
 * Format number without currency
 */
export const formatNumber = (value: number | undefined | null): string => {
  const safeValue = Number(value) || 0;
  return new Intl.NumberFormat('id-ID').format(safeValue);
};

/**
 * Export all formatting functions from numberFormatUtils for convenience
 */
export {
  formatCurrencyResponsive,
  formatCurrencySmart,
  formatWithTooltip,
  formatNumberShort,
  formatPercentage
} from './numberFormatUtils';