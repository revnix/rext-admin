import type { CapturedNetworkRequest, CaptureResult } from "posthog-js";
import {
  hideTypedValues,
  loadWords,
  maskAttribute,
  maskNetworkRequest,
  maskText,
  recordableRoute,
  setWords,
} from "@/lib/analytics-recording";
import { markOf } from "@/lib/recording-words";

const OWN = [
  "Save",
  "Status",
  "Workspace name",
  "Search articles…",
  "Delete",
  "outline",
  "sidebar-menu-button",
];
const realFetch = global.fetch;

/** An element of the page, from its HTML; the one marked `id="it"` when there is one. */
function element(html: string): Element {
  document.body.innerHTML = html;
  return (document.getElementById("it") ??
    document.body.firstElementChild) as Element;
}

beforeEach(() => {
  setWords(OWN);
  window.history.pushState({}, "", "/w/acme/content");
});
afterEach(() => {
  global.fetch = realFetch;
});

describe("recordableRoute", () => {
  it.each([
    "/",
    "/w/acme/content",
    "/edit/acme/6f1c",
    "/settings",
    "/settings/data",
    "/pricing",
  ])("records %s", (path) => {
    expect(recordableRoute(path)).toBe(true);
  });

  it.each([
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
    "/verify-email",
    "/accept-invitation",
    "/invitations/accept",
    "/checkout",
    "/admin",
    "/admin/users",
    "/settingsx",
    "/a-new-area",
  ])("never records %s", (path) => {
    expect(recordableRoute(path)).toBe(false);
  });
});

describe("maskText", () => {
  it("shows the app's own words in an element the source marked as fixed text", () => {
    expect(
      maskText("Save", element('<button data-rec="show">Save</button>')),
    ).toBe("Save");
    expect(
      maskText(
        "Status",
        element(
          '<table><tr><th id="it" data-rec="show">Status</th></tr></table>',
        ),
      ),
    ).toBe("Status");
    expect(
      maskText(
        "Delete",
        element('<div role="menuitem" data-rec="own">Delete</div>'),
      ),
    ).toBe("Delete");
  });

  it("reads the words as the page shows them, through an element inside the marked one", () => {
    const inner = element(
      '<button data-rec="show"><span id="it"> Save </span></button>',
    );
    expect(maskText(" Save ", inner)).toBe(" Save ");
  });

  it("hides the text of a button nobody marked, even when it reads like the app's own", () => {
    // A workspace named "Save", on the switcher's button.
    expect(maskText("Save", element("<button>Save</button>"))).toBe("****");
    expect(
      maskText("Status", element('<div role="menuitem">Status</div>')),
    ).toBe("******");
    expect(maskText("Save", element("<label>Save</label>"))).toBe("****");
  });

  it("hides a person's text in a marked element too: it is not on the list", () => {
    expect(
      maskText(
        "Mary’s workspace",
        element('<button data-rec="show">Mary’s workspace</button>'),
      ),
    ).toBe("****** *********");
  });

  it("hides every other text, the app's own included", () => {
    expect(maskText("Save", element("<p>Save</p>"))).toBe("****");
    expect(maskText("Status", element("<h1>Status</h1>"))).toBe("******");
    expect(maskText("Save", null)).toBe("****");
  });

  it("hides everything inside an element marked to be hidden, a marked one too", () => {
    const inside = element(
      '<div data-rec="mask"><button id="it" data-rec="show">Save</button></div>',
    );
    expect(maskText("Save", inside)).toBe("****");
    const nearest = element(
      '<div data-rec="show"><span id="it" data-rec="mask">Save</span></div>',
    );
    expect(maskText("Save", nearest)).toBe("****");
  });

  it("shows no text at all without the list", () => {
    setWords(null);
    expect(
      maskText("Save", element('<button data-rec="show">Save</button>')),
    ).toBe("****");
  });

  it("shows no text on a page that isn't recorded, in the moment before recording stops", () => {
    window.history.pushState({}, "", "/login");
    expect(
      maskText("Save", element('<button data-rec="show">Save</button>')),
    ).toBe("****");
  });
});

describe("maskAttribute", () => {
  it("keeps what draws the page", () => {
    const div = element('<div class="flex gap-2" id="row-1"></div>');
    expect(maskAttribute("class", "flex gap-2", div)).toBe("flex gap-2");
    expect(maskAttribute("id", "row-1", div)).toBe("row-1");
    expect(maskAttribute("aria-controls", "radix-:r1:", div)).toBe(
      "radix-:r1:",
    );
  });

  it("keeps a state, a measure and a name of the app's own", () => {
    const div = element("<div></div>");
    expect(maskAttribute("data-state", "open", div)).toBe("open");
    expect(maskAttribute("aria-valuenow", "40", div)).toBe("40");
    expect(maskAttribute("data-slot", "sidebar-menu-button", div)).toBe(
      "sidebar-menu-button",
    );
    expect(maskAttribute("data-variant", "outline", div)).toBe("outline");
  });

  it("drops any other attribute's value: a person's text can sit in one", () => {
    const item = element('<div data-value="mary’s workspace"></div>');
    expect(maskAttribute("data-value", "mary’s workspace", item)).toBe("");
    expect(maskAttribute("data-anything", "acme", item)).toBe("");
  });

  it("keeps a readable attribute only in a marked element, and only the app's own words", () => {
    const unmarked = element("<input />");
    expect(maskAttribute("placeholder", "Search articles…", unmarked)).toBe("");
    expect(maskAttribute("aria-label", "Delete", unmarked)).toBe("");
    const input = element('<label data-rec="show"><input id="it" /></label>');
    expect(maskAttribute("placeholder", "Search articles…", input)).toBe(
      "Search articles…",
    );
    expect(maskAttribute("placeholder", "mary@example.com", input)).toBe("");
    expect(maskAttribute("title", "10 best garden planners", input)).toBe("");
    expect(maskAttribute("aria-label", "Delete", input)).toBe("Delete");
  });

  it("hides a field's value, a hidden field's too, and keeps a meter's", () => {
    expect(
      maskAttribute("value", "a-secret", element('<input type="hidden" />')),
    ).toBe("********");
    expect(maskAttribute("value", "12345", element("<input />"))).toBe("*****");
    expect(maskAttribute("value", "40", element("<progress></progress>"))).toBe(
      "40",
    );
    expect(maskAttribute("value", "Acme", element("<li></li>"))).toBe("****");
  });

  it("keeps an address of this site without what follows the path, and no other", () => {
    const link = element("<a></a>");
    expect(maskAttribute("href", "/w/acme/content?q=mary#top", link)).toBe(
      "http://localhost/w/acme/content",
    );
    expect(maskAttribute("href", "https://customer.example/blog", link)).toBe(
      "",
    );
    expect(maskAttribute("href", "mailto:mary@example.com", link)).toBe("");
    expect(
      maskAttribute(
        "href",
        "https://cdn.example/app.css?v=2",
        element('<link rel="stylesheet" />'),
      ),
    ).toBe("https://cdn.example/app.css?v=2");
  });

  it("takes a picture from elsewhere out of a style", () => {
    const div = element("<div></div>");
    expect(
      maskAttribute(
        "style",
        'width: 40px; background-image: url("https://customer.example/logo.png")',
        div,
      ),
    ).toBe("width: 40px; background-image: url()");
    expect(
      maskAttribute("style", "background: url(/_next/static/a.png)", div),
    ).toBe("background: url(/_next/static/a.png)");
    expect(maskAttribute("style", "width: 40px", div)).toBe("width: 40px");
  });

  it("keeps no readable attribute and no address inside an element marked to be hidden", () => {
    const inside = element(
      '<div data-rec="mask"><a id="it" data-rec="show" aria-label="Delete"></a></div>',
    );
    expect(maskAttribute("aria-label", "Delete", inside)).toBe("");
    expect(maskAttribute("href", "/w/acme/content", inside)).toBe("");
  });
});

describe("hideTypedValues", () => {
  const recording = (...items: unknown[]) =>
    ({
      event: "$snapshot",
      properties: { $snapshot_data: items, $session_id: "s1" },
    }) as unknown as CaptureResult;

  it("turns a ticked radio button's own value into stars, and keeps that it was ticked", () => {
    // The library reports a radio button's value as it is; it can be a title.
    const sent = hideTypedValues(
      recording(
        {
          type: 3,
          data: {
            source: 5,
            id: 12,
            text: "Ten garden ideas",
            isChecked: true,
          },
        },
        { type: 3, data: { source: 5, id: 13, text: "on", isChecked: false } },
      ),
    );

    expect(sent.properties.$snapshot_data).toEqual([
      {
        type: 3,
        data: { source: 5, id: 12, text: "*** ****** *****", isChecked: true },
      },
      { type: 3, data: { source: 5, id: 13, text: "**", isChecked: false } },
    ]);
    expect(sent.properties.$session_id).toBe("s1");
  });

  it("leaves the rest of a recording as it came", () => {
    const event = recording(
      { type: 2, data: "a whole page, compressed" },
      { type: 3, data: { source: 0, texts: [{ id: 4, value: "Save" }] } },
      { type: 3, data: { source: 2, type: 2, id: 9 } },
      // What was typed is stars already.
      {
        type: 3,
        data: { source: 5, id: 12, text: "******", isChecked: false },
      },
      { type: 3, data: { source: 5, id: 14, isChecked: true } },
    );

    expect(hideTypedValues(event)).toBe(event);
  });

  it("returns any other event as it came", () => {
    const event = {
      event: "$pageview",
      properties: {
        $snapshot_data: [{ type: 3, data: { source: 5, text: "x" } }],
      },
    } as unknown as CaptureResult;
    const empty = {
      event: "$snapshot",
      properties: {},
    } as unknown as CaptureResult;

    expect(hideTypedValues(event)).toBe(event);
    expect(hideTypedValues(empty)).toBe(empty);
  });
});

describe("maskNetworkRequest", () => {
  const request = (name: string) =>
    ({
      name,
      requestHeaders: { authorization: "Bearer a-secret" },
      requestBody: '{"title":"A person’s title"}',
      responseHeaders: {},
      responseBody: "{}",
    }) as unknown as CapturedNetworkRequest;

  it("keeps a request's address without its query, and neither headers nor bodies", () => {
    const kept = maskNetworkRequest(
      request("https://api.rext.ai/api/v1/content?search=mary&token=abc"),
    );
    expect(kept?.name).toBe("https://api.rext.ai/api/v1/content");
    expect(kept?.requestHeaders).toBeUndefined();
    expect(kept?.requestBody).toBeUndefined();
    expect(kept?.responseHeaders).toBeUndefined();
    expect(kept?.responseBody).toBeUndefined();
  });

  it("keeps a recorded page's address by its path", () => {
    expect(
      maskNetworkRequest(request("http://localhost/w/acme/content?q=mary"))
        ?.name,
    ).toBe("http://localhost/w/acme/content");
  });

  it("drops the address of a page that isn't recorded", () => {
    expect(
      maskNetworkRequest(request("http://localhost/reset-password?token=abc")),
    ).toBeNull();
    expect(
      maskNetworkRequest(request("http://localhost/invitations/accept")),
    ).toBeNull();
  });
});

describe("loadWords", () => {
  it("has a list to show from once the build's list arrives", async () => {
    setWords(null);
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [markOf("Save")],
    }) as unknown as typeof fetch;

    await expect(loadWords()).resolves.toBe(true);
    expect(
      maskText("Save", element('<button data-rec="show">Save</button>')),
    ).toBe("Save");
  });

  it("says there is none when the list is empty or can't be fetched", async () => {
    setWords(null);
    global.fetch = jest
      .fn()
      .mockRejectedValue(new Error("offline")) as unknown as typeof fetch;
    await expect(loadWords()).resolves.toBe(false);

    setWords(null);
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    }) as unknown as typeof fetch;
    await expect(loadWords()).resolves.toBe(false);
    expect(maskText("Save", element("<button>Save</button>"))).toBe("****");
  });
});
