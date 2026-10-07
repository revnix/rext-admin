import { loadContentListParams } from "@/lib/search-params/content";

const DEFAULTS = {
  q: "",
  status: [],
  type: [],
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

  it("reads the types and the personas, which are open sets (D2c #468)", () => {
    const params = loadContentListParams(
      "?type=how-to-guide,landing-page&persona=6f1c,9a2b",
    );
    expect(params.type).toEqual(["how-to-guide", "landing-page"]);
    expect(params.persona).toEqual(["6f1c", "9a2b"]);
    expect(loadContentListParams("?sort=type.asc").sort).toEqual({
      id: "type",
      desc: false,
    });
  });

  it("sorts an older link by a removed column the default way (D2b #466)", () => {
    for (const sort of ["words.desc", "platform.asc"]) {
      expect(loadContentListParams(`?sort=${sort}`).sort).toEqual(
        DEFAULTS.sort,
      );
    }
    expect(loadContentListParams("?sort=seo.desc").sort).toEqual({
      id: "seo",
      desc: true,
    });
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
