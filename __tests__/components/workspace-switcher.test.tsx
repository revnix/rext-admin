/**
 * The workspace switcher (FB2.5, rext-control#686): on a desktop its list opens to the right of the
 * sidebar, never over it; on a phone it is a sheet. Choosing a workspace lands on its Home.
 */

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WorkspaceSwitcher } from "@/components/shell/workspace-switcher";
import { SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useWorkspaceContextStore } from "@/stores/workspace/use-workspace-context-store";

const mockPush = jest.fn();
const mockSetOpenMobile = jest.fn();
let mockMobile = false;

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/settings/workspace",
}));
jest.mock("@/components/ui/sidebar", () => ({
  ...jest.requireActual("@/components/ui/sidebar"),
  useSidebar: () => ({
    isMobile: mockMobile,
    state: "expanded",
    setOpenMobile: mockSetOpenMobile,
  }),
}));
jest.mock("@/components/subscription/usage-limit-warning", () => ({
  useResourceLimit: () => ({
    isLimitReached: false,
    isLoading: false,
    used: 2,
    max: 3,
  }),
}));
const WORKSPACES = [
  { id: "a", slug: "acme", name: "Acme", url: "https://acme.example" },
  { id: "b", slug: "beta", name: "Beta", url: "https://beta.example" },
];
jest.mock("@tanstack/react-query", () => ({
  ...jest.requireActual("@tanstack/react-query"),
  useQuery: (options: { queryKey: unknown[] }) =>
    JSON.stringify(options.queryKey).includes("credits")
      ? { data: { plan_name: "Growth" }, isError: false }
      : { data: { workspaces: WORKSPACES }, isLoading: false },
}));

beforeEach(() => {
  mockPush.mockClear();
  mockSetOpenMobile.mockClear();
  useWorkspaceContextStore.setState({
    currentWorkspace: WORKSPACES[0] as never,
  });
});

function renderSwitcher() {
  return render(
    <SidebarProvider>
      <TooltipProvider>
        <WorkspaceSwitcher />
      </TooltipProvider>
    </SidebarProvider>,
  );
}

it("opens to the right on a desktop, and a workspace lands on its Home", async () => {
  mockMobile = false;
  renderSwitcher();
  await userEvent.click(screen.getByRole("button", { name: /Acme/ }));
  const menu = await screen.findByRole("menu");
  expect(menu).toHaveAttribute("data-side", "right");
  await userEvent.click(within(menu).getByRole("menuitem", { name: /Beta/ }));
  expect(mockPush).toHaveBeenCalledWith("/w/beta");
});

it("is a sheet on a phone, which closes as a workspace opens on its Home", async () => {
  mockMobile = true;
  renderSwitcher();
  await userEvent.click(screen.getByRole("button", { name: /Acme/ }));
  const sheet = await screen.findByRole("dialog", { name: "Workspaces" });
  await userEvent.click(within(sheet).getByRole("button", { name: /Beta/ }));
  expect(mockPush).toHaveBeenCalledWith("/w/beta");
  expect(mockSetOpenMobile).toHaveBeenCalledWith(false);
  expect(
    screen.queryByRole("dialog", { name: "Workspaces" }),
  ).not.toBeInTheDocument();
});
