/**
 * Personas (D3a): an uploaded photo can be removed from the edit form, which sends the backend's
 * removal signal (an empty `avatar_url`), and the persona list's article counts are refreshed
 * whenever an article is created, moved to the trash or finished by a run, in every open tab.
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  act,
  render,
  renderHook,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { PersonaForm } from "@/components/personas/persona-form";
import { useCreateContent, useTrashContent } from "@/hooks/use-content";
import { useRefreshPersonaCountsOnFinishedRuns } from "@/hooks/use-personas";
import { personaQueries } from "@/lib/query-keys";
import type { BackgroundGenerationJob } from "@/stores/background-generation-store";
import type { Persona } from "@/types/workspace";

jest.mock("@/lib/api-client", () => ({
  apiClient: {
    personas: {
      list: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      uploadAvatar: jest.fn(),
    },
    content: { create: jest.fn(), delete: jest.fn() },
  },
}));

const router = { push: jest.fn(), back: jest.fn(), replace: jest.fn() };
jest.mock("next/navigation", () => ({
  useRouter: () => router,
  usePathname: () => "/w/acme/personas/p1/edit",
}));

jest.mock("@/providers/workspace-provider", () => ({
  useWorkspace: () => ({ workspace: { id: "ws-1" }, workspaceSlug: "acme" }),
}));

jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn(), info: jest.fn() },
}));

const api = jest.requireMock("@/lib/api-client").apiClient as {
  personas: { list: jest.Mock; update: jest.Mock };
  content: { create: jest.Mock; delete: jest.Mock };
};

// As the backend returns it: a presigned storage address, and no avatar_source (PersonaResponse has none).
const uploaded: Persona = {
  id: "p1",
  name: "Marketing Mary",
  description: "Writes about growth",
  avatar_url:
    "https://storage.example.com/rext/avatars/personas/p1/avatar_1.png?X-Amz-Signature=abc",
};

function newClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

function renderForm(persona: Persona) {
  const client = newClient();
  return render(
    <QueryClientProvider client={client}>
      <PersonaForm persona={persona} />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  api.personas.list.mockResolvedValue({ personas: [] });
  api.personas.update.mockResolvedValue({ persona: uploaded });
});

describe("removing a persona's photo", () => {
  it("sends an empty photo when the uploaded photo is removed", async () => {
    renderForm(uploaded);

    await userEvent.click(screen.getByRole("button", { name: "Remove photo" }));
    expect(screen.getByText("Removed when you save")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Save persona" }));

    await waitFor(() => expect(api.personas.update).toHaveBeenCalled());
    expect(api.personas.update.mock.calls[0][2]).toMatchObject({
      avatar_url: "",
    });
  });

  it("keeps the photo when the removal is undone", async () => {
    renderForm(uploaded);

    await userEvent.click(screen.getByRole("button", { name: "Remove photo" }));
    await userEvent.click(screen.getByRole("button", { name: "Keep photo" }));
    await userEvent.click(screen.getByRole("button", { name: "Save persona" }));

    await waitFor(() => expect(api.personas.update).toHaveBeenCalled());
    expect(api.personas.update.mock.calls[0][2]).not.toHaveProperty(
      "avatar_url",
    );
  });

  it("offers no removal for a typed photo link, which is cleared in its field", () => {
    renderForm({
      ...uploaded,
      avatar_url: "https://example.com/mary.jpg",
    });

    expect(
      screen.queryByRole("button", { name: "Remove photo" }),
    ).not.toBeInTheDocument();
  });

  it("offers no removal for a Gravatar", () => {
    renderForm({
      ...uploaded,
      avatar_url: "https://www.gravatar.com/avatar/abc",
    });

    expect(
      screen.queryByRole("button", { name: "Remove photo" }),
    ).not.toBeInTheDocument();
  });
});

describe("the persona list's article counts", () => {
  function wrapperFor(client: QueryClient) {
    return ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  }

  it("are refreshed when an article is created", async () => {
    const client = newClient();
    const invalidate = jest.spyOn(client, "invalidateQueries");
    api.content.create.mockResolvedValue({ id: "c1" });
    const { result } = renderHook(() => useCreateContent(), {
      wrapper: wrapperFor(client),
    });

    await act(() =>
      result.current.mutateAsync({
        workspaceId: "ws-1",
        data: { title: "A new article" } as never,
      }),
    );

    expect(invalidate).toHaveBeenCalledWith({
      queryKey: personaQueries.lists("ws-1"),
    });
  });

  it("are refreshed when articles move to the trash", async () => {
    const client = newClient();
    const invalidate = jest.spyOn(client, "invalidateQueries");
    api.content.delete.mockResolvedValue(undefined);
    const { result } = renderHook(() => useTrashContent(), {
      wrapper: wrapperFor(client),
    });

    await act(() =>
      result.current.mutateAsync({ workspaceId: "ws-1", contentIds: ["c1"] }),
    );

    expect(invalidate).toHaveBeenCalledWith({
      queryKey: personaQueries.lists("ws-1"),
    });
  });

  describe("after a run", () => {
    function job(
      threadId: string,
      changes: Partial<BackgroundGenerationJob> = {},
    ): BackgroundGenerationJob {
      return {
        threadId,
        workspaceId: "ws-1",
        workspaceSlug: "acme",
        title: "An article",
        keyword: "a keyword",
        status: "running",
        stage: "Writing",
        progress: 60,
        createdAt: "2026-10-06T20:00:00Z",
        updatedAt: "2026-10-06T20:00:00Z",
        resultUrl: "/w/acme/content/c1",
        ...changes,
      };
    }

    function renderRuns(jobs: BackgroundGenerationJob[]) {
      const client = newClient();
      const invalidate = jest.spyOn(client, "invalidateQueries");
      const view = renderHook(
        ({ current }) => useRefreshPersonaCountsOnFinishedRuns(current, true),
        { wrapper: wrapperFor(client), initialProps: { current: jobs } },
      );
      return { invalidate, rerender: view.rerender };
    }

    it("are refreshed once when a run finishes its article, even if another tab already announced it", () => {
      const { invalidate, rerender } = renderRuns([job("t1")]);

      const finished = job("t1", {
        status: "completed",
        progress: 100,
        completionNotified: true,
      });
      rerender({ current: [finished] });
      rerender({
        current: [{ ...finished, updatedAt: "2026-10-06T20:05:00Z" }],
      });

      expect(invalidate).toHaveBeenCalledTimes(1);
      expect(invalidate).toHaveBeenCalledWith({
        queryKey: personaQueries.lists("ws-1"),
      });
    });

    it("aren't refreshed for runs that had finished before the tab loaded, or that paused for input", () => {
      const { invalidate, rerender } = renderRuns([
        job("t1", { status: "completed", progress: 100 }),
      ]);

      rerender({
        current: [
          job("t1", { status: "completed", progress: 100 }),
          job("t2", { status: "completed", awaitingInput: true }),
        ],
      });

      expect(invalidate).not.toHaveBeenCalled();
    });
  });
});
