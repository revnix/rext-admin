/**
 * Wizard AutoFill Alert Component
 *
 * This component displays an alert when form fields have been auto-filled
 * from a topic. It provides a button to clear these auto-filled values.
 *
 * Features:
 * - Shows count of auto-filled fields
 * - Confirmation dialog before clearing
 * - Only appears when there are clearable fields
 */

"use client";

import { Eraser } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

export interface WizardAutoFillAlertProps {
  /**
   * Number of fields that can be cleared
   */
  clearableFieldsCount: number;

  /**
   * Handler called when user confirms clearing auto-filled values
   */
  onClear: () => void;
}

/**
 * Alert component for managing auto-filled form values
 *
 * Displays a prominent alert at the top of the wizard when fields
 * have been automatically filled from topic data. Provides a clear
 * action to remove these pre-filled values if the user wants to
 * start fresh.
 *
 * @param props - Component props
 * @returns Alert component or null if no clearable fields
 */
export function WizardAutoFillAlert({
  clearableFieldsCount,
  onClear,
}: WizardAutoFillAlertProps) {
  // Don't render if there are no clearable fields
  if (clearableFieldsCount === 0) {
    return null;
  }

  return (
    <Alert className="border-blue-200 bg-blue-50/30">
      <AlertDescription className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="text-sm font-medium">
            {clearableFieldsCount} field
            {clearableFieldsCount !== 1 ? "s" : ""} pre-filled from topic
          </div>
          <div className="text-xs text-muted-foreground">
            You can clear these auto-filled values to start fresh
          </div>
        </div>
        <ConfirmationDialog
          title="Clear Auto-filled Values?"
          description={`This will clear ${clearableFieldsCount} field${clearableFieldsCount !== 1 ? "s" : ""} that were automatically filled from the topic. Fields you've edited will not be affected.`}
          confirmText="Clear Fields"
          variant="default"
          onConfirm={onClear}
        >
          <Button variant="outline" size="sm" className="gap-2">
            <Eraser className="h-4 w-4" />
            Clear Auto-filled Values
          </Button>
        </ConfirmationDialog>
      </AlertDescription>
    </Alert>
  );
}
