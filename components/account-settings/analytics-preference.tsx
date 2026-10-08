"use client";

import { useEffect, useState } from "react";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import {
  analyticsMode,
  onConsentChange,
  writeConsent,
} from "@/lib/analytics-consent";

/**
 * The switch for analytics (rext-control task 712): on measures how this person uses the app,
 * linked to their account; off leaves anonymous counts of the pages opened. It shows the choice
 * as it stands (on by default outside the EEA, the UK and Switzerland; off until answered inside)
 * and applies a change at once. The choice is kept in this browser.
 */
export function AnalyticsPreference() {
  // Null until the choice, or the region when there is none, has been read.
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    void analyticsMode().then((mode) => {
      if (!cancelled) setAllowed(mode === "full");
    });
    const stopListening = onConsentChange((choice) =>
      setAllowed(choice === "granted"),
    );
    return () => {
      cancelled = true;
      stopListening();
    };
  }, []);

  return (
    <Field orientation="horizontal">
      <FieldContent>
        <FieldLabel htmlFor="analytics-allowed">
          Measure how I use Rext
        </FieldLabel>
        <FieldDescription id="analytics-allowed-help">
          The pages you open and what you do on them, linked to your account, so
          we can see what works and what doesn't. Off, only anonymous counts of
          the pages opened are kept. The choice is saved in this browser.
        </FieldDescription>
      </FieldContent>
      <Switch
        id="analytics-allowed"
        role="switch"
        checked={allowed === true}
        disabled={allowed === null}
        onCheckedChange={(on) => writeConsent(on ? "granted" : "denied")}
        aria-describedby="analytics-allowed-help"
      />
    </Field>
  );
}
