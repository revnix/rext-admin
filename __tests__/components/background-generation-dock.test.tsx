/**
 * The dock's buttons name their run (E25): a paused run's "Continue" sits on the same screen as
 * the step's own Continue, and a screen reader has to tell the two apart.
 */

import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BackgroundGenerationDock } from "@/components/background-generation-dock";
import {
  type BackgroundGenerationJob,
  useBackgroundGenerationStore,
} from "@/stores/background-generation-store";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  usePathname: () => "/acme/generate_content",
  // Another run is open on the page, with its own Continue.
  useSearchParams: () => new URLSearchParams("thread=on-screen"),
}));
jest.mock("@/hooks/use-personas", () => ({
  useRefreshPersonaCountsOnFinishedRuns: () => {},
}));
jest.mock("@/hooks/use-refresh-after-runs", () => ({
  useRefreshAfterRuns: () => {},
}));
jest.mock("@/lib/auth-utils", () => ({
  authenticatedFetch: jest.fn(() => new Promise(() => {})),
}));
jest.mock("@/providers/workspace-provider", () => ({
  useWorkspaceOptional: () => ({ workspaceSlug: "acme" }),
}));

const paused = (threadId: string, title: string): BackgroundGenerationJob => ({
  threadId,
  workspaceSlug: "acme",
  title,
  keyword: title.toLowerCase(),
  status: "completed",
  awaitingInput: true,
  completionNotified: true,
  stage: "Choose a title",
  progress: 40,
  createdAt: "2026-10-07T08:00:00Z",
  updatedAt: "2026-10-07T08:00:00Z",
  resultUrl: `/acme/generate_content?thread=${threadId}`,
});

it("names each paused run's Continue after its title", async () => {
  act(() =>
    useBackgroundGenerationStore.setState({
      jobs: [
        paused("t1", "Content brief template"),
        paused("t2", "Podcast launch checklist"),
      ],
      hasHydrated: true,
    }),
  );
  render(<BackgroundGenerationDock />);

  const first = await screen.findByRole("button", {
    name: "Continue: Content brief template",
  });
  expect(first).toHaveTextContent(/^Continue$/);

  await userEvent.click(screen.getByRole("button", { name: "+1 more" }));
  expect(
    screen.getByRole("button", { name: "Continue: Podcast launch checklist" }),
  ).toHaveTextContent(/^Continue$/);
});
