/**
 * The dock's buttons name their run (E25): a paused run's "Continue" sits on the same screen as
 * the step's own Continue, and a screen reader has to tell the two apart. And the dock leaves out
 * the run whose article is open on its own page, however the page was reached (FB2.6).
 */

import { act, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import userEvent from "@testing-library/user-event";
import { BackgroundGenerationDock } from "@/components/background-generation-dock";
import {
  type BackgroundGenerationJob,
  useBackgroundGenerationStore,
} from "@/stores/background-generation-store";

let mockPath = "/acme/generate-content";
// Another run is open on the page, with its own Continue.
let mockSearch = "thread=on-screen";
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  usePathname: () => mockPath,
  useSearchParams: () => new URLSearchParams(mockSearch),
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
  // As in production on /w/ pages: the dock sits outside the page's WorkspaceProvider.
  useWorkspaceOptional: () => null,
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
  resultUrl: `/acme/generate-content?thread=${threadId}`,
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
  render(
    <QueryClientProvider client={new QueryClient()}>
      <BackgroundGenerationDock />
    </QueryClientProvider>,
  );

  const first = await screen.findByRole("button", {
    name: "Continue: Content brief template",
  });
  expect(first).toHaveTextContent(/^Continue$/);

  await userEvent.click(screen.getByRole("button", { name: "+1 more" }));
  expect(
    screen.getByRole("button", { name: "Continue: Podcast launch checklist" }),
  ).toHaveTextContent(/^Continue$/);
});

it("leaves out the run whose article is open on its own page, however it was reached", async () => {
  // The article reached from the Content list: no ?thread= in the address.
  mockPath = "/w/acme/content/article-1";
  mockSearch = "";
  const client = new QueryClient();
  // The article page's own query (useContentDetail), already in the cache.
  client.setQueryData(["content", "ws-1", "article-1"], {
    content: { langgraph_thread_id: "t1" },
  });
  act(() =>
    useBackgroundGenerationStore.setState({
      jobs: [
        paused("t1", "Content brief template"),
        paused("t2", "Podcast launch checklist"),
      ],
      hasHydrated: true,
    }),
  );
  render(
    <QueryClientProvider client={client}>
      <BackgroundGenerationDock />
    </QueryClientProvider>,
  );

  expect(
    await screen.findByRole("button", {
      name: "Continue: Podcast launch checklist",
    }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Continue: Content brief template" }),
  ).not.toBeInTheDocument();
  expect(screen.queryByText("Content brief template")).not.toBeInTheDocument();
});
