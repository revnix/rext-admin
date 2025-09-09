"use client";

import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  Info,
  RefreshCw,
  RotateCcw,
  Wifi,
  WifiOff,
} from "lucide-react";
import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  extractValidationErrors,
  getContextualErrorMessage,
  isOnline,
} from "@/lib/error-utils";
import { cn } from "@/lib/utils";
import type { BackendError, ErrorRecoveryAction } from "@/types/backend";

interface ErrorAlertProps {
  error: BackendError;
  operation?: "topic_generation" | "form_validation" | "data_save";
  onRetry?: () => void;
  onGoBack?: () => void;
  onContactSupport?: () => void;
  onReload?: () => void;
  className?: string;
  showErrorId?: boolean;
}

/**
 * Get icon for error severity level
 */
function getErrorIcon(severity: BackendError["severity"]) {
  switch (severity) {
    case "low":
      return Info;
    case "medium":
      return AlertCircle;
    case "high":
    case "critical":
      return AlertTriangle;
    default:
      return AlertCircle;
  }
}

/**
 * Get alert variant based on error severity
 */
function getAlertVariant(
  severity: BackendError["severity"],
): "default" | "destructive" {
  return severity === "high" || severity === "critical"
    ? "destructive"
    : "default";
}

/**
 * Render recovery action buttons
 */
function RecoveryActions({
  actions,
  onRetry,
  onGoBack,
  onContactSupport,
  onReload,
  isRetrying,
}: {
  actions: ErrorRecoveryAction[];
  onRetry?: () => void;
  onGoBack?: () => void;
  onContactSupport?: () => void;
  onReload?: () => void;
  isRetrying?: boolean;
}) {
  if (actions.includes("none") || actions.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 mt-4">
      {actions.includes("retry") && onRetry && (
        <Button
          onClick={onRetry}
          disabled={isRetrying}
          size="sm"
          variant="outline"
        >
          <RefreshCw
            className={cn("h-4 w-4 mr-2", isRetrying && "animate-spin")}
          />
          {isRetrying ? "Retrying..." : "Try Again"}
        </Button>
      )}

      {actions.includes("go_back") && onGoBack && (
        <Button onClick={onGoBack} size="sm" variant="secondary">
          <RotateCcw className="h-4 w-4 mr-2" />
          Go Back
        </Button>
      )}

      {actions.includes("reload_page") && onReload && (
        <Button onClick={onReload} size="sm" variant="secondary">
          <RotateCcw className="h-4 w-4 mr-2" />
          Reload Page
        </Button>
      )}

      {actions.includes("contact_support") && onContactSupport && (
        <Button onClick={onContactSupport} size="sm" variant="secondary">
          <ExternalLink className="h-4 w-4 mr-2" />
          Contact Support
        </Button>
      )}

      {actions.includes("check_connection") && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {isOnline() ? (
            <>
              <CheckCircle className="h-4 w-4 text-green-500" />
              Connected
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4 text-red-500" />
              Offline
            </>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * User-friendly error alert component with recovery actions
 */
export function ErrorAlert({
  error,
  operation = "topic_generation",
  onRetry,
  onGoBack,
  onContactSupport,
  onReload = () => window.location.reload(),
  className,
  showErrorId = process.env.NODE_ENV === "development",
}: ErrorAlertProps) {
  const [isRetrying, setIsRetrying] = React.useState(false);
  const ErrorIcon = getErrorIcon(error.severity);
  const contextualMessage = getContextualErrorMessage(error, operation);

  const handleRetry = async () => {
    if (!onRetry) return;

    setIsRetrying(true);
    try {
      await onRetry();
    } catch (retryError) {
      console.error("Retry failed:", retryError);
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <Alert
      variant={getAlertVariant(error.severity)}
      className={cn("relative", className)}
    >
      <ErrorIcon className="h-4 w-4" />
      <AlertTitle className="mb-2">
        {error.severity === "critical"
          ? "Critical Error"
          : error.severity === "high"
            ? "Error"
            : "Notice"}
      </AlertTitle>
      <AlertDescription className="space-y-3">
        <p>{contextualMessage}</p>

        {/* Detailed validation errors in development - only if contextual message doesn't show field names */}
        {process.env.NODE_ENV === "development" &&
          error.type === "validation_error" &&
          !contextualMessage.includes("Missing required fields:") &&
          (() => {
            const validationErrors = extractValidationErrors(error);
            return validationErrors.length > 0 ? (
              <div className="mt-3 p-3 bg-gray-50 rounded-md">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Detailed validation errors:
                </p>
                <ul className="text-sm text-gray-600 space-y-1">
                  {validationErrors.map((err) => (
                    <li key={err} className="font-mono">
                      • {err}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null;
          })()}

        {/* Retry information */}
        {error.isRetryable && error.retryAttempt && (
          <p className="text-sm text-muted-foreground">
            Attempt {error.retryAttempt} of maximum retries
          </p>
        )}

        {/* Network status for network-related errors */}
        {(error.type === "network_error" || error.type === "timeout_error") && (
          <div className="flex items-center gap-2 text-sm">
            {isOnline() ? (
              <>
                <Wifi className="h-4 w-4 text-green-500" />
                <span>Internet connection detected</span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-red-500" />
                <span className="text-red-600">No internet connection</span>
              </>
            )}
          </div>
        )}

        {/* Recovery actions */}
        <RecoveryActions
          actions={error.recoveryActions}
          onRetry={handleRetry}
          onGoBack={onGoBack}
          onContactSupport={onContactSupport}
          onReload={onReload}
          isRetrying={isRetrying}
        />

        {/* Error ID for debugging */}
        {showErrorId && error.requestId && (
          <p className="text-xs text-gray-400 mt-3 font-mono">
            Request ID: {error.requestId}
          </p>
        )}
      </AlertDescription>
    </Alert>
  );
}

/**
 * Compact error alert for inline display
 */
export function CompactErrorAlert({
  error,
  onRetry,
  className,
}: {
  error: BackendError;
  onRetry?: () => void;
  className?: string;
}) {
  const [isRetrying, setIsRetrying] = React.useState(false);

  const handleRetry = async () => {
    if (!onRetry) return;

    setIsRetrying(true);
    try {
      onRetry();
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-md",
        className,
      )}
    >
      <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
      <p className="text-sm text-red-700 flex-1">{error.message}</p>

      {error.isRetryable && onRetry && (
        <Button
          onClick={handleRetry}
          disabled={isRetrying}
          size="sm"
          variant="outline"
          className="shrink-0"
        >
          {isRetrying ? (
            <RefreshCw className="h-3 w-3 animate-spin" />
          ) : (
            <RefreshCw className="h-3 w-3" />
          )}
        </Button>
      )}
    </div>
  );
}

/**
 * Success alert component for consistency
 */
export function SuccessAlert({
  title,
  message,
  className,
}: {
  title?: string;
  message: string;
  className?: string;
}) {
  return (
    <Alert
      data-testid="success-alert"
      className={cn("border-green-200 bg-green-50", className)}
    >
      <CheckCircle className="h-4 w-4 text-green-600" />
      {title && <AlertTitle className="text-green-800">{title}</AlertTitle>}
      <AlertDescription className="text-green-700">{message}</AlertDescription>
    </Alert>
  );
}

/**
 * Network status component for connection-dependent features
 */
export function NetworkStatus({
  showWhenOnline = false,
  className,
}: {
  showWhenOnline?: boolean;
  className?: string;
}) {
  const [online, setOnline] = React.useState(isOnline());

  React.useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (online && !showWhenOnline) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-md text-sm",
        online
          ? "bg-green-50 text-green-700 border border-green-200"
          : "bg-red-50 text-red-700 border border-red-200",
        className,
      )}
    >
      {online ? (
        <>
          <Wifi className="h-4 w-4" />
          Back online
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4" />
          You're offline
        </>
      )}
    </div>
  );
}
