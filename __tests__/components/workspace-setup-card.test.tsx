/**
 * The card on the home page of a workspace made with "Skip for now" (rext-control task 905): the
 * one way to give it a brand voice, counted when it is seen and when it is used.
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WorkspaceSetupCard } from "@/components/home/workspace-setup-card";

jest.mock("@/lib/analytics", () => ({ analytics: { track: jest.fn() } }));
const analytics = jest.requireMock("@/lib/analytics").analytics as {
  track: jest.Mock;
};

beforeEach(() => {
  analytics.track.mockClear();
});

describe("the card that sets a skipped workspace up", () => {
  it("says what to do and why, and leads to the workspace's set-up", () => {
    render(<WorkspaceSetupCard slug="my-workspace" />);

    expect(screen.getByText("Tell Rext about your business")).toBeVisible();
    expect(
      screen.getByText(
        /Add your website or describe your business, and Rext writes in your voice/,
      ),
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Set up my brand voice" }),
    ).toHaveAttribute("href", "/w/my-workspace/setup");
  });

  it("is counted once when it is seen, however often the page renders", () => {
    const view = render(<WorkspaceSetupCard slug="my-workspace" />);
    view.rerender(<WorkspaceSetupCard slug="my-workspace" />);

    expect(analytics.track.mock.calls).toEqual([
      ["workspace_setup_card_shown", { place: "home" }],
    ]);
  });

  it("is counted when its button is used", async () => {
    render(<WorkspaceSetupCard slug="my-workspace" />);
    analytics.track.mockClear();
    // The link itself goes nowhere in a test page.
    screen
      .getByRole("link", { name: "Set up my brand voice" })
      .addEventListener("click", (event) => event.preventDefault());

    await userEvent.click(
      screen.getByRole("link", { name: "Set up my brand voice" }),
    );

    expect(analytics.track.mock.calls).toEqual([
      ["workspace_setup_card_used", { action: "continue" }],
    ]);
  });
});
