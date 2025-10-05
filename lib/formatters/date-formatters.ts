/**
 * Centralized date formatting utilities using date-fns
 *
 * Provides consistent date formatting across the application with proper null handling.
 * All functions return empty string for null/undefined inputs.
 *
 * @module date-formatters
 */

import {
  format,
  formatDistanceToNow,
  isValid,
  parseISO,
  isDate,
} from "date-fns";

/**
 * Parse a date input into a Date object
 * @param date - Date string, Date object, or null/undefined
 * @returns Valid Date object or null
 */
function parseDate(date: string | Date | null | undefined): Date | null {
  if (!date) return null;

  // If already a Date object, validate it
  if (isDate(date)) {
    return isValid(date) ? date : null;
  }

  // Try to parse as ISO string
  try {
    const parsed = parseISO(date);
    return isValid(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Date formatting functions with consistent patterns
 */
export const dateFormat = {
  /**
   * Format date as "Jan 15, 2024"
   * @param date - Date string, Date object, or null
   * @returns Formatted date string or empty string if invalid
   * @example
   * dateFormat.short("2024-01-15") // "Jan 15, 2024"
   * dateFormat.short(null) // ""
   */
  short: (date: string | Date | null | undefined): string => {
    const parsed = parseDate(date);
    if (!parsed) return "";
    return format(parsed, "MMM d, yyyy");
  },

  /**
   * Format date as "January 15, 2024"
   * @param date - Date string, Date object, or null
   * @returns Formatted date string or empty string if invalid
   * @example
   * dateFormat.long("2024-01-15") // "January 15, 2024"
   */
  long: (date: string | Date | null | undefined): string => {
    const parsed = parseDate(date);
    if (!parsed) return "";
    return format(parsed, "MMMM d, yyyy");
  },

  /**
   * Format date as "January 15, 2024 at 3:45 PM"
   * @param date - Date string, Date object, or null
   * @returns Formatted date string with time or empty string if invalid
   * @example
   * dateFormat.longWithTime("2024-01-15T15:45:00") // "January 15, 2024 at 3:45 PM"
   */
  longWithTime: (date: string | Date | null | undefined): string => {
    const parsed = parseDate(date);
    if (!parsed) return "";
    return format(parsed, "MMMM d, yyyy 'at' h:mm a");
  },

  /**
   * Format date as "Jan 15, 2024 at 3:45 PM"
   * @param date - Date string, Date object, or null
   * @returns Formatted date string with time or empty string if invalid
   * @example
   * dateFormat.shortWithTime("2024-01-15T15:45:00") // "Jan 15, 2024 at 3:45 PM"
   */
  shortWithTime: (date: string | Date | null | undefined): string => {
    const parsed = parseDate(date);
    if (!parsed) return "";
    return format(parsed, "MMM d, yyyy 'at' h:mm a");
  },

  /**
   * Format date as relative time "2 hours ago" / "3 days ago"
   * @param date - Date string, Date object, or null
   * @param options - Optional formatDistanceToNow options
   * @returns Relative time string or empty string if invalid
   * @example
   * dateFormat.relative("2024-01-15T12:00:00") // "2 hours ago"
   * dateFormat.relative("2024-01-15T12:00:00", { addSuffix: false }) // "2 hours"
   */
  relative: (
    date: string | Date | null | undefined,
    options?: { addSuffix?: boolean }
  ): string => {
    const parsed = parseDate(date);
    if (!parsed) return "";
    return formatDistanceToNow(parsed, { addSuffix: true, ...options });
  },

  /**
   * Format time only as "3:45 PM"
   * @param date - Date string, Date object, or null
   * @returns Formatted time string or empty string if invalid
   * @example
   * dateFormat.timeOnly("2024-01-15T15:45:00") // "3:45 PM"
   */
  timeOnly: (date: string | Date | null | undefined): string => {
    const parsed = parseDate(date);
    if (!parsed) return "";
    return format(parsed, "h:mm a");
  },

  /**
   * Format date as "01/15/2024"
   * @param date - Date string, Date object, or null
   * @returns Formatted date string or empty string if invalid
   * @example
   * dateFormat.numeric("2024-01-15") // "01/15/2024"
   */
  numeric: (date: string | Date | null | undefined): string => {
    const parsed = parseDate(date);
    if (!parsed) return "";
    return format(parsed, "MM/dd/yyyy");
  },

  /**
   * Format date as "2024-01-15" (ISO format)
   * @param date - Date string, Date object, or null
   * @returns ISO formatted date string or empty string if invalid
   * @example
   * dateFormat.iso(new Date("2024-01-15")) // "2024-01-15"
   */
  iso: (date: string | Date | null | undefined): string => {
    const parsed = parseDate(date);
    if (!parsed) return "";
    return format(parsed, "yyyy-MM-dd");
  },

  /**
   * Format date with custom format string
   * Uses date-fns format tokens: https://date-fns.org/docs/format
   * @param date - Date string, Date object, or null
   * @param formatString - date-fns format string
   * @returns Formatted date string or empty string if invalid
   * @example
   * dateFormat.custom("2024-01-15", "EEE, MMM d") // "Mon, Jan 15"
   */
  custom: (
    date: string | Date | null | undefined,
    formatString: string
  ): string => {
    const parsed = parseDate(date);
    if (!parsed) return "";
    return format(parsed, formatString);
  },
};

/**
 * Legacy compatibility: Format date to localized date string
 * @deprecated Use dateFormat.short() instead
 * @param dateString - Date string
 * @returns Formatted date string
 */
export const formatDate = (dateString: string): string => {
  return dateFormat.short(dateString);
};

/**
 * Legacy compatibility: Format date with custom options
 * @deprecated Use dateFormat.custom() instead
 * @param dateString - Date string
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string
 */
export const formatDateCustom = (
  dateString: string,
  options?: Intl.DateTimeFormatOptions
): string => {
  const parsed = parseDate(dateString);
  if (!parsed) return "";
  return new Date(parsed).toLocaleDateString("en-US", options);
};
