/**
 * Shared Type Definitions
 *
 * This module contains common interfaces and types used across multiple
 * modules in the application to avoid duplication.
 */

/**
 * Common option interface for select/multi-select components
 * Used throughout the application for consistent option structure
 */
export interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

/**
 * Extended option interface for select components that support custom values
 */
export interface SelectWithCustomOption extends SelectOption {
  allowCustom?: boolean;
}

/**
 * Common loading state interface
 */
export interface LoadingState {
  loading: boolean;
  message?: string;
}

/**
 * Common error state interface
 */
export interface ErrorState {
  error: string | Error | null;
  code?: string;
}

/**
 * Combined async state for components handling async operations
 */
export interface AsyncState extends LoadingState, ErrorState {
  success?: boolean;
}

/**
 * Common validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

/**
 * Base table row interface for data tables
 */
export interface BaseTableRow extends Record<string, unknown> {
  id: string;
}

/**
 * Common pagination interface
 */
export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/**
 * Common sort configuration interface
 */
export interface SortState {
  field: string;
  direction: "asc" | "desc";
}

/**
 * Common filter state interface
 */
export interface FilterState {
  searchQuery?: string;
  status?: string[];
  category?: string[];
  priority?: string[];
  dateRange?: {
    from: string;
    to: string;
  };
}
