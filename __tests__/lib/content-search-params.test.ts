import { loadContentListParams } from "@/lib/search-params/content";

describe("the content library's filters in the URL", () => {
  it("reads the status and the search", () => {
    expect(loadContentListParams("?status=draft&q=seo")).toEqual({
      status: "draft",
      q: "seo",
    });
  });

  it("ignores a status the backend doesn't have", () => {
    expect(loadContentListParams("?status=bogus").status).toBeNull();
  });

  it("shows every status with no search by default", () => {
    expect(loadContentListParams("")).toEqual({ status: null, q: "" });
  });
});
