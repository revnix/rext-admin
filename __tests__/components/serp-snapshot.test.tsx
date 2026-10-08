import { render, screen, within } from "@testing-library/react";
import {
  SerpSnapshot,
  SerpSnapshotSkeleton,
} from "@/components/keywords/serp-snapshot";
import {
  describeRankingKinds,
  domainOf,
  formatLabel,
  type SerpResult,
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

  // Step 2, the outline's Sources and the library render it with no more than the results: the
  // title step's extras (task 695) are theirs only if they ask.
  it("stays as it was for the views that don't opt in to the title step's extras", () => {
    render(
      <SerpSnapshot
        heading={null}
        results={[
          {
            position: 1,
            title: "10 best headless CMS for agencies",
            domain: "example.com",
            url: "https://example.com/best",
            format: "list",
          },
        ]}
      />,
    );

    const item = screen.getByRole("listitem");
    // The position and the result, and nothing between them: no letter mark.
    expect(item.children).toHaveLength(2);
    expect(item.firstElementChild).toHaveTextContent("1");
    expect(item.querySelector("[aria-hidden]")).toBeNull();
    // The title whole, at weight 500, with nothing in bold.
    const link = screen.getByRole("link", {
      name: "10 best headless CMS for agencies",
    });
    expect(link).toHaveClass("line-clamp-2", "font-medium");
    expect(link).not.toHaveClass("font-normal");
    expect(link.children).toHaveLength(0);
    // One line beneath, the domain and the format: no length.
    const detail = screen.getByText("example.com · List post");
    expect(detail).toHaveClass("truncate");
    expect(detail.children).toHaveLength(0);
    expect(item).not.toHaveTextContent("characters");
  });

  it("shows the keyphrase in bold, a letter mark, the length and what may be cut off when asked", () => {
    render(
      <SerpSnapshot
        heading={null}
        keyphrase="headless cms"
        marks
        measure={(title) => ({
          length: title.length,
          cutOff: title.length > 30,
        })}
        results={[
          {
            position: 1,
            title: "10 best headless CMS for agencies", // 33
            domain: "example.com",
            url: "https://example.com/best",
            format: "list",
          },
          {
            position: 2,
            title: "What is a headless CMS?", // 23
            domain: "docs.example.org",
            format: null,
          },
          { position: 3, title: "Choosing a CMS", domain: "", format: "guide" },
        ]}
      />,
    );

    const items = screen.getAllByRole("listitem");
    // The keyphrase in bold where the title has it, the rest at the regular weight.
    const link = within(items[0]).getByRole("link");
    expect(link).toHaveTextContent("10 best headless CMS for agencies");
    expect(link).toHaveAttribute("href", "https://example.com/best");
    expect(link).toHaveClass("font-normal");
    expect(
      within(link).getByText("headless CMS", { selector: "b" }),
    ).toHaveClass("font-semibold");
    expect(items[2].querySelector("b")).toBeNull();
    // The domain's first letter, for the eye only; the title's without a domain.
    expect(items[0].querySelector("[aria-hidden]")).toHaveTextContent("e");
    expect(items[2].querySelector("[aria-hidden]")).toHaveTextContent("C");
    // The length between the domain and the format; past the limit it says so, in the text colour.
    expect(items[0]).toHaveTextContent(
      "example.com · 33 characters, may be cut off · List post",
    );
    expect(within(items[0]).getByText(/may be cut off/)).toHaveClass(
      "text-foreground",
    );
    expect(items[1]).toHaveTextContent("docs.example.org · 23 characters");
    expect(items[1]).not.toHaveTextContent("may be cut off");
    expect(within(items[1]).getByText(/23 characters/)).not.toHaveClass(
      "text-foreground",
    );
    expect(items[2]).toHaveTextContent("14 characters · In-depth guide");
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

  describe("on the keyword step (task 834)", () => {
    const results: SerpResult[] = [
      {
        position: 1,
        title: "How to repot a houseplant",
        domain: "example.com",
        url: "https://example.com/repot",
        format: "how-to",
      },
      {
        position: 2,
        title: "Repotting, step by step",
        domain: "plants.example.org",
        format: "how-to",
      },
      {
        position: 3,
        title: "10 repotting mistakes",
        domain: "",
        format: "list",
      },
      { position: 4, title: "A forum thread", domain: "forum.example.net" },
    ];

    it("says what the list is, counts its kinds, and shows each result at a glance", () => {
      render(
        <SerpSnapshot
          results={results}
          intro="The pages Google shows first for this keyword."
          kinds
        />,
      );

      expect(
        screen.getByText("The pages Google shows first for this keyword."),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Among these 4: 2 how-to guides and 1 list post."),
      ).toBeInTheDocument();

      const [first, second, third, fourth] = screen.getAllByRole("listitem");
      expect(first).toHaveTextContent("Position 1");
      expect(
        within(first).getByRole("link", { name: "How to repot a houseplant" }),
      ).toHaveAttribute("href", "https://example.com/repot");
      expect(within(first).getByText("example.com")).toBeInTheDocument();
      expect(within(first).getByText("How-to guide")).toBeInTheDocument();
      // No address: the title is text. No site: only the kind. No kind: only the site.
      expect(within(second).queryByRole("link")).toBeNull();
      expect(within(third).getByText("List post")).toBeInTheDocument();
      expect(within(fourth).getByText("forum.example.net")).toBeInTheDocument();
      expect(within(fourth).queryByText("·")).toBeNull();
    });

    it("counts no kinds when none is known", () => {
      const { container } = render(
        <SerpSnapshot results={[results[3]]} kinds />,
      );
      expect(container.querySelector('[data-slot="serp-kinds"]')).toBeNull();
    });

    it("keeps the plain list where the step doesn't ask for more", () => {
      render(<SerpSnapshot results={results.slice(0, 1)} />);
      expect(
        screen.getByText("example.com · How-to guide"),
      ).toBeInTheDocument();
      expect(screen.queryByText(/Among these/)).toBeNull();
    });

    it("stands as rows to come until the results arrive", () => {
      const { container } = render(
        <SerpSnapshotSkeleton intro="The pages Google shows first." rows={6} />,
      );
      const waiting = screen.getByRole("region", {
        name: "Top search results",
      });
      expect(waiting).toHaveAttribute("aria-busy", "true");
      expect(container.querySelectorAll("li")).toHaveLength(6);
      expect(
        screen.getByText("The pages Google shows first."),
      ).toBeInTheDocument();
      expect(screen.getByRole("status")).toHaveTextContent(
        "Reading the search results",
      );
    });
  });

  describe("the kinds of pages among the results", () => {
    const of = (...formats: (string | null)[]): SerpResult[] =>
      formats.map((format, index) => ({
        position: index + 1,
        title: `Result ${index + 1}`,
        domain: "example.com",
        format,
      }));

    it("are counted, the commonest first, in one sentence", () => {
      expect(
        describeRankingKinds(
          of("list", "how-to", "how-to", "review", null, "how-to", "list"),
        ),
      ).toBe("Among these 7: 3 how-to guides, 2 list posts and 1 review.");
      expect(describeRankingKinds(of("guide", "guide"))).toBe(
        "Among these 2: 2 in-depth guides.",
      );
      expect(describeRankingKinds(of("home-page"))).toBe(
        "Among these 1: 1 home page.",
      );
    });

    it("are left unsaid when no result's kind is known", () => {
      expect(describeRankingKinds(of(null, "something-new"))).toBeNull();
      expect(describeRankingKinds([])).toBeNull();
    });
  });
});
