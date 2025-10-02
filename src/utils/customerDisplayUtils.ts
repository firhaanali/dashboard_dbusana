/**
 * Customer Display Utilities
 * Helper functions untuk menampilkan customer data dengan fallback handling
 */

/**
 * Format customer name dengan fallback untuk nilai kosong
 */
export function formatCustomerName(customer: string | null | undefined): string {
  // Jika customer kosong, null, atau hanya whitespace, return "-"
  if (!customer || customer.toString().trim() === '') {
    return '-';
  }
  
  return customer.toString().trim();
}

/**
 * Check apakah customer value adalah fallback value
 */
export function isCustomerFallback(customer: string | null | undefined): boolean {
  const formatted = formatCustomerName(customer);
  return formatted === '-';
}

/**
 * Get CSS classes untuk customer display berdasarkan apakah fallback atau tidak
 */
export function getCustomerDisplayClasses(customer: string | null | undefined): string {
  if (isCustomerFallback(customer)) {
    return 'text-gray-400 italic text-sm';
  }
  return 'text-gray-700 font-medium text-sm';
}

/**
 * Format customer untuk display dalam tabel dengan styling yang tepat
 */
export function formatCustomerForDisplay(customer: string | null | undefined): {
  value: string;
  isFallback: boolean;
  className: string;
} {
  const formatted = formatCustomerName(customer);
  const isFallback = isCustomerFallback(customer);
  
  return {
    value: formatted,
    isFallback,
    className: getCustomerDisplayClasses(customer)
  };
}

/**
 * Validate customer data untuk import
 */
export function validateCustomerData(customer: any): string {
  // Convert to string and trim
  const customerStr = (customer || '').toString().trim();
  
  // Jika kosong, return fallback
  if (!customerStr) {
    return '-';
  }
  
  // Return cleaned customer name
  return customerStr;
}

/**
 * Get customer search keywords untuk filtering
 */
export function getCustomerSearchKeywords(customer: string | null | undefined): string[] {
  const formatted = formatCustomerName(customer);
  
  if (isCustomerFallback(formatted)) {
    return ['-', 'kosong', 'empty', 'null'];
  }
  
  // Split nama customer untuk keyword search
  return formatted.toLowerCase().split(/\s+/).filter(word => word.length > 0);
}