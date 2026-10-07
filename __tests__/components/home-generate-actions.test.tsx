/**
 * Home offers generation only to someone who may generate (D1a): Continue's empty action and the
 * suggestions' Plan show with `content.create` and not without, as on Generate.
 */
import { render, screen } from "@testing-library/react";
import { ContinueRow } from "@/components/home/continue-row";
import { HomeChecklist } from "@/components/home/home-checklist";
import type { ChecklistStep } from "@/components/home/home-data";
import { SuggestedKeywords } from "@/components/home/suggested-keywords";
import type { LibraryEntry } from "@/lib/generate-content/library-item";

// The library module brings the LangGraph client, which jsdom can't load; Plan needs only its query.
jest.mock("@/lib/generate-content/library-item", () => ({
  libraryStartQuery: (key: string) => `library=${encodeURIComponent(key)}`,
}));

const entry: LibraryEntry = {
  key: "library_seo tools",
  value: {
    original_query: "seo tools",
    recommendations: [],
    seo_state: {
      keyword_difficulty: 20,
      intent: "informational",
      volume: 320,
      backlinks: null,
      referring_domains: null,
    },
    timestamp: "2026-10-01T00:00:00Z",
  },
} as LibraryEntry;

describe("Continue with nothing in progress", () => {
  it("offers to start an article to someone who may generate", () => {
    render(<ContinueRow slug="acme" runs={[]} articles={[]} canGenerate />);
    expect(
      screen.getByRole("link", { name: "Start an article" }),
    ).toHaveAttribute("href", "/w/acme/generate-content");
  });

  it("offers nothing to someone who may not", () => {
    render(
      <ContinueRow slug="acme" runs={[]} articles={[]} canGenerate={false} />,
    );
    expect(screen.getByText("Nothing in progress")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Start an article" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/Start an article/)).not.toBeInTheDocument();
  });
});

describe("Suggested keywords", () => {
  it("offers Plan to someone who may generate", () => {
    render(<SuggestedKeywords slug="acme" entries={[entry]} canGenerate />);
    expect(
      screen.getByRole("link", { name: "Plan an article on seo tools" }),
    ).toBeInTheDocument();
  });

  it("lists the keywords without Plan to someone who may not", () => {
    render(
      <SuggestedKeywords slug="acme" entries={[entry]} canGenerate={false} />,
    );
    expect(screen.getByText("seo tools")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /Plan/ }),
    ).not.toBeInTheDocument();
  });
});

describe("Getting started", () => {
  const steps: ChecklistStep[] = [
    { id: "site", label: "Connect a site", description: "", done: false },
    {
      id: "keyword",
      label: "Research a keyword",
      description: "",
      done: false,
    },
    {
      id: "content",
      label: "Write your first article",
      description: "",
      done: false,
    },
  ];

  it("lists generation's steps without a link when they have none", () => {
    render(
      <HomeChecklist steps={steps} hrefs={{ site: "/w/acme/integrations" }} />,
    );
    expect(
      screen.getByRole("link", { name: /Connect a site/ }),
    ).toHaveAttribute("href", "/w/acme/integrations");
    expect(screen.getByText("Research a keyword")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /Research a keyword/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /Write your first article/ }),
    ).not.toBeInTheDocument();
  });
});
