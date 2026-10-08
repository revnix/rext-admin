/**
 * @jest-environment jsdom
 * @jest-environment-options {"url": "https://app.rext.ai/w/acme/content"}
 */

/**
 * What the consent rule relies on in posthog-js itself (rext-control task 712), run with the real
 * library and browser storage: started as the provider starts it, it captures and stores nothing
 * until it is told; after a no it counts without an identity and still stores nothing about the
 * person; after a yes it works as usual. A recorder in before_send keeps each event and drops it,
 * so nothing is sent.
 */

import posthog, { type CaptureResult } from "posthog-js";
import { VISITOR_STORE_OPTIONS } from "@/lib/analytics-redact";

/** The names of the cookies the page can see. */
const cookieNames = () =>
  document.cookie
    .split(";")
    .map((part) => part.trim().split("=")[0])
    .filter(Boolean);

/** Removes every cookie, whether it was set for this host or for the whole of rext.ai. */
function clearCookies(): void {
  for (const name of cookieNames()) {
    for (const domain of ["", "; Domain=.rext.ai"]) {
      // biome-ignore lint/suspicious/noDocumentCookie: the test's own reset of the browser
      document.cookie = `${name}=; Max-Age=0; Path=/${domain}`;
    }
  }
}

function start(name: string) {
  window.localStorage.clear();
  window.sessionStorage.clear();
  clearCookies();
  const seen: CaptureResult[] = [];
  const client = posthog.init(
    "phc_test_not_a_real_key",
    {
      api_host: "http://127.0.0.1:9", // never reached: every event is dropped
      // As the provider does it: the id in the cookie rext.ai shares, and in storage.
      ...VISITOR_STORE_OPTIONS,
      autocapture: false,
      capture_pageview: false,
      capture_pageleave: false,
      disable_session_recording: true,
      advanced_disable_flags: true,
      cookieless_mode: "on_reject",
      before_send: (event) => {
        if (event) seen.push(event);
        return null;
      },
    },
    name,
  );
  if (!client) throw new Error("posthog-js didn't start");
  return { client, seen };
}

/** What posthog-js keeps about the person: everything but its own record of the choice. */
const storedAboutThePerson = () =>
  [
    ...[window.localStorage, window.sessionStorage].flatMap((store) =>
      Object.keys(store),
    ),
    ...cookieNames(),
  ].filter((key) => !key.includes("opt_in_out"));

describe("posthog-js under the consent rule", () => {
  it("captures and stores nothing before it is told", () => {
    const { client, seen } = start("pending");

    client.capture("$pageview");

    expect(seen).toHaveLength(0);
    expect(storedAboutThePerson()).toEqual([]);
  });

  it("counts without an identity after a no, and stores nothing about the person", () => {
    const { client, seen } = start("refused");

    client.opt_out_capturing();
    client.capture("$pageview");

    expect(seen.map((event) => event.event)).toContain("$pageview");
    expect(storedAboutThePerson()).toEqual([]);
  });

  it("forgets the choice on a reset, so the provider has to put it back", () => {
    const { client, seen } = start("reset");
    client.opt_in_capturing({ captureEventName: false });

    client.reset();
    client.capture("after_the_reset");
    expect(seen.map((event) => event.event)).not.toContain("after_the_reset");

    client.opt_in_capturing({ captureEventName: false });
    client.capture("after_the_choice_is_back");
    expect(seen.map((event) => event.event)).toContain(
      "after_the_choice_is_back",
    );
  });

  it("captures with an identity it stores after a yes", () => {
    const { client, seen } = start("allowed");

    client.opt_in_capturing({ captureEventName: false });
    client.identify("user-1");
    client.capture("workspace_created");

    const created = seen.find((event) => event.event === "workspace_created");
    expect(created?.properties.distinct_id).toBe("user-1");
    expect(seen.map((event) => event.event)).not.toContain("$opt_in");
    expect(storedAboutThePerson().length).toBeGreaterThan(0);
  });

  it("keeps the id in its cookie after a yes, where rext.ai finds it, and takes it away on a no", () => {
    const { client } = start("shared");
    // The cookie itself, and the short one the library keeps beside it.
    const ours = () =>
      cookieNames().filter((name) => name.includes("_posthog"));

    client.opt_in_capturing({ captureEventName: false });
    client.capture("workspace_created");
    expect(ours()).toContain("ph_phc_test_not_a_real_key_posthog");

    // As the provider does on a no.
    client.reset();
    client.opt_out_capturing();
    client.capture("$pageview");
    expect(ours()).toEqual([]);
  });
});
