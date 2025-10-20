"use client";

import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OnboardingCompleteProps {
  onComplete: () => void;
}

export function OnboardingComplete({ onComplete }: OnboardingCompleteProps) {
  return (
    <div className="space-y-6 py-8">
      {/* Success header */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="rounded-full bg-green-100 dark:bg-green-950 p-3">
            <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
          </div>
        </div>
        <h1 className="text-2xl font-semibold">You're All Set!</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Your account is ready. Start creating amazing content.
        </p>
      </div>

      {/* Complete button */}
      <div className="flex justify-center pt-2">
        <Button onClick={onComplete} size="lg" className="px-8">
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
}
