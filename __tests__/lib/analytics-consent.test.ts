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
