/**
 * Exporting the account's data (#449, after rext-admin#416): the categories on the field set, the
 * export saved as a file when the backend returns it, and the email copy said to be on its way.
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PrivacySettings } from "@/components/account-settings/privacy-settings";
import { ApiError } from "@/lib/api-client/core";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
}));
jest.mock("@/lib/api-client", () => ({
  ApiError: jest.requireActual("@/lib/api-client/core").ApiError,
  apiClient: { account: { requestDataExport: jest.fn() } },
}));

const api = jest.requireMock("@/lib/api-client").apiClient as {
  account: { requestDataExport: jest.Mock };
};

const clicked = jest.fn();
beforeAll(() => {
  // jsdom has no object URLs and doesn't follow a download link.
  URL.createObjectURL = jest.fn(() => "blob:export");
  URL.revokeObjectURL = jest.fn();
  jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
    this: HTMLAnchorElement,
  ) {
    clicked(this.download);
  });
});

beforeEach(() => {
  jest.clearAllMocks();
});

function renderForm() {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <PrivacySettings />
    </QueryClientProvider>,
  );
}

describe("Exporting your data", () => {
  it("saves the export as a file and says the email copy is on its way", async () => {
    api.account.requestDataExport.mockResolvedValue({
      export_id: "e-1",
      filename: "rext_export.json",
      export_payload: { user: { email: "someone@example.com" } },
    });
    renderForm();

    await userEvent.click(
      screen.getByRole("button", { name: "Export my data" }),
    );

    expect(
      await screen.findByText("Your data is exported"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "The file is saved to this device, and a copy is on its way to your email address.",
      ),
    ).toBeInTheDocument();
    expect(clicked).toHaveBeenCalledWith("rext_export.json");
    expect(api.account.requestDataExport).toHaveBeenCalledWith(
      expect.objectContaining({ include_profile: true, include_billing: true }),
    );
  });

  it("says only that the email is on its way when no file came back", async () => {
    api.account.requestDataExport.mockResolvedValue({ export_id: "e-2" });
    renderForm();

    await userEvent.click(
      screen.getByRole("button", { name: "Export my data" }),
    );

    expect(
      await screen.findByText("Your export is on its way"),
    ).toBeInTheDocument();
    expect(clicked).not.toHaveBeenCalled();
  });

  it("says what went wrong when the export fails", async () => {
    api.account.requestDataExport.mockRejectedValue(
      new ApiError(429, "Too many", undefined, null),
    );
    renderForm();

    await userEvent.click(
      screen.getByRole("button", { name: "Export my data" }),
    );

    expect(
      await screen.findByText("Your data wasn't exported"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Too many export requests. Please wait a few minutes and try again.",
      ),
    ).toBeInTheDocument();
  });

  it("asks for at least one category", async () => {
    renderForm();
    for (const name of [
      "Profile information",
      "Role assignments",
      "Workspace memberships",
      "Activity log",
      "Subscription and billing",
      "Usage",
    ]) {
      await userEvent.click(screen.getByRole("checkbox", { name }));
    }

    await userEvent.click(
      screen.getByRole("button", { name: "Export my data" }),
    );

    await waitFor(() =>
      expect(
        screen.getByText("Select at least one category to export"),
      ).toBeInTheDocument(),
    );
    expect(api.account.requestDataExport).not.toHaveBeenCalled();
  });
});
