import { render, screen } from "@testing-library/react";

import { ContentHealthCard } from "@/components/home/content-health-card";
import type { ContentHealth } from "@/components/home/home-data";

const HEALTH: ContentHealth = {
  scored: 4,
  average: 78,
  underHealthy: 1,
  staleDrafts: 0,
};

function card(checks?: Parameters<typeof ContentHealthCard>[0]["checks"]) {
  return render(
    <ContentHealthCard
      health={HEALTH}
      checks={checks}
      libraryHref="/w/acme/content"
    />,
  );
}

describe("ContentHealthCard, the backend's two counts (FB2.27a #765)", () => {
  it("is whole without them, while they load or fail", () => {
    card();

    expect(
      screen.getByRole("meter", { name: "Average on-page score" }),
    ).toHaveAttribute("aria-valuenow", "78");
    expect(screen.queryByText(/meta description/)).toBeNull();
    expect(screen.queryByText(/your own site/)).toBeNull();
    expect(
      screen.queryByRole("link", { name: "Open the published articles" }),
    ).toBeNull();
  });

  it("says how many published articles miss a meta description or a link to the site", () => {
    card({ published: 4, missing_meta_description: 2, no_internal_links: 3 });

    expect(
      screen.getByText("published without a meta description"),
    ).toHaveTextContent("2 published without a meta description");
    expect(screen.getByText(/with no link to your own site/)).toHaveTextContent(
      "3 published with no link to your own site",
    );
    expect(
      screen.getByRole("link", { name: "Open the published articles" }),
    ).toHaveAttribute("href", "/w/acme/content?status=published");
  });

  it("leaves out a count of none, and the link count the backend can't make", () => {
    card({
      published: 4,
      missing_meta_description: 1,
      no_internal_links: null,
    });

    expect(screen.getByText(/meta description/)).toBeInTheDocument();
    expect(screen.queryByText(/your own site/)).toBeNull();
  });

  it("shows nothing more when every article passes both", () => {
    card({ published: 4, missing_meta_description: 0, no_internal_links: 0 });

    expect(screen.queryByText(/meta description/)).toBeNull();
    expect(
      screen.queryByRole("link", { name: "Open the published articles" }),
    ).toBeNull();
  });
});
