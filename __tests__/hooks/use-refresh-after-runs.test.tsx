/**
 * Home stays current while a run works (D1a): a run's pause or failure refreshes its workspace's
 * credits, and its finished article refreshes the article list too, once per change.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { useRefreshAfterRuns } from "@/hooks/use-refresh-after-runs";
import { subscriptionQueries } from "@/lib/query-keys";
import {
  type BackgroundGenerationJob,
  useBackgroundGenerationStore,
} from "@/stores/background-generation-store";

function job(
  threadId: string,
  updates: Partial<BackgroundGenerationJob> = {},
): BackgroundGenerationJob {
  return {
    threadId,
    workspaceId: "ws-1",
    workspaceSlug: "acme",
    title: "",
    keyword: "seo tools",
    status: "running",
    stage: "",
    progress: 0,
    createdAt: "2026-10-06T22:00:00Z",
    updatedAt: "2026-10-06T22:00:00Z",
    resultUrl: "",
    ...updates,
  };
}

const credits = subscriptionQueries.workspaceCredits("ws-1").queryKey;
const content = ["content", "ws-1"];
const library = ["library", "ws-1"];

function setup(jobs: BackgroundGenerationJob[]) {
  useBackgroundGenerationStore.setState({ jobs, hasHydrated: true });
  const client = new QueryClient();
  const invalidate = jest
    .spyOn(client, "invalidateQueries")
    .mockResolvedValue(undefined);
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  renderHook(() => useRefreshAfterRuns(), { wrapper });
  const keys = () =>
    invalidate.mock.calls.map(([filters]) => filters?.queryKey);
  return { invalidate, keys };
}

const setJobs = (jobs: BackgroundGenerationJob[]) =>
  act(() => {
    useBackgroundGenerationStore.setState({ jobs });
  });

describe("refreshing what a run changed", () => {
  it("leaves the runs already paused or finished when the jobs load alone", () => {
    const { invalidate } = setup([
      job("a", { status: "completed", awaitingInput: true }),
      job("b", { status: "completed" }),
    ]);
    expect(invalidate).not.toHaveBeenCalled();
  });

  it("refreshes the balance, and the Library its research went to, when a run pauses", () => {
    const { keys } = setup([job("a")]);
    setJobs([job("a", { status: "completed", awaitingInput: true })]);
    expect(keys()).toEqual([credits, library]);
  });

  it("refreshes the balance and the article list when a run finishes its article", () => {
    const { keys } = setup([job("a")]);
    setJobs([job("a", { status: "completed" })]);
    expect(keys()).toEqual([credits, content]);
  });

  it("refreshes the balance when a run fails, which may refund it", () => {
    const { keys } = setup([job("a")]);
    setJobs([job("a", { status: "failed" })]);
    expect(keys()).toEqual([credits]);
  });

  it("refreshes once per change, and again at the next gate", () => {
    const { keys } = setup([job("a")]);
    const paused = job("a", { status: "completed", awaitingInput: true });
    setJobs([paused]);
    setJobs([{ ...paused, progress: 50 }]);
    setJobs([job("a")]);
    setJobs([paused]);
    // The Library once per run: only the first gate saves research.
    expect(keys()).toEqual([credits, library, credits]);
  });

  it("refreshes a run started after the jobs loaded when it finishes", () => {
    const { keys } = setup([]);
    setJobs([job("new")]);
    setJobs([job("new", { status: "completed" })]);
    expect(keys()).toEqual([credits, content]);
  });

  it("does nothing for a run with no workspace", () => {
    const { invalidate } = setup([job("a", { workspaceId: undefined })]);
    setJobs([job("a", { workspaceId: undefined, status: "completed" })]);
    expect(invalidate).not.toHaveBeenCalled();
  });
});
