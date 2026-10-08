import type { CapturedNetworkRequest } from "posthog-js";
import {
  loadWords,
  maskAttribute,
  maskNetworkRequest,
  maskText,
  recordableRoute,
  setWords,
} from "@/lib/analytics-recording";

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
  it("shows the app's own words on a button, a menu item, a label and a table header", () => {
    expect(maskText("Save", element("<button>Save</button>"))).toBe("Save");
    expect(
      maskText("Delete", element('<div role="menuitem">Delete</div>')),
    ).toBe("Delete");
    expect(
      maskText("Workspace name", element("<label>Workspace name</label>")),
    ).toBe("Workspace name");
    expect(
      maskText(
        "Status",
        element('<table><tr><th id="it">Status</th></tr></table>'),
      ),
    ).toBe("Status");
  });

  it("shows them on a link of the sidebar's menu that sits outside the navigation", () => {
    const link = element(
      '<a data-slot="sidebar-menu-button" href="/w/acme/generate-content"><span id="it">Save</span></a>',
    );
    expect(maskText("Save", link)).toBe("Save");
    expect(maskText("Acme Ltd", link)).toBe("**** ***");
    expect(maskText("Save", element('<a href="/x">Save</a>'))).toBe("****");
  });

  it("reads the words as the page shows them, through an element inside the button", () => {
    const inner = element('<button><span id="it"> Save </span></button>');
    expect(maskText(" Save ", inner)).toBe(" Save ");
  });

  it("hides a person's text wherever it sits, a button included", () => {
    expect(
      maskText(
        "Mary’s workspace",
        element("<button>Mary’s workspace</button>"),
      ),
    ).toBe("****** *********");
    expect(
      maskText(
        "10 best garden planners",
        element('<div role="menuitem">10 best garden planners</div>'),
      ),
    ).toBe("** **** ****** ********");
  });

  it("hides every other text, the app's own included", () => {
    expect(maskText("Save", element("<p>Save</p>"))).toBe("****");
    expect(maskText("Status", element("<h1>Status</h1>"))).toBe("******");
    expect(maskText("Save", null)).toBe("****");
  });

  it("hides everything inside an element marked to be hidden", () => {
    const inside = element(
      '<div data-rec="mask"><button id="it">Save</button></div>',
    );
    expect(maskText("Save", inside)).toBe("****");
  });

  it("adds a marked element to the shown ones, for the app's own words only", () => {
    const marked = element('<div data-rec="show" id="it"></div>');
    expect(maskText("Status", marked)).toBe("Status");
    expect(maskText("Acme Ltd", marked)).toBe("**** ***");
  });

  it("shows no text at all without the list", () => {
    setWords(null);
    expect(maskText("Save", element("<button>Save</button>"))).toBe("****");
  });

  it("shows no text on a page that isn't recorded, in the moment before recording stops", () => {
    window.history.pushState({}, "", "/login");
    expect(maskText("Save", element("<button>Save</button>"))).toBe("****");
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

  it("keeps a readable attribute only when it is the app's own words", () => {
    const input = element("<input />");
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
      '<div data-rec="mask"><a id="it" aria-label="Delete"></a></div>',
    );
    expect(maskAttribute("aria-label", "Delete", inside)).toBe("");
    expect(maskAttribute("href", "/w/acme/content", inside)).toBe("");
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
      json: async () => ["Save"],
    }) as unknown as typeof fetch;

    await expect(loadWords()).resolves.toBe(true);
    expect(maskText("Save", element("<button>Save</button>"))).toBe("Save");
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
