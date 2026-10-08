"use client";

import type { Route } from "next";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { analytics } from "@/lib/analytics";
import { workspaceRoutes } from "@/lib/routes";

/**
 * On the home page of a workspace made with "Skip for now" (rext-control task 905): it has no
 * brand voice yet, and this is the one way to give it one, a website to read or a description of
 * the business. Everything else on the page works meanwhile; the card goes once the workspace
 * is set up.
 */
export function WorkspaceSetupCard({ slug }: { slug: string }) {
  // Seen once per page load, however often the page renders.
  const shown = useRef(false);
  useEffect(() => {
    if (shown.current) return;
    shown.current = true;
    analytics.track("workspace_setup_card_shown", { place: "home" });
  }, []);

  return (
    <Notice
      tone="info"
      title="Tell Rext about your business"
      action={
        <Button data-rec="show" asChild size="sm">
          <Link
            href={workspaceRoutes.setup(slug) as Route}
            onClick={() =>
              analytics.track("workspace_setup_card_used", {
                action: "continue",
              })
            }
          >
            Set up my brand voice
          </Link>
        </Button>
      }
    >
      Add your website or describe your business, and Rext writes in your voice.
      You can start an article before you do.
    </Notice>
  );
}
