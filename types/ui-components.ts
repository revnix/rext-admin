/**
 * UI Components Types
 * Consolidated interfaces for shared UI components
 */

import type { LucideIcon } from "lucide-react";
import type {
  RowAction,
  TableActionGroup as TableActionGroupType,
} from "./data-table";
import type { BaseTableRow } from "./shared";

// Form Components
export interface FormFieldProps {
  children: React.ReactNode;
  label?: string;
  error?: string;
  warning?: string;
  description?: string;
  isValid?: boolean;
  required?: boolean;
  className?: string;
  htmlFor?: string;
}

export interface ValidationInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  validate?: (value: string) => string | undefined;
  formatValue?: (value: string) => string;
  parseValue?: (value: string) => string;
}

// Progress Components
export interface CircularProgressProps {
  value: number;
  size?: "sm" | "md" | "lg" | "xl";
  strokeWidth?: number;
  className?: string;
  showValue?: boolean;
  color?: "primary" | "secondary" | "success" | "warning" | "error";
}

// Slider
export interface SliderProps
  extends Omit<React.ComponentProps<"input">, "type" | "onChange"> {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  formatValue?: (value: number) => string;
  showValue?: boolean;
  marks?: Array<{ value: number; label?: string }>;
}

// Error Components
export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

export interface ErrorAlertProps {
  title?: string;
  message: string;
  error?: Error;
  action?: {
    label: string;
    onClick: () => void;
  };
  dismissible?: boolean;
  onDismiss?: () => void;
  variant?: "error" | "warning" | "info";
  className?: string;
}

// Table Components
export interface TableActionButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> {
  onClick: () => void | Promise<void>;
  icon?: LucideIcon;
  label: string;
  variant?: "ghost" | "outline" | "destructive";
  size?: "sm" | "md";
  loading?: boolean;
  tooltip?: string;
}

export interface TableActionGroupProps
  extends Omit<TableActionGroupType, "id"> {
  data: BaseTableRow[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

export interface TableActionBarProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  actions: Array<{
    id: string;
    label: string;
    icon?: LucideIcon;
    variant?: "default" | "destructive";
    onClick: () => void | Promise<void>;
  }>;
}

export interface TableSkeletonProps {
  columns: number;
  rows?: number;
  showHeader?: boolean;
}

export interface ActionsCell<T extends Record<string, unknown> = BaseTableRow> {
  row: T;
  actions: RowAction<T>[];
}

// Select Components
export interface SelectWithCustomProps {
  value?: string;
  onValueChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  customLabel?: string;
  customPlaceholder?: string;
  allowCustom?: boolean;
  disabled?: boolean;
  className?: string;
}

export interface RadioOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface RadioGroupProps {
  value?: string;
  onValueChange: (value: string) => void;
  options: RadioOption[];
  name?: string;
  disabled?: boolean;
  className?: string;
}

export interface MultiSelectProps {
  value: string[];
  onValueChange: (value: string[]) => void;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  placeholder?: string;
  disabled?: boolean;
  maxItems?: number;
  className?: string;
}

export interface CheckboxOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface CheckboxGroupProps {
  value: string[];
  onValueChange: (value: string[]) => void;
  options: CheckboxOption[];
  disabled?: boolean;
  className?: string;
}

// Sidebar
export interface CookieStore {
  get: (name: string) => string | undefined;
  set: (name: string, value: string, options?: Record<string, unknown>) => void;
}

export type SidebarContextProps = {
  state: "open" | "closed";
  open: boolean;
  setOpen: (open: boolean) => void;
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
};

// Dialogs
export interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
  loading?: boolean;
}

export interface CommandDialogProps {
  isOpen: boolean;
  onClose: () => void;
  placeholder?: string;
  children: React.ReactNode;
}

// Filter
export interface FilterPopoverProps<T extends Record<string, unknown>> {
  data: T[];
  onFilter: (filteredData: T[]) => void;
  filterConfig: Array<{
    key: keyof T;
    label: string;
    type: "text" | "select" | "date" | "number";
    options?: Array<{ label: string; value: unknown }>;
  }>;
  trigger?: React.ReactNode;
}

// Badge
export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline";
  size?: "sm" | "md" | "lg";
}

// Sonner Toast
export interface ToasterProps {
  theme?: "light" | "dark" | "system";
  position?:
    | "top-left"
    | "top-center"
    | "top-right"
    | "bottom-left"
    | "bottom-center"
    | "bottom-right";
  hotkey?: string[];
  richColors?: boolean;
  expand?: boolean;
  duration?: number;
  gap?: number;
  visibleToasts?: number;
  closeButton?: boolean;
  toastOptions?: {
    className?: string;
    duration?: number;
    unstyled?: boolean;
  };
  className?: string;
  style?: React.CSSProperties;
}

// TypeForm UI Components
export interface NumberInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export interface SingleSelectCardProps {
  options: Array<{
    value: string;
    label: string;
    description?: string;
    icon?: LucideIcon;
    disabled?: boolean;
  }>;
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
  rows?: number;
  className?: string;
}

export interface TextAreaInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
  rows?: number;
  className?: string;
}

export type {
  ChipInputProps,
  ControlledChipInputProps,
} from "@/components/ui/typeform/chip-input";

export interface MultiSelectCardProps {
  options: Array<{
    value: string;
    label: string;
    description?: string;
    icon?: LucideIcon;
    disabled?: boolean;
  }>;
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
  maxSelections?: number;
  className?: string;
}
