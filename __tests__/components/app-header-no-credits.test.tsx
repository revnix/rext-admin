/**
 * The header carries no credits pill (FB2.4, rext-control#685): the sidebar's meter is the one place
 * the balance shows, so the header has the breadcrumb, notifications and help only.
 */

import { render, screen } from "@testing-library/react";
import { AppHeader } from "@/components/shell/app-header";
import { SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

jest.mock("next/navigation", () => ({
  usePathname: () => "/w/acme/content",
  useRouter: () => ({ push: jest.fn() }),
}));

it("has no credits link or meter at the top right", () => {
  render(
    <SidebarProvider>
      <TooltipProvider>
        <AppHeader />
      </TooltipProvider>
    </SidebarProvider>,
  );
  expect(screen.getByRole("banner")).toBeInTheDocument();
  expect(screen.queryByRole("link", { name: /credits|usage/i })).toBeNull();
  expect(screen.queryByRole("meter")).toBeNull();
});
