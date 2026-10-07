/**
 * The one trash table (D13a): what was deleted and how long it stays restorable; Restore, and
 * Delete forever only after a confirmation (the typed name for a workspace); the waiting, empty and
 * failed states.
 */

import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  restorableWords,
  type TrashItem,
  TrashTable,
} from "@/components/trash/trash-table";

const WORKSPACE: TrashItem = {
  id: "ws-1",
  name: "Acme Blog",
  kind: "Workspace",
  deletedAt: "2026-10-01T10:00:00Z",
  daysLeft: 24,
};

function table(overrides: Partial<Parameters<typeof TrashTable>[0]> = {}) {
  const props = {
    caption: "Deleted workspaces",
    items: [WORKSPACE],
    awaiting: false,
    error: null,
    onRetry: jest.fn(),
    onRestore: jest.fn().mockResolvedValue(undefined),
    onDeleteForever: jest.fn().mockResolvedValue(undefined),
    deleteForeverWarning: () => "Everything in it goes.",
    confirmByTypingName: true,
    ...overrides,
  };
  render(<TrashTable {...props} />);
  return props;
}

async function chooseFromMenu(item: string, action: RegExp) {
  const menus = screen.getAllByRole("button", { name: `Actions for ${item}` });
  await userEvent.click(menus[0]);
  await userEvent.click(await screen.findByRole("menuitem", { name: action }));
}

describe("restorableWords", () => {
  it("says how long an item stays restorable", () => {
    expect(restorableWords(24)).toBe("Restorable for 24 more days");
    expect(restorableWords(1)).toBe("Restorable for 1 more day");
    expect(restorableWords(0)).toBe("Goes for good today");
    expect(restorableWords(null)).toBeNull();
  });
});

describe("TrashTable", () => {
  it("lists each item with its kind and how long it stays restorable", () => {
    table();
    expect(screen.getAllByText("Acme Blog").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Workspace").length).toBeGreaterThan(0);
    expect(
      screen.getAllByText("Restorable for 24 more days").length,
    ).toBeGreaterThan(0);
  });

  it("waits with its skeleton, then says the trash is empty", () => {
    const { unmount } = render(
      <TrashTable
        caption="Deleted workspaces"
        items={[]}
        awaiting
        error={null}
        onRetry={jest.fn()}
        onRestore={jest.fn()}
        onDeleteForever={jest.fn()}
        deleteForeverWarning={() => ""}
      />,
    );
    expect(screen.queryByText("Nothing in the trash.")).not.toBeInTheDocument();
    unmount();
    table({ items: [] });
    expect(screen.getAllByText("Nothing in the trash.").length).toBeGreaterThan(
      0,
    );
  });

  it("says when the trash didn't load, and tries again", async () => {
    const props = table({ items: [], error: new Error("Service unavailable") });
    expect(screen.getAllByText("The trash didn't load").length).toBeGreaterThan(
      0,
    );
    await userEvent.click(
      screen.getAllByRole("button", { name: "Try again" })[0],
    );
    expect(props.onRetry).toHaveBeenCalled();
  });

  it("restores from the row's menu", async () => {
    const props = table();
    await chooseFromMenu("Acme Blog", /Restore/);
    await waitFor(() =>
      expect(props.onRestore).toHaveBeenCalledWith(WORKSPACE),
    );
  });

  it("deletes forever only after the name is typed", async () => {
    const props = table();
    await chooseFromMenu("Acme Blog", /Delete forever/);

    const dialog = await screen.findByRole("alertdialog");
    expect(
      within(dialog).getByText(/Everything in it goes\./),
    ).toBeInTheDocument();
    const confirm = within(dialog).getByRole("button", {
      name: "Delete forever",
    });
    expect(confirm).toBeDisabled();

    await userEvent.type(
      within(dialog).getByLabelText(/to confirm/),
      "Acme Blog",
    );
    expect(confirm).toBeEnabled();
    await userEvent.click(confirm);

    await waitFor(() =>
      expect(props.onDeleteForever).toHaveBeenCalledWith(WORKSPACE),
    );
    await waitFor(() =>
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument(),
    );
  });

  it("keeps the item when the confirmation is declined", async () => {
    const props = table();
    await chooseFromMenu("Acme Blog", /Delete forever/);
    const dialog = await screen.findByRole("alertdialog");
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Keep it in the trash" }),
    );
    expect(props.onDeleteForever).not.toHaveBeenCalled();
  });

  it("keeps the confirmation open when deleting fails", async () => {
    const props = table({
      onDeleteForever: jest.fn().mockRejectedValue(new Error("502")),
    });
    await chooseFromMenu("Acme Blog", /Delete forever/);
    const dialog = await screen.findByRole("alertdialog");
    await userEvent.type(
      within(dialog).getByLabelText(/to confirm/),
      "Acme Blog",
    );
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Delete forever" }),
    );

    await waitFor(() => expect(props.onDeleteForever).toHaveBeenCalled());
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
  });
});
