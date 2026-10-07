/**
 * Where a workspace can publish (#707, the founder's feedback v2): WordPress connects; Nextly, Ghost
 * and Search Console are coming soon with no action; Shopify isn't shown at all.
 */

import { render, screen, within } from "@testing-library/react";
import { IntegrationCatalogue } from "@/components/integrations/integration-catalogue";

function renderCatalogue() {
  render(
    <IntegrationCatalogue
      hasSites={false}
      canCreate
      onConnectWordPress={jest.fn()}
    />,
  );
}

const card = (name: string) =>
  screen.getByRole("heading", { level: 3, name }).closest("div")
    ?.parentElement as HTMLElement;

describe("IntegrationCatalogue", () => {
  it("shows no Shopify card, and names no Shopify anywhere", () => {
    renderCatalogue();
    expect(screen.queryByText(/Shopify/)).toBeNull();
  });

  it.each(["Nextly", "Ghost", "Search Console"])(
    "shows %s as coming soon, with no action",
    (name) => {
      renderCatalogue();
      const found = card(name);
      expect(within(found).getByText("Coming soon")).toBeInTheDocument();
      expect(within(found).queryByRole("button")).toBeNull();
    },
  );

  it("links Nextly's card to nextlyhq.com", () => {
    renderCatalogue();
    expect(
      within(card("Nextly")).getByRole("link", { name: "nextlyhq.com" }),
    ).toHaveAttribute("href", "https://nextlyhq.com");
  });

  it("keeps WordPress's Connect", () => {
    renderCatalogue();
    expect(
      within(card("WordPress")).getByRole("button", { name: "Connect" }),
    ).toBeInTheDocument();
  });
});
