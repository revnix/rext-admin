/**
 * Centralized number formatting utilities
 *
 * Provides consistent number formatting across the application with proper null handling.
 * All functions return fallback values for null/undefined inputs.
 *
 * @module number-formatters
 */

/**
 * Number formatting functions with consistent patterns
 */
export const numberFormat = {
  /**
   * Format integer with thousands separators: "1,234"
   * @param num - Number or null/undefined
   * @returns Formatted number string or "0" if invalid
   * @example
   * numberFormat.integer(1234) // "1,234"
   * numberFormat.integer(null) // "0"
   */
  integer: (num: number | null | undefined): string => {
    if (num === null || num === undefined || Number.isNaN(num)) return "0";
    return Math.floor(num).toLocaleString("en-US");
  },

  /**
   * Format number with decimal places: "1,234.56"
   * @param num - Number or null/undefined
   * @param decimals - Number of decimal places (default: 2)
   * @returns Formatted number string or "0.00" if invalid
   * @example
   * numberFormat.decimal(1234.567) // "1,234.57"
   * numberFormat.decimal(1234.567, 1) // "1,234.6"
   */
  decimal: (num: number | null | undefined, decimals: number = 2): string => {
    if (num === null || num === undefined || Number.isNaN(num)) {
      return decimals === 0 ? "0" : `0.${"0".repeat(decimals)}`;
    }
    return num.toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  },

  /**
   * Format number in compact notation: "1.2K", "3.4M", "5.6B"
   * @param num - Number or null/undefined
   * @returns Compact formatted string or "0" if invalid
   * @example
   * numberFormat.compact(1234) // "1.2K"
   * numberFormat.compact(1234567) // "1.2M"
   * numberFormat.compact(1234567890) // "1.2B"
   */
  compact: (num: number | null | undefined): string => {
    if (num === null || num === undefined || Number.isNaN(num)) return "0";

    const absNum = Math.abs(num);
    const sign = num < 0 ? "-" : "";

    if (absNum >= 1_000_000_000) {
      return `${sign}${(absNum / 1_000_000_000).toFixed(1)}B`;
    }
    if (absNum >= 1_000_000) {
      return `${sign}${(absNum / 1_000_000).toFixed(1)}M`;
    }
    if (absNum >= 1_000) {
      return `${sign}${(absNum / 1_000).toFixed(1)}K`;
    }
    return `${sign}${absNum}`;
  },

  /**
   * Format as currency: "$1,234.56"
   * @param num - Number or null/undefined
   * @param currency - Currency code (default: "USD")
   * @returns Formatted currency string or "$0.00" if invalid
   * @example
   * numberFormat.currency(1234.56) // "$1,234.56"
   * numberFormat.currency(1234.56, "EUR") // "€1,234.56"
   */
  currency: (
    num: number | null | undefined,
    currency: string = "USD",
  ): string => {
    if (num === null || num === undefined || Number.isNaN(num)) {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
      }).format(0);
    }
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(num);
  },

  /**
   * Format as percentage: "85%", "12.5%"
   * @param num - Number or null/undefined (0-1 or 0-100 scale)
   * @param decimals - Number of decimal places (default: 0)
   * @param isDecimal - Whether input is in decimal form (0-1) vs percentage form (0-100) (default: false)
   * @returns Formatted percentage string or "0%" if invalid
   * @example
   * numberFormat.percent(85) // "85%"
   * numberFormat.percent(0.85, 0, true) // "85%"
   * numberFormat.percent(85.5, 1) // "85.5%"
   */
  percent: (
    num: number | null | undefined,
    decimals: number = 0,
    isDecimal: boolean = false,
  ): string => {
    if (num === null || num === undefined || Number.isNaN(num)) return "0%";

    const value = isDecimal ? num * 100 : num;
    return `${value.toFixed(decimals)}%`;
  },

  /**
   * Format file size in bytes to human-readable format: "1.2 MB", "45 KB"
   * @param bytes - Number of bytes or null/undefined
   * @returns Formatted file size string or "0 Bytes" if invalid
   * @example
   * numberFormat.fileSize(1234) // "1.21 KB"
   * numberFormat.fileSize(1234567) // "1.18 MB"
   * numberFormat.fileSize(0) // "0 Bytes"
   */
  fileSize: (bytes: number | null | undefined): string => {
    if (bytes === null || bytes === undefined || Number.isNaN(bytes)) {
      return "0 Bytes";
    }
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB"];
    const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));

    // Clamp to valid array index
    const sizeIndex = Math.min(i, sizes.length - 1);

    return `${parseFloat((bytes / k ** sizeIndex).toFixed(2))} ${sizes[sizeIndex]}`;
  },

  /**
   * Format number with ordinal suffix: "1st", "2nd", "3rd", "4th"
   * @param num - Number or null/undefined
   * @returns Number with ordinal suffix or "0th" if invalid
   * @example
   * numberFormat.ordinal(1) // "1st"
   * numberFormat.ordinal(22) // "22nd"
   * numberFormat.ordinal(103) // "103rd"
   */
  ordinal: (num: number | null | undefined): string => {
    if (num === null || num === undefined || Number.isNaN(num)) return "0th";

    const value = Math.floor(num);
    const lastDigit = value % 10;
    const lastTwoDigits = value % 100;

    // Special cases for 11th, 12th, 13th
    if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
      return `${value}th`;
    }

    switch (lastDigit) {
      case 1:
        return `${value}st`;
      case 2:
        return `${value}nd`;
      case 3:
        return `${value}rd`;
      default:
        return `${value}th`;
    }
  },
};

/**
 * Legacy compatibility: Format count with 'k' suffix for thousands
 * @deprecated Use numberFormat.compact() instead
 * @param count - Number or undefined
 * @returns Formatted count string
 */
export const formatCount = (count?: number): string => {
  if (!count) return "0";
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return count.toString();
};

/**
 * Legacy compatibility: Format count with locale string
 * @deprecated Use numberFormat.integer() instead
 * @param count - Number or undefined
 * @returns Formatted count string
 */
export const formatCountLocale = (count?: number): string => {
  if (!count) return "0";
  return count.toLocaleString();
};

/**
 * Legacy compatibility: Format file size in bytes to human-readable format
 * @deprecated Use numberFormat.fileSize() instead
 * @param bytes - Number of bytes
 * @returns Formatted file size string
 */
export const formatFileSize = (bytes: number): string => {
  return numberFormat.fileSize(bytes);
};
