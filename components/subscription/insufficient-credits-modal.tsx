"use client";

import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useSubscriptionStore } from "@/stores/subscription-store";

interface InsufficientCreditsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  errorDetail?: string;
  statusCode?: 402 | 429;
}

export function InsufficientCreditsModal({
  open,
  onOpenChange,
  errorDetail,
  statusCode,
}: InsufficientCreditsModalProps) {
  const router = useRouter();
  const { credits } = useSubscriptionStore();

  const handleUpgrade = () => {
    onOpenChange(false);
    router.push("/subscription");
  };

  const isNoSubscription = statusCode === 402;
  const resetDate = credits?.credits_reset_date
    ? format(new Date(credits.credits_reset_date), "MMM d, yyyy")
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isNoSubscription ? "Subscription Required" : "Insufficient Credits"}
          </DialogTitle>
          <DialogDescription className="pt-3 pb-2 text-base">
            {isNoSubscription
              ? "You need an active subscription to generate articles."
              : errorDetail || "You do not have enough credits to generate this article."}
            {!isNoSubscription && resetDate && (
              <span className="block mt-2 font-medium text-foreground">
                Your credits will reset on {resetDate}.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleUpgrade}>
            {isNoSubscription ? "Start with Starter — $39/mo" : "Upgrade Plan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
