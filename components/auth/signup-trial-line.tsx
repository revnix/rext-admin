"use client";

import { useQuery } from "@tanstack/react-query";
import { formatCount as count } from "@/lib/billing/credits";
import { subscriptionQueries } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import type { CatalogTrial } from "@/types/plan-catalog";

/**
 * The trial in one line, every figure from the catalogue: "A new account starts with a 7-day
 * trial: 60 credits, about 4 articles, no card needed."
 */
export function trialLine(trial: CatalogTrial): string {
  return `A new account starts with a ${count(trial.days)}-day trial: ${count(trial.credits)} credits, about ${count(trial.articles)} articles${trial.card_required ? "." : ", no card needed."}`;
}

/**
 * Sign-up's line naming the trial (C13). The backend owns the figures, so they come from the public
 * plan catalogue. While it loads, or when it fails, the line isn't there: the form never waits on it.
 */
export function SignupTrialLine({ className }: { className?: string }) {
  const { data } = useQuery({ ...subscriptionQueries.catalog(), retry: false });
  const trial = data?.trial;
  if (!trial) return null;
  return (
    <p className={cn("text-sm text-muted-foreground", className)}>
      {trialLine(trial)}
    </p>
  );
}
