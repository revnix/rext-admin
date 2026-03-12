"use client";

import { AlertCircle, AlertTriangle, Loader2, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSubscriptionStore } from "@/stores/subscription-store";
import { buildCancellationReason } from "@/lib/subscription/cancellation-feedback";

/**
 * Cancel Subscription Modal Component
 *
 * Handles subscription cancellation with confirmation and feedback collection.
 *
 * Features:
 * - Clear explanation of what happens on cancellation
 * - Confirmation checkbox to prevent accidental cancellation
 * - Optional feedback collection
 * - Cancellation reasons tracking
 * - Shows when access will end
 * - Error handling
 */

interface CancelSubscriptionModalProps {
  /**
   * Whether the modal is open
   */
  open: boolean;

  /**
   * Callback when modal is closed
   */
  onOpenChange: (open: boolean) => void;

  /**
   * Current period end date
   */
  currentPeriodEnd: string | null;
}

const CANCELLATION_REASONS = [
  "Too expensive",
  "Not using it enough",
  "Missing features I need",
  "Found a better alternative",
  "Technical issues",
  "Temporary cancellation",
  "Other",
];

export function CancelSubscriptionModal({
  open,
  onOpenChange,
  currentPeriodEnd,
}: CancelSubscriptionModalProps) {
  const { cancelSubscription, fetchSubscription } = useSubscriptionStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [feedback, setFeedback] = useState("");

  const handleCancel = async () => {
    if (!confirmed) {
      toast.error("Please confirm cancellation");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Serialize UI feedback into a backend-safe reason string (≤500 chars)
      const cancellationReason = buildCancellationReason(
        selectedReasons,
        feedback,
      );

      // Cancel the subscription, forwarding user-provided reason to the API
      await cancelSubscription(cancellationReason);

      toast.success("Subscription cancelled", {
        description: currentPeriodEnd
          ? `You'll have access until ${new Date(currentPeriodEnd).toLocaleDateString()}`
          : "Your subscription has been cancelled.",
      });

      // TODO(TASK-130): Send cancellation feedback to backend analytics endpoint.
      if (selectedReasons.length > 0 || feedback) {
        // In a real implementation, you would send this to your backend:
        // await sendCancellationFeedback({ reasons: selectedReasons, feedback });
      }

      // Refresh subscription data
      await fetchSubscription();

      // Close modal
      onOpenChange(false);

      // Reset form
      setConfirmed(false);
      setSelectedReasons([]);
      setFeedback("");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to cancel subscription";
      setError(errorMessage);
      toast.error("Failed to cancel subscription", {
        description: errorMessage,
        action: {
          label: "Retry",
          onClick: () => {
            void handleCancel();
          },
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleReason = (reason: string) => {
    setSelectedReasons((prev) =>
      prev.includes(reason)
        ? prev.filter((r) => r !== reason)
        : [...prev, reason],
    );
  };

  const handleClose = () => {
    if (!isLoading) {
      onOpenChange(false);
      // Reset form after closing
      setTimeout(() => {
        setConfirmed(false);
        setSelectedReasons([]);
        setFeedback("");
        setError(null);
      }, 200);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <XCircle className="h-5 w-5" />
            Cancel Subscription
          </DialogTitle>
          <DialogDescription>
            We're sorry to see you go. Please review the information below
            before cancelling.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Warning Alert */}
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>What happens when you cancel:</strong>
              <ul className="mt-2 space-y-1 text-sm list-disc list-inside">
                <li>
                  {currentPeriodEnd
                    ? `You'll have access until ${new Date(currentPeriodEnd).toLocaleDateString()}`
                    : "Your access will end immediately"}
                </li>
                <li>All your data will be preserved for 30 days</li>
                <li>You can reactivate your subscription anytime</li>
                <li>No refunds for the current billing period</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Feedback Section */}
          <div className="space-y-3">
            <Label className="text-base">
              Help us improve - Why are you cancelling? (Optional)
            </Label>
            <div className="space-y-2">
              {CANCELLATION_REASONS.map((reason) => (
                <div key={reason} className="flex items-center space-x-2">
                  <Checkbox
                    id={`reason-${reason}`}
                    checked={selectedReasons.includes(reason)}
                    onCheckedChange={() => toggleReason(reason)}
                  />
                  <Label
                    htmlFor={`reason-${reason}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {reason}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Additional Feedback */}
          <div className="space-y-2">
            <Label htmlFor="feedback">Additional feedback (Optional)</Label>
            <Textarea
              id="feedback"
              placeholder="Tell us more about your experience or what we could do better..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Confirmation Checkbox */}
          <div className="flex items-start space-x-2 p-4 bg-muted rounded-lg">
            <Checkbox
              id="confirm-cancel"
              checked={confirmed}
              onCheckedChange={(checked) => setConfirmed(checked === true)}
            />
            <div className="flex-1">
              <Label
                htmlFor="confirm-cancel"
                className="text-sm font-medium cursor-pointer"
              >
                I understand that my subscription will be cancelled
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                This action will cancel your subscription at the end of the
                current billing period. You can reactivate anytime.
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Keep Subscription
          </Button>
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={isLoading || !confirmed}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cancelling...
              </>
            ) : (
              <>
                <XCircle className="mr-2 h-4 w-4" />
                Cancel Subscription
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
