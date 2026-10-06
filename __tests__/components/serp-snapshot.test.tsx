import { render, screen, within } from "@testing-library/react";
import { SerpSnapshot } from "@/components/keywords/serp-snapshot";
import {
  domainOf,
  formatLabel,
  serpResultsFromOrganic,
} from "@/lib/keywords/serp-results";

describe("SerpSnapshot", () => {
  it("lists each result's position, title, domain and format in words", () => {
    render(
      <SerpSnapshot
        results={[
          {
            position: 1,
            title: "10 best headless CMS for agencies",
            domain: "example.com",
            url: "https://example.com/best",
            format: "list",
          },
          {
            position: 2,
            title: "What is a headless CMS?",
            domain: "docs.example.org",
            format: null,
          },
        ]}
      />,
    );

    const items = within(screen.getByRole("list")).getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(
      screen.getByRole("link", { name: "10 best headless CMS for agencies" }),
    ).toHaveAttribute("href", "https://example.com/best");
    expect(items[0]).toHaveTextContent("example.com · List post");
    // No address: the title is text, not a link; no format: the domain alone.
    expect(within(items[1]).queryByRole("link")).toBeNull();
    expect(items[1]).toHaveTextContent("docs.example.org");
    expect(items[1]).not.toHaveTextContent("·");
  });

  it("says so when the run recorded no results", () => {
    render(<SerpSnapshot results={[]} />);
    // The shared empty state, a level under the section's own heading.
    expect(
      screen.getByRole("heading", {
        level: 3,
        name: "No search results recorded",
      }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("list")).toBeNull();
  });
});

describe("serp results", () => {
  it("names the backend's formats and ignores keys it doesn't know", () => {
    expect(formatLabel("how-to")).toBe("How-to guide");
    expect(formatLabel("home-page")).toBe("Home page");
    expect(formatLabel("something-new")).toBeNull();
    expect(formatLabel(null)).toBeNull();
  });

  it("reads a domain from an address, without www", () => {
    expect(domainOf("https://www.example.com/a?b=1")).toBe("example.com");
    expect(domainOf("not an address")).toBe("");
    expect(domainOf(undefined)).toBe("");
  });

  it("turns a Library item's results into the top ten, in position order", () => {
    const organic = Array.from({ length: 12 }, (_, i) => ({
      position: 12 - i,
      title: `Result ${12 - i}`,
      url: `https://www.site${12 - i}.com/page`,
    }));
    const results = serpResultsFromOrganic([
      ...organic,
      { position: 13, title: "", url: "https://empty.com" },
    ]);
    expect(results).toHaveLength(10);
    expect(results[0]).toEqual({
      position: 1,
      title: "Result 1",
      domain: "site1.com",
      url: "https://www.site1.com/page",
    });
    expect(results.map((r) => r.position)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    ]);
  });
});
