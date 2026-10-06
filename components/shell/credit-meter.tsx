"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import { Meter } from "@/components/ui/meter";
import { cn } from "@/lib/utils";
import { useSubscriptionStore } from "@/stores/subscription-store";
import { useWorkspaceStore } from "@/stores/workspace";
import type { CreditBalance } from "@/types/subscription";
import { settingsRoutes } from "@/lib/routes";

/** Under a fifth of the month's credits left, the bar takes the warning colour. */
const LOW_SHARE = 0.2;

/**
 * The credits of the page's scope: the workspace owner's on a workspace page, the signed-in
 * person's own elsewhere. The store single-flights and throttles the fetch per scope, so the
 * header's meter and the sidebar's share one request.
 */
function useShellCredits(): CreditBalance | null {
  const { workspaceSlug } = useParams<{ workspaceSlug?: string }>();
  const onWorkspacePage = Boolean(workspaceSlug);
  const currentWorkspaceId = useWorkspaceStore(
    (state) => state.currentWorkspace?.id,
  );
  const credits = useSubscriptionStore((state) => state.credits);
  const fetchCredits = useSubscriptionStore((state) => state.fetchCredits);
  const workspaceId = onWorkspacePage ? currentWorkspaceId : undefined;

  useEffect(() => {
    // The workspace provider sets id "" while the workspace loads: wait for the real one.
    if (onWorkspacePage && !workspaceId) return;
    fetchCredits(workspaceId).catch(() => {});
  }, [onWorkspacePage, workspaceId, fetchCredits]);

  return credits;
}

function describe(credits: CreditBalance) {
  const left = credits.current_credits;
  const total = credits.credits_per_month;
  const share =
    total && total > 0 ? Math.min(1, Math.max(0, left / total)) : null;
  const articles =
    credits.articles_remaining !== null
      ? `about ${credits.articles_remaining.toLocaleString()} articles`
      : null;
  const label =
    total !== null
      ? `${left.toLocaleString()} of ${total.toLocaleString()} credits left`
      : `${left.toLocaleString()} credits left`;
  return {
    left,
    total,
    share,
    low: share !== null && share < LOW_SHARE,
    label: [label, articles].filter(Boolean).join(", "),
  };
}

/**
 * The credits meter (design/app-language.md §5): in the header, the balance with a short bar; in
 * the sidebar's footer, the bar and "412 of 1,000 credits". Both open the usage page.
 */
export function CreditMeter({
  variant,
  className,
}: {
  variant: "header" | "sidebar";
  className?: string;
}) {
  const credits = useShellCredits();
  if (!credits) return null;
  const { left, total, share, low, label } = describe(credits);

  if (variant === "header") {
    return (
      <Link
        href={settingsRoutes.usage}
        aria-label={`${label}. Open usage`}
        className={cn(
          "h-8 items-center gap-2 rounded-sm px-2 max-lg:h-(--control-height-lg) text-label text-muted-foreground transition-colors duration-(--duration-fast) ease-out hover:bg-surface-inset hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
          className,
        )}
      >
        {share !== null && total !== null && (
          <Meter value={left} max={total} low={low} className="w-10" />
        )}
        <span>
          <span className="num font-medium text-foreground">
            {left.toLocaleString()}
          </span>{" "}
          credits
        </span>
        {credits.articles_remaining !== null && (
          <span className="hidden xl:inline">
            ·{" "}
            <span className="num">
              {credits.articles_remaining.toLocaleString()}
            </span>{" "}
            articles
          </span>
        )}
      </Link>
    );
  }

  return (
    <Link
      href={settingsRoutes.usage}
      aria-label={`${label}. Open usage`}
      data-collapse="hide"
      className={cn(
        "block rounded-sm px-3 py-2 transition-colors duration-(--duration-fast) ease-out hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:outline-none",
        className,
      )}
    >
      {share !== null && total !== null && (
        <Meter value={left} max={total} low={low} />
      )}
      <span className="mt-2 block text-caption text-muted-foreground">
        <span className="num font-medium text-foreground">
          {left.toLocaleString()}
        </span>
        {total !== null && (
          <>
            {" "}
            of <span className="num">{total.toLocaleString()}</span>
          </>
        )}{" "}
        credits
      </span>
    </Link>
  );
}
