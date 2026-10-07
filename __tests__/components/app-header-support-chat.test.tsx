/**
 * The header's help: the help center, and "Chat with us" where the support chat is offered
 * (revnix/rext-control#711), never while an admin views as someone else.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppHeader } from "@/components/shell/app-header";
import { SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { impersonationQueries } from "@/lib/query-keys";

jest.mock("next/navigation", () => ({
  usePathname: () => "/w/acme/content",
  useRouter: () => ({ push: jest.fn() }),
}));
// The impersonation status never answers unless a test puts one in the cache.
jest.mock("@/lib/api-client", () => {
  const actual = jest.requireActual("@/lib/api-client");
  return {
    ...actual,
    apiClient: {
      ...actual.apiClient,
      impersonation: {
        ...actual.apiClient.impersonation,
        getStatus: () => new Promise(() => {}),
      },
    },
  };
});
const openSupportChat = jest.fn(async () => true);
jest.mock("@/lib/support-chat/chat", () => ({
  supportChatEnabled: () => Boolean(process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID),
  openSupportChat: () => openSupportChat(),
}));

function renderHeader(impersonating: boolean | "unknown") {
  const client = new QueryClient();
  if (impersonating !== "unknown") {
    client.setQueryData(impersonationQueries.status().queryKey, {
      is_impersonating: impersonating,
    } as never);
  }
  render(
    <QueryClientProvider client={client}>
      <SidebarProvider>
        <TooltipProvider>
          <AppHeader />
        </TooltipProvider>
      </SidebarProvider>
    </QueryClientProvider>,
  );
}

afterEach(() => {
  delete process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID;
  openSupportChat.mockClear();
});

it("offers the chat beside the help center, and opens it on request", async () => {
  process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID = "website";
  renderHeader(false);

  await userEvent.click(screen.getByRole("button", { name: "Help" }));
  expect(
    await screen.findByRole("menuitem", { name: /help center/i }),
  ).toBeInTheDocument();
  await userEvent.click(
    screen.getByRole("menuitem", { name: /chat with us/i }),
  );

  expect(openSupportChat).toHaveBeenCalledTimes(1);
});

it("keeps the plain help link while an admin views as someone else", () => {
  process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID = "website";
  renderHeader(true);

  expect(
    screen.getByRole("link", { name: /help center/i }),
  ).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Help" })).toBeNull();
});

it("keeps the plain help link when no chat is set up", () => {
  renderHeader(false);

  expect(
    screen.getByRole("link", { name: /help center/i }),
  ).toBeInTheDocument();
});

it("offers no chat until the impersonation status is known", () => {
  process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID = "website";
  renderHeader("unknown");

  expect(
    screen.getByRole("link", { name: /help center/i }),
  ).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Help" })).toBeNull();
});
