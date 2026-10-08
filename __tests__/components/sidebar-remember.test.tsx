/**
 * The sidebar's saved state (task 839): an area with a state of its own (the article editor
 * starts collapsed) saves nothing when the sidebar is opened or closed there.
 */

import { act, render, screen } from "@testing-library/react";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";

function Toggle() {
  const { setOpen, state } = useSidebar();
  return (
    <button type="button" onClick={() => setOpen(state !== "expanded")}>
      {state}
    </button>
  );
}

const saved = () => /(?:^|; )sidebar_state=([^;]*)/.exec(document.cookie)?.[1];

beforeEach(() => {
  // biome-ignore lint/suspicious/noDocumentCookie: the test clears the cookie the provider writes
  document.cookie = "sidebar_state=; path=/; max-age=0";
});

describe("SidebarProvider", () => {
  it("saves the choice made from its trigger", () => {
    render(
      <SidebarProvider defaultPreference="collapsed">
        <Toggle />
      </SidebarProvider>,
    );
    act(() => screen.getByRole("button").click());
    expect(screen.getByRole("button")).toHaveTextContent("expanded");
    expect(saved()).toBe("true");
  });

  it("saves nothing where the state is the area's own", () => {
    render(
      <SidebarProvider defaultPreference="collapsed" remember={false}>
        <Toggle />
      </SidebarProvider>,
    );
    act(() => screen.getByRole("button").click());
    expect(screen.getByRole("button")).toHaveTextContent("expanded");
    expect(saved()).toBeUndefined();
  });
});
