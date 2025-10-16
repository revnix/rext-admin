/**
 * Simple Error Display Component
 * Displays error messages without requiring full BackendError type
 */

import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SimpleErrorDisplayProps {
  message: string;
  onRetry?: () => void;
}

export function SimpleErrorDisplay({
  message,
  onRetry,
}: SimpleErrorDisplayProps) {
  return (
    <div className="rounded-md bg-red-50 p-4 my-2">
      <div className="flex">
        <div className="flex-shrink-0">
          <AlertCircle className="h-5 w-5 text-red-400" />
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm text-red-800">{message}</p>
        </div>
        {onRetry && (
          <div className="ml-auto pl-3">
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="text-red-800 hover:bg-red-100"
            >
              Retry
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
