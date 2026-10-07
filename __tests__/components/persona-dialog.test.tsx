/**
 * Creating a persona in a dialog (FB2.20, rext-control#701): the full creation form opens over the
 * page, and saving closes it and hands back the new persona's id instead of opening its page.
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PersonaDialog } from "@/components/personas/persona-dialog";
import { Button } from "@/components/ui/button";

jest.mock("@/lib/api-client", () => ({
  apiClient: {
    personas: {
      list: jest.fn().mockResolvedValue({ personas: [] }),
      create: jest.fn(),
      update: jest.fn(),
      uploadAvatar: jest.fn(),
    },
  },
}));
const router = { push: jest.fn(), back: jest.fn(), replace: jest.fn() };
jest.mock("next/navigation", () => ({
  useRouter: () => router,
  usePathname: () => "/w/acme/generate_content",
}));
jest.mock("@/providers/workspace-provider", () => ({
  useWorkspace: () => ({ workspace: { id: "ws-1" }, workspaceSlug: "acme" }),
}));
jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn(), info: jest.fn() },
}));

const api = jest.requireMock("@/lib/api-client").apiClient as {
  personas: { create: jest.Mock };
};

function renderDialog(onCreated = jest.fn()) {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <PersonaDialog
        trigger={<Button>Create persona</Button>}
        onCreated={onCreated}
      />
    </QueryClientProvider>,
  );
  return onCreated;
}

it("asks before Escape drops what was typed, and keeps it on Keep editing", async () => {
  renderDialog();
  await userEvent.click(screen.getByRole("button", { name: "Create persona" }));
  await screen.findByRole("dialog", { name: "Create persona" });
  await userEvent.type(screen.getByLabelText(/Display name/), "Nina");

  await userEvent.keyboard("{Escape}");
  expect(
    await screen.findByRole("alertdialog", { name: "Discard this persona?" }),
  ).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Keep editing" }));
  expect(screen.getByLabelText(/Display name/)).toHaveValue("Nina");

  await userEvent.keyboard("{Escape}");
  await userEvent.click(
    await screen.findByRole("button", { name: "Discard persona" }),
  );
  await waitFor(() =>
    expect(
      screen.queryByRole("dialog", { name: "Create persona" }),
    ).not.toBeInTheDocument(),
  );
});

it("closes on Escape at once when nothing was entered", async () => {
  renderDialog();
  await userEvent.click(screen.getByRole("button", { name: "Create persona" }));
  await screen.findByRole("dialog", { name: "Create persona" });

  await userEvent.keyboard("{Escape}");
  await waitFor(() =>
    expect(
      screen.queryByRole("dialog", { name: "Create persona" }),
    ).not.toBeInTheDocument(),
  );
  expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
});

it("creates a persona in the dialog, closes, and passes its id without leaving the page", async () => {
  api.personas.create.mockResolvedValue({
    persona: { id: "p9", name: "Nina" },
  });
  const onCreated = jest.fn();
  render(
    <QueryClientProvider client={new QueryClient()}>
      <PersonaDialog
        trigger={<Button>Create persona</Button>}
        onCreated={onCreated}
      />
    </QueryClientProvider>,
  );

  await userEvent.click(screen.getByRole("button", { name: "Create persona" }));
  const dialog = await screen.findByRole("dialog", { name: "Create persona" });
  expect(dialog).toBeInTheDocument();
  // The full form: its later sections are there too.
  expect(screen.getByText("Audience and voice")).toBeInTheDocument();

  await userEvent.type(screen.getByLabelText(/Display name/), "Nina");
  const submit = screen
    .getAllByRole("button", { name: "Create persona" })
    .find((button) => dialog.contains(button));
  await userEvent.click(submit as HTMLElement);

  await waitFor(() => expect(onCreated).toHaveBeenCalledWith("p9"));
  expect(api.personas.create).toHaveBeenCalled();
  expect(router.push).not.toHaveBeenCalled();
  await waitFor(() =>
    expect(
      screen.queryByRole("dialog", { name: "Create persona" }),
    ).not.toBeInTheDocument(),
  );
});
