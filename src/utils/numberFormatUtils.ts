/**
 * Utility functions for formatting numbers responsively
 * Handles large numbers that might overflow in cards/components
 */

export interface FormatOptions {
  useShortFormat?: boolean;
  maxLength?: number;
  currency?: 'IDR' | 'USD';
  locale?: string;
}

/**
 * Format currency with responsive sizing
 * Automatically shortens large numbers to prevent overflow
 */
export function formatCurrencyResponsive(
  value: number | undefined | null, 
  options: FormatOptions = {}
): string {
  const {
    useShortFormat = true,
    maxLength = 12,
    currency = 'IDR',
    locale = 'id-ID'
  } = options;

  const safeValue = Number(value) || 0;
  
  // For very small values, show as is
  if (Math.abs(safeValue) < 1000) {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(safeValue);
  }

  // Generate full format first
  const fullFormat = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(safeValue);

  // If full format is short enough and we don't force short format, return it
  if (!useShortFormat && fullFormat.length <= maxLength) {
    return fullFormat;
  }

  // Use short format for large numbers
  return formatCurrencyShort(safeValue, { currency, locale });
}

/**
 * Format currency in short format (M for Million, J for Juta, B for Billion)
 */
export function formatCurrencyShort(
  value: number | undefined | null,
  options: { currency?: 'IDR' | 'USD'; locale?: string } = {}
): string {
  const { currency = 'IDR', locale = 'id-ID' } = options;
  const safeValue = Number(value) || 0;
  const absValue = Math.abs(safeValue);
  
  // Format the currency symbol
  const getCurrencySymbol = () => {
    if (currency === 'IDR') {
      return 'Rp ';
    }
    return '$';
  };

  const symbol = getCurrencySymbol();
  const sign = safeValue < 0 ? '-' : '';

  // Determine the appropriate unit and divisor
  if (absValue >= 1_000_000_000) {
    // Billions - use "B" for Billion
    const billions = absValue / 1_000_000_000;
    return `${sign}${symbol}${billions.toFixed(2)}B`;
  } else if (absValue >= 1_000_000) {
    // Millions - use "M" for Million
    const millions = absValue / 1_000_000;
    return `${sign}${symbol}${millions.toFixed(2)}M`;
  } else if (absValue >= 1_000) {
    // Thousands - use "K" for Ribu
    const thousands = absValue / 1_000;
    return `${sign}${symbol}${thousands.toFixed(1)}K`;
  } else {
    // Less than 1000, show full number
    return `${sign}${symbol}${absValue.toFixed(0)}`;
  }
}

/**
 * Format number with short notation (without currency)
 */
export function formatNumberShort(
  value: number | undefined | null,
  options: { maxLength?: number } = {}
): string {
  const { maxLength = 8 } = options;
  const safeValue = Number(value) || 0;
  const absValue = Math.abs(safeValue);
  
  // If the number is small enough, show as is
  const fullNumber = safeValue.toLocaleString('id-ID');
  if (fullNumber.length <= maxLength) {
    return fullNumber;
  }
  
  const sign = safeValue < 0 ? '-' : '';

  if (absValue >= 1_000_000_000) {
    // Billions - use "B" for Billion
    const billions = absValue / 1_000_000_000;
    return `${sign}${billions.toFixed(2)}B`;
  } else if (absValue >= 1_000_000) {
    // Millions - use "M" for Million
    const millions = absValue / 1_000_000;
    return `${sign}${millions.toFixed(2)}M`;
  } else if (absValue >= 1_000) {
    // Thousands
    const thousands = absValue / 1_000;
    return `${sign}${thousands.toFixed(1)}K`;
  } else {
    return `${sign}${absValue.toFixed(0)}`;
  }
}

/**
 * Smart format that chooses between full and short format based on available space
 */
export function formatCurrencySmart(
  value: number | undefined | null,
  containerWidth?: 'small' | 'medium' | 'large'
): string {
  const safeValue = Number(value) || 0;
  
  // Determine max length based on container size
  let maxLength = 12; // default for large containers
  if (containerWidth === 'small') {
    maxLength = 8;
  } else if (containerWidth === 'medium') {
    maxLength = 10;
  }

  return formatCurrencyResponsive(safeValue, { 
    useShortFormat: true, 
    maxLength 
  });
}

/**
 * Format with tooltip - returns both display and full format
 */
export function formatWithTooltip(value: number | undefined | null): {
  display: string;
  tooltip: string;
  isShortened: boolean;
} {
  const safeValue = Number(value) || 0;
  
  const fullFormat = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(safeValue);
  
  const shortFormat = formatCurrencyShort(safeValue);
  
  // Always use short format for values >= 1 million to match the image request
  const shouldUseShortFormat = Math.abs(safeValue) >= 1_000_000;
  
  return {
    display: shouldUseShortFormat ? shortFormat : fullFormat,
    tooltip: fullFormat,
    isShortened: shouldUseShortFormat
  };
}

/**
 * Format percentage with appropriate precision
 */
export function formatPercentage(
  value: number | undefined | null,
  decimals: number = 1
): string {
  const safeValue = Number(value) || 0;
  return `${safeValue.toFixed(decimals)}%`;
}