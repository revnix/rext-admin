"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { PageBand } from "@/components/layouts";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import {
  analyticsMode,
  onConsentChange,
  writeConsent,
} from "@/lib/analytics-consent";

// The legal pages live on the website.
const PRIVACY_URL = "https://rext.ai/privacy-policy";

/** Whether analytics is set up at all here; without it nobody is asked anything. */
const configured = () =>
  Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY) &&
  process.env.NEXT_PUBLIC_ANALYTICS_ENABLED !== "false";

/**
 * The one question about analytics (rext-control task 712), asked after signing in where the law
 * asks for it (the EEA, the UK and Switzerland) and nothing is chosen yet. Until it is answered
 * the app sends nothing. It is a band at the top of the page, in the shell's banner slot, so it
 * covers nothing on any screen: not a step's button on a phone, not a form's Save row. Both
 * answers are one press, the same size; the choice can be changed later in Settings, Data.
 */
export function AnalyticsConsentPrompt() {
  const { status } = useSession();
  const [asking, setAsking] = useState(false);

  useEffect(() => {
    if (status !== "authenticated" || !configured()) {
      setAsking(false);
      return;
    }
    let cancelled = false;
    void analyticsMode().then((mode) => {
      if (!cancelled) setAsking(mode === "wait");
    });
    // Answered here, in another tab, or switched in the settings: either way it's settled.
    const stopListening = onConsentChange(() => setAsking(false));
    return () => {
      cancelled = true;
      stopListening();
    };
  }, [status]);

  if (!asking) return null;

  return (
    <PageBand>
      <Notice
        title="May we measure how you use Rext?"
        action={
          <div className="flex gap-2">
            <Button
              data-rec="show"
              type="button"
              size="sm"
              onClick={() => writeConsent("granted")}
            >
              Allow
            </Button>
            <Button
              data-rec="show"
              type="button"
              size="sm"
              variant="outline"
              onClick={() => writeConsent("denied")}
            >
              No thanks
            </Button>
          </div>
        }
      >
        It shows us which pages and steps work and which don&rsquo;t: the pages
        you open and what you do on them, linked to your account. Later it may
        include recordings of the screen, with everything you type and all text
        hidden. You can change this in Settings, Data.{" "}
        <a
          href={PRIVACY_URL}
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-4"
        >
          Privacy policy
        </a>
      </Notice>
    </PageBand>
  );
}
