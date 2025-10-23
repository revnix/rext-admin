/**
 * Toast Hook - Wrapper around sonner's toast
 * This provides a consistent interface for displaying toast notifications
 */

import { toast as sonnerToast } from "sonner";

export function useToast() {
  return {
    toast: sonnerToast,
  };
}
