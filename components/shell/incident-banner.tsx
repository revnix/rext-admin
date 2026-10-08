"use client";

import { useQuery } from "@tanstack/react-query";

import { PageBand } from "@/components/layouts";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { Notice } from "@/components/ui/notice";
import { incidentBannerQueryOptions, shownBanner } from "@/lib/incident-banner";

/**
 * The incident banner (rext-control#728): one calm notice on every signed-in page while a provider
 * or our own servers are failing, switched on and off by a super admin with no deploy. It sits in
 * the shell's banner place, above the page.
 *
 * It can never hold or break a page: the read happens after the page is up, is dropped after four
 * seconds and isn't retried before the next minute; no answer, a failed one or one that isn't a
 * banner shows nothing; and its own boundary turns anything thrown here into nothing as well. The
 * message is the super admin's plain text, rendered as text.
 */
export function IncidentBanner() {
  return (
    // The shared boundary with nothing as its fallback: a banner that throws is simply not there.
    <ErrorBoundary fallback={null}>
      <IncidentBannerNotice />
    </ErrorBoundary>
  );
}

function IncidentBannerNotice() {
  const { data } = useQuery(incidentBannerQueryOptions());
  const banner = shownBanner(data);
  if (!banner) return null;
  return (
    <PageBand>
      <Notice tone="warning" title="We're having trouble right now">
        <span className="break-words">{banner.message}</span>
        {banner.affected && (
          <span className="mt-1 block text-muted-foreground">
            Affected: {banner.affected}.
          </span>
        )}
      </Notice>
    </PageBand>
  );
}
