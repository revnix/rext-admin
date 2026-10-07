"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

/**
 * An AlertDialog that asks before an action (design/app-language.md §6). Its buttons name the action
 * and its opposite, "Delete article" and "Keep article", so the confirm label is required: there is
 * no "Continue" to fall back on.
 */
interface ConfirmationDialogProps {
  children: React.ReactNode; // Trigger element
  title?: string;
  description?: string;
  confirmText: string;
  cancelText?: string;
  variant?: "default" | "destructive";
  onConfirm: () => void;
  onCancel?: () => void;
}

export function ConfirmationDialog({
  children,
  title = "Are you sure?",
  description = "This action cannot be undone.",
  confirmText,
  cancelText = "Cancel",
  variant = "default",
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) {
  const [open, setOpen] = useState(false);

  const handleConfirm = () => {
    onConfirm();
    setOpen(false);
  };

  const handleCancel = () => {
    onCancel?.();
    setOpen(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
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
            onClick={(e) => {
              e.stopPropagation();
              handleConfirm();
            }}
            className={
              variant === "destructive"
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : undefined
            }
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Hook for programmatic confirmation dialogs
export function useConfirmation() {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<{
    title: string;
    description: string;
    confirmText: string;
    cancelText: string;
    variant: "default" | "destructive";
    onConfirm: () => void;
    onCancel?: () => void;
  } | null>(null);

  const confirm = (options: {
    title?: string;
    description?: string;
    confirmText: string;
    cancelText?: string;
    variant?: "default" | "destructive";
  }) => {
    return new Promise<boolean>((resolve) => {
      setConfig({
        title: options.title ?? "Are you sure?",
        description: options.description ?? "This action cannot be undone.",
        confirmText: options.confirmText,
        cancelText: options.cancelText ?? "Cancel",
        variant: options.variant ?? "default",
        onConfirm: () => resolve(true),
        onCancel: () => resolve(false),
      });
      setIsOpen(true);
    });
  };

  const handleConfirm = () => {
    config?.onConfirm();
    setIsOpen(false);
  };

  const handleCancel = () => {
    config?.onCancel?.();
    setIsOpen(false);
  };

  const ConfirmationComponent = config ? (
    // Escape closes it with no button clicked: that is the cancel too, so `confirm` always answers.
    <AlertDialog
      open={isOpen}
      onOpenChange={(open) => (open ? setIsOpen(true) : handleCancel())}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{config.title}</AlertDialogTitle>
          <AlertDialogDescription>{config.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>
            {config.cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className={
              config.variant === "destructive"
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : undefined
            }
          >
            {config.confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ) : null;

  return {
    confirm,
    ConfirmationComponent,
  };
}
