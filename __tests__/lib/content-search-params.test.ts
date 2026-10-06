import { loadContentListParams } from "@/lib/search-params/content";

const DEFAULTS = {
  q: "",
  status: [],
  sort: { id: "created_at", desc: true },
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
      q: "seo",
      status: ["draft", "review"],
      sort: { id: "title", desc: false },
      page: 2,
      size: 50,
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

  it("shows every status, newest first, on the first page by default", () => {
    expect(loadContentListParams("")).toEqual(DEFAULTS);
  });
});
