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
import type {
  BackendError,
  BackendServiceError,
  ErrorRecoveryAction,
} from "@/types/backend";
import type { BackendErrorCode } from "@/types/consistent-response";

interface ErrorAlertProps {
  error: BackendError | BackendServiceError;
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
function getErrorIcon(
  severity: BackendError["severity"] | BackendServiceError["severity"],
) {
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
  severity: BackendError["severity"] | BackendServiceError["severity"],
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
  onReload,
  className,
  showErrorId = process.env.NODE_ENV === "development",
}: ErrorAlertProps) {
  const [isRetrying, setIsRetrying] = React.useState(false);
  const ErrorIcon = getErrorIcon(error.severity);

  // Handle both BackendError and BackendServiceError types
  const contextualMessage =
    "type" in error
      ? getContextualErrorMessage(error as BackendError, operation)
      : error.message;

  // Enhanced error context for BackendServiceError
  const errorCode =
    "code" in error
      ? (error as BackendServiceError).code
      : "type" in error
        ? ("unknown_error" as BackendErrorCode)
        : ("unknown_error" as BackendErrorCode);
  const requestId =
    "requestId" in error
      ? (error as BackendServiceError).requestId
      : "requestId" in error
        ? (error as BackendError).requestId
        : undefined;
  const processingTime =
    "processingTime" in error
      ? (error as BackendServiceError).processingTime
      : undefined;
  const retryable =
    "retryable" in error
      ? (error as BackendServiceError).retryable
      : "isRetryable" in error
        ? (error as BackendError).isRetryable
        : false;
  const recoveryActions: ErrorRecoveryAction[] =
    "recoveryActions" in error
      ? (error as BackendError).recoveryActions
      : ["retry", "contact_support"];

  const handleRetry = async () => {
    if (!onRetry) return;

    setIsRetrying(true);
    try {
      onRetry();
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
          (("type" in error && error.type === "validation_error") ||
            errorCode === "validation_failed") &&
          !contextualMessage.includes("Missing required fields:") &&
          (() => {
            const validationErrors =
              "type" in error
                ? extractValidationErrors(error as BackendError)
                : [];
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

        {/* Enhanced error information for BackendServiceError */}
        {process.env.NODE_ENV === "development" && "code" in error && (
          <div className="mt-3 p-3 bg-blue-50 rounded-md">
            <p className="text-sm font-medium text-blue-700 mb-2">
              Enhanced Error Details:
            </p>
            <div className="text-sm text-blue-600 space-y-1">
              <div className="font-mono">Error Code: {errorCode}</div>
              {processingTime && (
                <div className="font-mono">
                  Processing Time: {processingTime}ms
                </div>
              )}
              {"statusCode" in error && (
                <div className="font-mono">
                  Status Code: {(error as BackendServiceError).statusCode}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Retry information */}
        {retryable &&
          ("retryAttempt" in error
            ? error.retryAttempt
            : "retryDelay" in error) && (
            <p className="text-sm text-muted-foreground">
              {"retryAttempt" in error
                ? `Attempt ${error.retryAttempt} of maximum retries`
                : "retryDelay" in error &&
                    (error as BackendServiceError).retryDelay
                  ? `Retry available in ${Math.ceil(((error as BackendServiceError).retryDelay || 0) / 1000)}s`
                  : "Retry available"}
            </p>
          )}

        {/* Network status for network-related errors */}
        {(("type" in error &&
          (error.type === "network_error" || error.type === "timeout_error")) ||
          errorCode === "network_error" ||
          errorCode === "timeout_error") && (
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
          actions={recoveryActions}
          onRetry={handleRetry}
          onGoBack={onGoBack}
          onContactSupport={onContactSupport}
          onReload={onReload}
          isRetrying={isRetrying}
        />

        {/* Error ID for debugging */}
        {showErrorId && requestId && (
          <p className="text-xs text-gray-400 mt-3 font-mono">
            Request ID: {requestId}
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
  error: BackendError | BackendServiceError;
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

      {("isRetryable" in error
        ? error.isRetryable
        : "retryable" in error
          ? error.retryable
          : false) &&
        onRetry && (
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
