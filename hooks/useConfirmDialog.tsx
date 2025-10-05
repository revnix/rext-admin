/**
 * useConfirmDialog Hook
 *
 * A reusable hook for showing confirmation dialogs with Promise-based API.
 * Returns a confirm function and a Dialog component to render.
 *
 * @example
 * ```tsx
 * const { confirm, ConfirmDialog } = useConfirmDialog({
 *   title: "Delete Item",
 *   description: "Are you sure you want to delete this item?",
 *   confirmText: "Delete",
 *   variant: "destructive"
 * });
 *
 * const handleDelete = async () => {
 *   const confirmed = await confirm();
 *   if (confirmed) {
 *     // Perform delete action
 *   }
 * };
 *
 * return (
 *   <>
 *     <button onClick={handleDelete}>Delete</button>
 *     <ConfirmDialog />
 *   </>
 * );
 * ```
 */

import { useCallback, useRef, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export interface ConfirmDialogOptions {
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive";
}

export interface ConfirmDialogResult {
  confirm: () => Promise<boolean>;
  ConfirmDialog: () => JSX.Element;
  isOpen: boolean;
}

/**
 * Hook for creating a confirmation dialog with Promise-based API
 */
export function useConfirmDialog(
  options: ConfirmDialogOptions
): ConfirmDialogResult {
  const {
    title,
    description,
    confirmText = "Confirm",
    cancelText = "Cancel",
    variant = "default",
  } = options;

  const [isOpen, setIsOpen] = useState(false);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((): Promise<boolean> => {
    setIsOpen(true);
    return new Promise((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  const handleConfirm = useCallback(() => {
    if (resolveRef.current) {
      resolveRef.current(true);
      resolveRef.current = null;
    }
    setIsOpen(false);
  }, []);

  const handleCancel = useCallback(() => {
    if (resolveRef.current) {
      resolveRef.current(false);
      resolveRef.current = null;
    }
    setIsOpen(false);
  }, []);

  const ConfirmDialog = useCallback((): JSX.Element => {
    return (
      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription>{description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>
              {cancelText}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className={
                variant === "destructive"
                  ? "bg-red-600 hover:bg-red-700 focus:ring-red-600"
                  : ""
              }
            >
              {confirmText}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }, [
    isOpen,
    title,
    description,
    confirmText,
    cancelText,
    variant,
    handleConfirm,
    handleCancel,
  ]);

  return {
    confirm,
    ConfirmDialog,
    isOpen,
  };
}
