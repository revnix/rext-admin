/**
 * Personas (D3a): an uploaded photo can be removed from the edit form, which sends the backend's
 * removal signal (an empty `avatar_url`), and the persona list's article counts are refreshed
 * whenever an article is created or moved to the trash.
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
import { personaQueries } from "@/lib/query-keys";
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

const uploaded: Persona = {
  id: "p1",
  name: "Marketing Mary",
  description: "Writes about growth",
  avatar_url: "avatars/personas/p1/avatar_1.png",
  avatar_source: "custom",
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
      avatar_source: "gravatar",
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
});
