/**
 * A site's settings sheet (D4a): one sheet serves every site, so a save or a test that finishes after
 * the sheet was opened on another site doesn't close that site's sheet or show its result there.
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SiteSettingsSheet } from "@/components/integrations/site-settings-sheet";
import type {
  ConnectionTestResult,
  Integration,
} from "@/lib/api-client/integrations";

jest.mock("@/lib/api-client", () => ({
  apiClient: { integrations: { update: jest.fn(), test: jest.fn() } },
}));

jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock("@/lib/logger", () => ({ log: { error: jest.fn() } }));

const api = jest.requireMock("@/lib/api-client").apiClient as {
  integrations: { update: jest.Mock; test: jest.Mock };
};
const { toast } = jest.requireMock("sonner") as {
  toast: { success: jest.Mock; error: jest.Mock };
};

function siteOn(host: string): Integration {
  return {
    id: `site-${host}`,
    workspace_id: "ws-1",
    integration_type: "wordpress",
    is_active: true,
    site_url: `https://${host}`,
    api_endpoint: `https://${host}/wp-json/rext-ai/v1/`,
    has_api_key: true,
    has_app_password: false,
    created_at: "2026-10-01T09:00:00Z",
  };
}

const A = siteOn("a.example.com");
const B = siteOn("b.example.com");

/** A request that finishes when the test says so. */
function later<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function testResult(site: Integration, message: string): ConnectionTestResult {
  return {
    site_id: site.id,
    ok: true,
    status: "connected",
    message,
    checked_at: "2026-10-06T20:00:00Z",
  };
}

function renderSheet() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const onOpenChange = jest.fn();
  const sheet = (site: Integration, open: boolean) => (
    <QueryClientProvider client={client}>
      <SiteSettingsSheet
        workspaceId="ws-1"
        site={site}
        open={open}
        canUpdate
        onOpenChange={onOpenChange}
      />
    </QueryClientProvider>
  );
  const view = render(sheet(A, true));
  /** Closes the sheet and opens it on another site, as the page does. */
  const switchTo = (site: Integration) => {
    view.rerender(sheet(A, false));
    view.rerender(sheet(site, true));
  };
  return { onOpenChange, switchTo };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("the site settings sheet", () => {
  it("shows a test's result on the site it was run for", async () => {
    api.integrations.test.mockResolvedValue(
      testResult(A, "a.example.com answered"),
    );
    renderSheet();

    await userEvent.click(
      screen.getByRole("button", { name: "Test connection" }),
    );

    expect(
      await screen.findByText("a.example.com answered"),
    ).toBeInTheDocument();
  });

  it("drops a test that finishes after the sheet moved to another site", async () => {
    const pending = later<ConnectionTestResult>();
    api.integrations.test.mockReturnValue(pending.promise);
    const { switchTo } = renderSheet();

    await userEvent.click(
      screen.getByRole("button", { name: "Test connection" }),
    );
    switchTo(B);
    await act(async () => {
      pending.resolve(testResult(A, "a.example.com answered"));
    });

    expect(
      screen.getByRole("heading", { name: "b.example.com" }),
    ).toBeVisible();
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Test connection" }),
      ).toBeEnabled(),
    );
    expect(
      screen.queryByText("a.example.com answered"),
    ).not.toBeInTheDocument();
  });

  it("doesn't close another site's sheet when an earlier save finishes", async () => {
    const pending = later<{ site: Integration }>();
    api.integrations.update.mockReturnValue(pending.promise);
    const { onOpenChange, switchTo } = renderSheet();

    await userEvent.type(screen.getByLabelText(/^API key/), "rext_new");
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(api.integrations.update).toHaveBeenCalled());
    switchTo(B);
    await act(async () => {
      pending.resolve({ site: A });
    });

    expect(api.integrations.update).toHaveBeenCalledWith("ws-1", A.id, {
      site_url: A.site_url,
      api_endpoint: A.api_endpoint,
      api_key: "rext_new",
    });
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith("a.example.com: saved"),
    );
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
    expect(
      screen.getByRole("heading", { name: "b.example.com" }),
    ).toBeVisible();
  });

  it("tells of an earlier save's failure in a toast, not in another site's sheet", async () => {
    const pending = later<{ site: Integration }>();
    api.integrations.update.mockReturnValue(pending.promise);
    const { switchTo } = renderSheet();

    await userEvent.type(screen.getByLabelText(/^API key/), "rext_new");
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(api.integrations.update).toHaveBeenCalled());
    switchTo(B);
    await act(async () => {
      pending.reject(new Error("The plugin refused the key."));
    });

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "a.example.com: not saved. The plugin refused the key.",
      ),
    );
    expect(screen.queryByText("Not saved")).not.toBeInTheDocument();
  });

  it("closes its own sheet when the save finishes", async () => {
    api.integrations.update.mockResolvedValue({ site: A });
    const { onOpenChange } = renderSheet();

    await userEvent.type(screen.getByLabelText(/^API key/), "rext_new");
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(toast.success).toHaveBeenCalledWith("Saved");
  });
});
