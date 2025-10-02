/**
 * Date utility functions for handling Excel date formats and conversion
 * Specifically designed to handle Excel serial numbers and various date formats
 */

/**
 * Convert Excel serial date number to JavaScript Date
 * Excel stores dates as serial numbers where 1 = January 1, 1900
 * @param excelDateSerial Excel serial date number (e.g., 45882.70006944444)
 * @returns JavaScript Date object
 */
export function excelSerialToDate(excelDateSerial: number): Date {
  // Excel epoch starts January 1, 1900 (but Excel incorrectly treats 1900 as a leap year)
  // JavaScript Date constructor uses 0-based months, so January = 0
  const baseDate = new Date(1900, 0, 1); // January 1, 1900
  
  // Excel serial number 1 = January 1, 1900
  // We need to subtract 1 because Excel counts from 1, not 0
  let daysSinceEpoch = excelDateSerial - 1;
  
  // Excel incorrectly treats 1900 as a leap year (it wasn't)
  // This means Excel serial dates after Feb 28, 1900 are off by one day
  // Excel serial date 60 represents Feb 29, 1900 (which didn't exist)
  // We need to compensate for this error
  if (excelDateSerial > 59) {
    daysSinceEpoch = daysSinceEpoch - 1;
  }
  
  // Convert to milliseconds and add to base date
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  const resultDate = new Date(baseDate.getTime() + (daysSinceEpoch * millisecondsPerDay));
  
  return resultDate;
}

/**
 * Universal date parser that handles various formats including Excel serial numbers
 * @param dateInput Date input in various formats (string, number, Date)
 * @returns JavaScript Date object or null if parsing fails
 */
export function parseUniversalDate(dateInput: string | Date | number | null | undefined): Date | null {
  if (!dateInput && dateInput !== 0) return null;
  
  try {
    // If it's already a Date object
    if (dateInput instanceof Date) {
      return isNaN(dateInput.getTime()) ? null : dateInput;
    }
    
    // Handle Excel serial numbers
    if (typeof dateInput === 'number') {
      // Excel serial numbers typically range from ~1 (1900) to ~50000+ (2030s)
      // Numbers > 25569 are likely Excel serial dates (25569 = Jan 1, 1970)
      if (dateInput > 25569) {
        return excelSerialToDate(dateInput);
      } else if (dateInput > 0) {
        // Assume it's a Unix timestamp (seconds) if it's a reasonable number
        return new Date(dateInput * 1000);
      } else {
        return null;
      }
    }
    
    // Handle string dates
    if (typeof dateInput === 'string') {
      const str = dateInput.toString().trim();
      
      // Check if it's a numeric string representing Excel serial number
      const numericValue = parseFloat(str);
      if (!isNaN(numericValue) && numericValue > 25569) {
        return excelSerialToDate(numericValue);
      }
      
      // Try standard JavaScript Date parsing
      let date = new Date(str);
      if (!isNaN(date.getTime())) {
        return date;
      }
      
      // Try custom formats
      // YYYY-MM-DD HH:MM:SS
      const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/);
      if (isoMatch) {
        const [, year, month, day, hour, minute, second] = isoMatch;
        date = new Date(
          parseInt(year),
          parseInt(month) - 1, // Month is 0-based
          parseInt(day),
          parseInt(hour),
          parseInt(minute),
          parseInt(second)
        );
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
      
      // DD/MM/YYYY format
      const ddmmyyyyMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (ddmmyyyyMatch) {
        const [, day, month, year] = ddmmyyyyMatch;
        date = new Date(
          parseInt(year),
          parseInt(month) - 1, // Month is 0-based
          parseInt(day)
        );
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
      
      // DD-MM-YYYY format
      const ddmmyyyyDashMatch = str.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
      if (ddmmyyyyDashMatch) {
        const [, day, month, year] = ddmmyyyyDashMatch;
        date = new Date(
          parseInt(year),
          parseInt(month) - 1, // Month is 0-based
          parseInt(day)
        );
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
    }
    
    return null;
  } catch (error) {
    console.warn('Error parsing date:', dateInput, error);
    return null;
  }
}

/**
 * Format date for display without dots
 * @param date Date to format
 * @param includeTime Whether to include time in the output
 * @returns Formatted date string without dots
 */
export function formatDateForDisplay(date: Date | null, includeTime: boolean = true): string {
  if (!date || isNaN(date.getTime())) {
    return 'Invalid Date';
  }
  
  try {
    const day = date.getDate().toString().padStart(2, '0');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    
    let formatted = `${day} ${month}`;
    
    if (includeTime) {
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      formatted += ` ${year}, ${hours}:${minutes}`;
    } else {
      formatted += ` ${year}`;
    }
    
    return formatted;
  } catch (error) {
    console.warn('Error formatting date for display:', date, error);
    return 'Format Error';
  }
}

/**
 * Format date to simple DD-MM-YYYY format
 * @param date Date to format (string, Date object, or null)
 * @returns Formatted date string in DD-MM-YYYY format
 */
export function formatDateSimple(date: string | Date | null | undefined): string {
  if (!date) return '-';
  
  try {
    let dateObj: Date;
    
    if (typeof date === 'string') {
      dateObj = new Date(date);
    } else if (date instanceof Date) {
      dateObj = date;
    } else {
      return '-';
    }
    
    if (isNaN(dateObj.getTime())) {
      return '-';
    }
    
    const day = dateObj.getDate().toString().padStart(2, '0');
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const year = dateObj.getFullYear();
    
    return `${day}-${month}-${year}`;
  } catch (error) {
    console.warn('Error formatting date:', date, error);
    return '-';
  }
}

/**
 * Format date for chart display (short format without dots)
 * @param date Date to format (string, Date object, or null)
 * @returns Formatted date string like "02 Jun"
 */
export function formatDateChart(date: string | Date | null | undefined): string {
  if (!date) return '-';
  
  try {
    let dateObj: Date;
    
    if (typeof date === 'string') {
      dateObj = new Date(date);
    } else if (date instanceof Date) {
      dateObj = date;
    } else {
      return '-';
    }
    
    if (isNaN(dateObj.getTime())) {
      return '-';
    }
    
    const day = dateObj.getDate().toString().padStart(2, '0');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[dateObj.getMonth()];
    
    return `${day} ${month}`;
  } catch (error) {
    console.warn('Error formatting date for chart:', date, error);
    return '-';
  }
}

/**
 * Format date for tooltip display (full format without dots)
 * @param date Date to format (string, Date object, or null)
 * @returns Formatted date string like "02 Jun 2024"
 */
export function formatDateFull(date: string | Date | null | undefined): string {
  if (!date) return '-';
  
  try {
    let dateObj: Date;
    
    if (typeof date === 'string') {
      dateObj = new Date(date);
    } else if (date instanceof Date) {
      dateObj = date;
    } else {
      return '-';
    }
    
    if (isNaN(dateObj.getTime())) {
      return '-';
    }
    
    const day = dateObj.getDate().toString().padStart(2, '0');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[dateObj.getMonth()];
    const year = dateObj.getFullYear();
    
    return `${day} ${month} ${year}`;
  } catch (error) {
    console.warn('Error formatting date full:', date, error);
    return '-';
  }
}

/**
 * Universal date formatter that combines parsing and formatting
 * @param dateInput Date input in various formats
 * @param includeTime Whether to include time in the output
 * @returns Formatted date string or fallback message
 */
export function formatUniversalDate(
  dateInput: string | Date | number | null | undefined, 
  includeTime: boolean = true
): string {
  if (!dateInput && dateInput !== 0) {
    return '-';
  }
  
  const parsedDate = parseUniversalDate(dateInput);
  if (!parsedDate) {
    console.warn('Failed to parse date:', dateInput);
    return 'Invalid Date';
  }
  
  return formatDateForDisplay(parsedDate, includeTime);
}

/**
 * Convert date to timestamp for sorting purposes
 * @param dateInput Date input in various formats
 * @returns Timestamp in milliseconds or 0 if parsing fails
 */
export function dateToTimestamp(dateInput: string | Date | number | null | undefined): number {
  const parsedDate = parseUniversalDate(dateInput);
  return parsedDate ? parsedDate.getTime() : 0;
}

/**
 * Extract date string (YYYY-MM-DD) from date input for filtering
 * @param dateInput Date input in various formats
 * @returns Date string in YYYY-MM-DD format or empty string if parsing fails
 */
export function extractDateString(dateInput: string | Date | number | null | undefined): string {
  const parsedDate = parseUniversalDate(dateInput);
  if (!parsedDate) {
    return '';
  }
  
  try {
    return parsedDate.toISOString().split('T')[0];
  } catch (error) {
    console.warn('Error extracting date string:', dateInput, error);
    return '';
  }
}

// Export individual functions for compatibility
export {
  parseUniversalDate as parseDate,
  formatUniversalDate as formatDate
};