/**
 * The outline's Sources view lists the ranking pages' headings (rext-control#476): each page by
 * its title, linked, with its site, and its H2 and H3 in order, H3 indented.
 */

import { render, screen, within } from "@testing-library/react";
import {
  hasSources,
  OutlineSources,
} from "@/components/generate-content/outline-review/outline-sources";

const PAGES = [
  {
    url: "https://www.a.test/guide",
    title: "A content calendar guide",
    headings: [
      { level: 2 as const, text: "What is a content calendar?" },
      { level: 3 as const, text: "Why teams use one" },
    ],
  },
];

const base = {
  serpResults: [],
  questions: [],
  relatedSearches: [],
  clusters: [],
};

describe("the ranking pages' headings in Sources", () => {
  it("lists each page with its headings in order", () => {
    render(<OutlineSources {...base} competitorHeadings={PAGES} />);

    const link = screen.getByRole("link", { name: "A content calendar guide" });
    expect(link).toHaveAttribute("href", "https://www.a.test/guide");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.getByText("a.test")).toBeInTheDocument();
    const page = link.closest("li") as HTMLElement;
    const items = within(page).getAllByRole("listitem");
    expect(items.map((item) => item.textContent)).toEqual([
      "What is a content calendar?",
      "Why teams use one",
    ]);
    expect(items[1]).toHaveClass("pl-4");
  });

  it("counts as a source on its own, and shows nothing without pages", () => {
    expect(hasSources({ ...base, competitorHeadings: PAGES })).toBe(true);
    expect(hasSources(base)).toBe(false);
    render(<OutlineSources {...base} competitorHeadings={[]} />);
    expect(screen.queryByText("What the ranking pages cover")).toBeNull();
  });
});
