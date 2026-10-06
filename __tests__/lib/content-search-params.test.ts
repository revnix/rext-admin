import { loadContentListParams } from "@/lib/search-params/content";

const DEFAULTS = {
  q: "",
  status: [],
  persona: [],
  sort: { id: "updated_at", desc: true },
  page: 0,
  size: 25,
};

describe("the content library's table state in the URL", () => {
  it("reads the search, the statuses, the sort and the page", () => {
    expect(
      loadContentListParams(
        "?status=draft,review&q=seo&sort=title.asc&page=3&size=50",
      ),
    ).toEqual({
      ...DEFAULTS,
      q: "seo",
      status: ["draft", "review"],
      sort: { id: "title", desc: false },
      page: 2,
      size: 50,
    });
  });

  it("reads the personas, an open set", () => {
    const params = loadContentListParams("?persona=6f1c,9a2b");
    expect(params.persona).toEqual(["6f1c", "9a2b"]);
  });

  it("ignores an older link's type filter: the backend returns no type (D2b #466)", () => {
    const params = loadContentListParams("?type=blog&persona=6f1c");
    expect(params).toEqual({ ...DEFAULTS, persona: ["6f1c"] });
    expect(params).not.toHaveProperty("type");
  });

  it("keeps a link with one status working", () => {
    expect(loadContentListParams("?status=draft").status).toEqual(["draft"]);
  });

  it("drops what the list doesn't know", () => {
    expect(
      loadContentListParams("?status=bogus,draft&sort=title&size=7"),
    ).toEqual({ ...DEFAULTS, status: ["draft"] });
  });

  it("shows everything, last updated first, on the first page by default", () => {
    expect(loadContentListParams("")).toEqual(DEFAULTS);
  });
});
