"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  analyticsMode,
  onConsentChange,
  writeConsent,
} from "@/lib/analytics-consent";

// The legal pages live on the website.
const PRIVACY_URL = "https://rext.ai/privacy-policy";

/**
 * The one question about analytics (rext-control task 712), asked after signing in where the law
 * asks for it (the EEA, the UK and Switzerland) and nothing is chosen yet. Until it is answered
 * the app sends nothing. Both answers are one press, the same size; the choice can be changed
 * later in Settings, Data. Not a dialog: the page behind it stays usable.
 */
export function AnalyticsConsentPrompt() {
  const { status } = useSession();
  const [asking, setAsking] = useState(false);

  useEffect(() => {
    if (status !== "authenticated") {
      setAsking(false);
      return;
    }
    let cancelled = false;
    void analyticsMode().then((mode) => {
      if (!cancelled) setAsking(mode === "wait");
    });
    // Answered here, or switched in the settings on this page: either way it's settled.
    const stopListening = onConsentChange(() => setAsking(false));
    return () => {
      cancelled = true;
      stopListening();
    };
  }, [status]);

  if (!asking) return null;

  return (
    <section
      aria-labelledby="analytics-consent-title"
      className="fixed inset-x-4 bottom-[calc(var(--bottom-bar-height,0px)+var(--dock-height,0px)+--spacing(4))] z-(--z-overlay) flex flex-col gap-3 rounded-(--card-radius) border border-border bg-surface-raised p-4 shadow-overlay sm:left-auto sm:w-96 lg:right-6 lg:bottom-[calc(var(--dock-height,0px)+--spacing(6))]"
    >
      <div className="flex flex-col gap-1">
        <h2
          id="analytics-consent-title"
          className="text-section text-foreground"
        >
          May we measure how you use Rext?
        </h2>
        <p className="text-body text-muted-foreground">
          It shows us which pages and steps work and which don't: the pages you
          open and what you do on them, linked to your account. Later it may
          include recordings of the screen, with everything you type and all
          text hidden. You can change this in Settings, Data.{" "}
          <a
            href={PRIVACY_URL}
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-4 hover:text-foreground"
          >
            Privacy policy
          </a>
        </p>
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          className="flex-1"
          onClick={() => writeConsent("granted")}
        >
          Allow
        </Button>
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => writeConsent("denied")}
        >
          No thanks
        </Button>
      </div>
    </section>
  );
}
