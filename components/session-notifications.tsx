"use client";

import { Clock, RefreshCw, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getAllSessionMetadata } from "@/lib/session-storage";
import { cn } from "@/lib/utils";
import type { SessionData, SessionMetadata } from "@/types/session";

interface SessionNotificationsProps {
  session: SessionData | null;
  isLoading: boolean;
  error: string | null;
  onSessionRecover: (sessionId: string) => void;
  onRetryLoad: () => void;
  className?: string;
}

/**
 * Format time remaining in a human-readable format
 */
function formatTimeRemaining(expiresAt: number): string {
  const now = Date.now();
  const remaining = Math.max(0, expiresAt - now);

  if (remaining === 0) {
    return "expired";
  }

  const hours = Math.floor(remaining / (1000 * 60 * 60));
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
  } else if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  } else {
    return `${minutes}m`;
  }
}

/**
 * Format industry name for display
 */
function formatIndustryName(industry: string): string {
  return industry
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Format content type for display
 */
function formatContentType(contentType: string): string {
  return contentType
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Session Recovery Dialog Component
 */
interface SessionRecoveryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onRecover: (sessionId: string) => void;
  availableSessions: SessionMetadata[];
}

function SessionRecoveryDialog({
  isOpen,
  onClose,
  onRecover,
  availableSessions,
}: SessionRecoveryDialogProps) {
  const handleRecover = (sessionId: string) => {
    onRecover(sessionId);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Recover Previous Session</DialogTitle>
          <DialogDescription>
            Select a previous session to recover your generated topics.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {availableSessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-2" />
              <p>No previous sessions available</p>
              <p className="text-sm">Sessions expire after 24 hours</p>
            </div>
          ) : (
            availableSessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium">
                      {formatIndustryName(session.industry)} Topics
                    </h3>
                    <span className="text-sm text-muted-foreground">
                      ({session.topicCount} results)
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>
                      Content Type: {formatContentType(session.contentType)}
                    </p>
                    <p>
                      Created:{" "}
                      {new Date(session.createdAt).toLocaleDateString()} at{" "}
                      {new Date(session.createdAt).toLocaleTimeString()}
                    </p>
                    <p>Expires in: {formatTimeRemaining(session.expiresAt)}</p>
                  </div>
                </div>
                <Button
                  onClick={() => handleRecover(session.id)}
                  size="sm"
                  className="ml-4"
                >
                  Recover
                </Button>
              </div>
            ))
          )}
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Session Notifications Component
 *
 * Displays various session-related notifications including:
 * - Session expiration warnings
 * - Session recovery options
 * - Error notifications for missing/expired sessions
 */
export function SessionNotifications({
  session,
  isLoading,
  error,
  onSessionRecover,
  onRetryLoad,
  className,
}: SessionNotificationsProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [showRecoveryDialog, setShowRecoveryDialog] = useState(false);
  const [availableSessions, setAvailableSessions] = useState<SessionMetadata[]>(
    [],
  );
  const [showExpirationWarning, setShowExpirationWarning] = useState(false);

  // Update time remaining every minute
  useEffect(() => {
    if (!session) return;

    const updateTimeRemaining = () => {
      const remaining = formatTimeRemaining(session.expiresAt);
      setTimeRemaining(remaining);

      // Show expiration warning when less than 2 hours remaining
      const hoursRemaining =
        Math.max(0, session.expiresAt - Date.now()) / (1000 * 60 * 60);
      setShowExpirationWarning(hoursRemaining > 0 && hoursRemaining < 2);
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [session]);

  // Load available sessions when needed for recovery
  const loadAvailableSessions = () => {
    try {
      const sessions = getAllSessionMetadata();
      // Filter out current session if it exists
      const filtered = session
        ? sessions.filter((s) => s.id !== session.id)
        : sessions;
      setAvailableSessions(filtered);
      setShowRecoveryDialog(true);
    } catch (error) {
      console.error("Failed to load available sessions:", error);
    }
  };

  // Don't show anything while loading
  if (isLoading) {
    return null;
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Session Expiration Warning - Only show when session is close to expiring */}
      {session && showExpirationWarning && timeRemaining !== "expired" && (
        <Alert className="border-orange-200 bg-orange-50">
          <Clock className="h-4 w-4 text-orange-600" />
          <AlertTitle className="text-orange-800">
            Session Expiring Soon
          </AlertTitle>
          <AlertDescription className="text-orange-700">
            This temporary session will expire in {timeRemaining}. Save your
            favorite topics to keep them permanently.
          </AlertDescription>
        </Alert>
      )}

      {/* Active Session Info - Only show when session exists and not close to expiring */}
      {session && !showExpirationWarning && timeRemaining !== "expired" && (
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertTitle>Temporary Session Active</AlertTitle>
          <AlertDescription>
            These results are stored temporarily and will expire in{" "}
            {timeRemaining}. Save your favorite topics to keep them permanently.
          </AlertDescription>
        </Alert>
      )}

      {/* Error State - Missing or Expired Session */}
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Session Not Available</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>{error}</p>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={onRetryLoad}
                size="sm"
                variant="outline"
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Retry
              </Button>
              <Button
                onClick={loadAvailableSessions}
                size="sm"
                variant="outline"
                className="gap-2"
              >
                <Search className="h-4 w-4" />
                Recover Previous Session
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Session Recovery Dialog */}
      <SessionRecoveryDialog
        isOpen={showRecoveryDialog}
        onClose={() => setShowRecoveryDialog(false)}
        onRecover={onSessionRecover}
        availableSessions={availableSessions}
      />
    </div>
  );
}
