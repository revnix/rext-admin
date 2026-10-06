/**
 * Shared Type Definitions
 *
 * This module contains common interfaces and types used across multiple
 * modules in the application to avoid duplication.
 */

import type * as React from "react";

/**
 * Standard props for icon components (Lucide React icons)
 */
export interface IconProps {
  className?: string;
  size?: number | string;
  color?: string;
  strokeWidth?: number | string;
}

/**
 * Icon component type for consistent icon usage
 */
export type IconComponent = React.ComponentType<IconProps>;

/**
 * Common option interface for select/multi-select components
 * Used throughout the application for consistent option structure
 */
export interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
  tooltip?: string;
  description?: string;
  icon?: IconComponent;
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

/**
 * Common event handler types for components
 */
export type ClickHandler = () => void;
export type ChangeHandler<T = string> = (value: T) => void;
export type SubmitHandler = () => void | Promise<void>;
export type SelectHandler<T = string> = (value: T) => void;

/**
 * Common form event handlers
 */
export interface FormEventHandlers<T = Record<string, unknown>> {
  onSubmit?: (data: T) => void | Promise<void>;
  onChange?: (data: Partial<T>) => void;
  onReset?: () => void;
  onValidation?: (result: ValidationResult) => void;
  onError?: (error: string | Error) => void;
}

/**
 * Common data table event handlers
 */
export interface DataTableEventHandlers<T = Record<string, unknown>> {
  onRowClick?: (row: T) => void;
  onSort?: (field: string, direction: "asc" | "desc") => void;
  onFilter?: (filters: FilterState) => void;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
}

/**
 * Common modal/dialog event handlers
 */
export interface DialogEventHandlers {
  onOpen?: () => void;
  onClose?: () => void;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
}

/**
 * Generic type for form field values
 * Covers common form field types
 */
export type FormFieldValue =
  | string
  | number
  | boolean
  | string[]
  | number[]
  | Date
  | Record<string, unknown> // For complex objects
  | null
  | undefined;

/**
 * Type for extracting field values from a form data type
 */
export type FieldValue<T, K extends keyof T> = T[K] extends FormFieldValue
  ? T[K]
  : FormFieldValue;

/**
 * Validation result interface for form validation
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}
