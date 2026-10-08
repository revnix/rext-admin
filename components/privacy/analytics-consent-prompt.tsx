"use client";

import { useMutation } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { PageBand } from "@/components/layouts";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { RECORDING_ON } from "@/lib/analytics-recording";
import { isImpersonating } from "@/lib/analytics";
import {
  type AnswerStanding,
  analyticsMode,
  type ConsentChoice,
  consentRegion,
  onConsentChange,
  readConsent,
  reconcileAnswer,
  takeConsent,
  writeConsent,
} from "@/lib/analytics-consent";
import { apiClient } from "@/lib/api-client";

// The legal pages live on the website.
const PRIVACY_URL = "https://rext.ai/privacy-policy";

/** Whether analytics is set up at all here; without it nobody is asked anything. */
const configured = () =>
  Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY) &&
  process.env.NEXT_PUBLIC_ANALYTICS_ENABLED !== "false";

/** Where this browser keeps how its answer stands against the account's, per account. */
const standingKey = (userId: string) => `rext-analytics-answer:${userId}`;

function readStanding(userId: string): AnswerStanding {
  try {
    const kept = window.localStorage.getItem(standingKey(userId));
    return kept === "synced" || kept === "unsent" ? kept : "new";
  } catch {
    return "new";
  }
}

function keepStanding(userId: string, standing: AnswerStanding): void {
  try {
    window.localStorage.setItem(standingKey(userId), standing);
  } catch {
    // No storage: the two are compared afresh on the next page.
  }
}

/**
 * The one question about analytics (rext-control task 712), asked after signing in where the law
 * asks for it (the EEA, the UK and Switzerland) and nothing is chosen yet. Until it is answered
 * the app sends nothing. It is a band at the top of the page, in the shell's banner slot, so it
 * covers nothing on any screen: not a step's button on a phone, not a form's Save row. Both
 * answers are one press, the same size; the choice can be changed later in Settings, Data.
 *
 * The answer is kept on the account as well as in this browser. So an answer given in another
 * browser is this one's too and nobody is asked twice; and the backend, which reports what no
 * browser sees (a run finished, credits spent), names the person only where their answer allows
 * it. Before asking, this browser's answer and the account's are brought together
 * (reconcileAnswer); every choice made after that goes to the account at once. Never while an
 * admin acts as a customer: the browser is the admin's, and the backend refuses it too.
 */
export function AnalyticsConsentPrompt() {
  const { data: session, status } = useSession();
  const userId = session?.user?.id;
  const [asking, setAsking] = useState(false);
  const { mutateAsync: store } = useMutation({
    mutationFn: async (answer: ConsentChoice | null) =>
      apiClient.profile.storeAnalyticsAnswer(answer, await consentRegion()),
  });

  useEffect(() => {
    if (status !== "authenticated" || !userId || !configured()) {
      setAsking(false);
      return;
    }
    let cancelled = false;
    const settle = async () => {
      if (!isImpersonating()) {
        try {
          // A null answer writes the region only and reads what the account holds.
          const stored = await store(null);
          const { put, take } = reconcileAnswer(
            readConsent(),
            stored.answer,
            readStanding(userId),
          );
          if (take) takeConsent(take);
          if (put) await store(put);
          keepStanding(userId, "synced");
        } catch {
          // The backend didn't answer: this browser's own answer stands until the next page.
        }
      }
      const mode = await analyticsMode();
      if (!cancelled) setAsking(mode === "wait");
    };
    void settle();
    // Answered here, in another tab, in the settings or on the website: either way it's
    // settled, and a choice the person made goes to their account.
    const stopListening = onConsentChange((choice, origin) => {
      setAsking(false);
      if (origin !== "chosen" || isImpersonating()) return;
      keepStanding(userId, "unsent");
      store(choice).then(
        () => keepStanding(userId, "synced"),
        () => {
          // Sent first when the two are next brought together.
        },
      );
    });
    return () => {
      cancelled = true;
      stopListening();
    };
  }, [status, userId, store]);

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
        you open and what you do on them, linked to your account.{" "}
        {RECORDING_ON
          ? "It includes recordings of the screen, with everything you type and all text hidden except our own buttons, menus and labels."
          : "Later it may include recordings of the screen, with everything you type and all text hidden."}{" "}
        You can change this in Settings, Data.{" "}
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
