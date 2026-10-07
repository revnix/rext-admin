/**
 * Who is measured and who is asked first (rext-control task 712): the same rule as rext.ai. A
 * choice wins everywhere; without one, the EEA, the UK and Switzerland wait for an answer and the
 * rest of the world is on.
 */

import {
  analyticsMode,
  consentCookie,
  fromThisSite,
  onConsentChange,
  readConsent,
  regionForCountry,
  resetRegionRequest,
  writeConsent,
} from "@/lib/analytics-consent";

function setCookie(cookie: string) {
  // biome-ignore lint/suspicious/noDocumentCookie: the module under test reads document.cookie
  document.cookie = cookie;
}

function clearCookies() {
  for (const part of document.cookie.split(";")) {
    const name = part.split("=")[0].trim();
    if (name) setCookie(`${name}=; Max-Age=0; Path=/`);
  }
}

const realFetch = global.fetch;

beforeEach(() => {
  clearCookies();
  resetRegionRequest();
});
afterEach(() => {
  global.fetch = realFetch;
});

describe("regionForCountry", () => {
  it("asks in the EEA, the UK and Switzerland, whatever the case of the code", () => {
    for (const country of ["DE", "fr", "GB", "CH", "NO", "RE"]) {
      expect(regionForCountry(country)).toBe("eea");
    }
  });

  it("doesn't ask elsewhere", () => {
    for (const country of ["US", "PK", "IN", "BR"]) {
      expect(regionForCountry(country)).toBe("other");
    }
  });

  it("asks when the country is missing or isn't a country code", () => {
    for (const country of [null, undefined, "", "XYZ"]) {
      expect(regionForCountry(country)).toBe("eea");
    }
  });
});

describe("analyticsMode", () => {
  it("follows the person's choice, wherever they are", async () => {
    setCookie("rext-region=eea");
    setCookie("rext-consent=granted");
    expect(await analyticsMode()).toBe("full");

    setCookie("rext-region=other");
    setCookie("rext-consent=denied");
    expect(await analyticsMode()).toBe("anonymous");
  });

  it("waits for an answer in the EEA and is on elsewhere, when nothing is chosen", async () => {
    setCookie("rext-region=eea");
    expect(await analyticsMode()).toBe("wait");

    setCookie("rext-region=other");
    expect(await analyticsMode()).toBe("full");
  });

  it("asks the server for the region once when the browser doesn't know it", async () => {
    const fetchRegion = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ region: "other" }),
    });
    global.fetch = fetchRegion as unknown as typeof fetch;

    expect(await analyticsMode()).toBe("full");
    expect(await analyticsMode()).toBe("full");

    expect(fetchRegion).toHaveBeenCalledTimes(1);
    expect(fetchRegion).toHaveBeenCalledWith("/api/region", {
      cache: "no-store",
    });
  });

  it("waits when the region can't be learnt", async () => {
    global.fetch = jest
      .fn()
      .mockRejectedValue(new Error("offline")) as unknown as typeof fetch;

    expect(await analyticsMode()).toBe("wait");
  });
});

describe("writeConsent", () => {
  it("keeps the choice in the browser, asks the server to set it too, and tells the page", () => {
    const post = jest.fn().mockResolvedValue({ ok: true });
    global.fetch = post as unknown as typeof fetch;
    const heard: string[] = [];
    const stop = onConsentChange((choice) => heard.push(choice));

    writeConsent("denied");
    stop();
    writeConsent("granted");

    expect(readConsent()).toBe("granted");
    expect(heard).toEqual(["denied"]);
    expect(post).toHaveBeenCalledWith(
      "/api/consent",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ choice: "denied" }),
      }),
    );
  });

  it("asks the server for one choice at a time, and always for the latest", async () => {
    // Two presses of the switch in quick succession: the first answer must not undo the second.
    const answers: Array<() => void> = [];
    const post = jest.fn(
      () =>
        new Promise((resolve) => {
          answers.push(() => resolve({ ok: true }));
        }),
    );
    global.fetch = post as unknown as typeof fetch;
    const sent = () =>
      post.mock.calls.map(
        (call) =>
          JSON.parse(
            (call as unknown as [string, RequestInit])[1].body as string,
          ).choice,
      );

    writeConsent("granted");
    writeConsent("denied");
    expect(sent()).toEqual(["granted"]);

    // The server's answer to the first sets its cookie over the newer choice...
    setCookie("rext-consent=granted");
    answers[0]();
    await new Promise((resolve) => setTimeout(resolve, 0));

    // ...which is put back at once, and only then sent.
    expect(readConsent()).toBe("denied");
    expect(sent()).toEqual(["granted", "denied"]);
    answers[1]();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(post).toHaveBeenCalledTimes(2);
  });

  it("writes a six-month cookie for the whole app, secure on https", () => {
    expect(consentCookie("granted", true)).toBe(
      "rext-consent=granted; Max-Age=15724800; Path=/; SameSite=Lax; Secure",
    );
    expect(consentCookie("denied", false)).toBe(
      "rext-consent=denied; Max-Age=15724800; Path=/; SameSite=Lax",
    );
  });
});

describe("fromThisSite", () => {
  it("accepts the app's own page, and a browser that sends no Origin", () => {
    expect(fromThisSite("https://app.rext.ai", "app.rext.ai")).toBe(true);
    expect(fromThisSite(null, "app.rext.ai")).toBe(true);
  });

  it("refuses another site, a sandboxed page and nonsense", () => {
    expect(fromThisSite("https://elsewhere.example", "app.rext.ai")).toBe(
      false,
    );
    expect(fromThisSite("null", "app.rext.ai")).toBe(false);
    expect(fromThisSite("not a url", "app.rext.ai")).toBe(false);
  });
});

describe("the app's other tabs", () => {
  /** The browser's BroadcastChannel, enough of it: a message reaches every other channel of the name. */
  class FakeChannel {
    static open: FakeChannel[] = [];
    private listeners = new Set<(event: MessageEvent) => void>();
    constructor(readonly name: string) {
      FakeChannel.open.push(this);
    }
    postMessage(data: unknown) {
      for (const other of FakeChannel.open) {
        if (other === this || other.name !== this.name) continue;
        for (const listener of other.listeners) {
          listener({ data } as MessageEvent);
        }
      }
    }
    addEventListener(_type: string, listener: (event: MessageEvent) => void) {
      this.listeners.add(listener);
    }
    removeEventListener(
      _type: string,
      listener: (event: MessageEvent) => void,
    ) {
      this.listeners.delete(listener);
    }
  }

  /** The module as one tab loads it, with its own channel. */
  function openTab(): typeof import("@/lib/analytics-consent") {
    const tab: { module?: typeof import("@/lib/analytics-consent") } = {};
    jest.isolateModules(() => {
      tab.module = require("@/lib/analytics-consent");
    });
    if (!tab.module) throw new Error("the consent module did not load");
    return tab.module;
  }

  const realChannel = global.BroadcastChannel;
  beforeEach(() => {
    FakeChannel.open = [];
    global.BroadcastChannel = FakeChannel as unknown as typeof BroadcastChannel;
    global.fetch = jest
      .fn()
      .mockResolvedValue({ ok: true }) as unknown as typeof fetch;
  });
  afterEach(() => {
    global.BroadcastChannel = realChannel;
  });

  it("hear a choice at once, and the tab that made it hears it once", () => {
    const here = openTab();
    const there = openTab();
    const heardHere: string[] = [];
    const heardThere: string[] = [];
    const stopHere = here.onConsentChange((choice) => heardHere.push(choice));
    // The other tab's window is this test's window too, so its own window listener is left out:
    // what it hears below came through the channel.
    const stopThere = there.onConsentChange((choice) =>
      heardThere.push(choice),
    );

    here.writeConsent("denied");
    stopHere();
    stopThere();

    expect(heardHere).toEqual(["denied"]);
    expect(heardThere).toContain("denied");
  });
});
