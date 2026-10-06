/**
 * The notification preferences (D7) are a form on the field set: each preference a switch with its
 * label, saved together, with the inline "Saved" or a danger Notice when the save fails.
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NotificationPreferencesForm } from "@/components/notification-settings/notification-preferences";
import { apiClient } from "@/lib/api-client";
import type { NotificationPreferencesApiResponse } from "@/schemas/notification-schemas";

jest.mock("@/lib/api-client", () => ({
  apiClient: { notifications: { updatePreferences: jest.fn() } },
}));

const updatePreferences = apiClient.notifications
  .updatePreferences as jest.Mock;

const preferences = {
  workspace_notifications: {
    invite_received: true,
    invite_accepted: true,
    role_changed: true,
    member_removed: true,
  },
  content_generation: {
    generation_started: false,
    generation_completed: true,
    generation_failed: true,
    content_published: true,
  },
  billing: {
    payment_success: true,
    payment_failed: true,
    subscription_cancelled: true,
    subscription_expiring: true,
    trial_ending: true,
    usage_limit_warning: true,
    usage_limit_exceeded: true,
  },
  email_digest: { enabled: false, frequency: "weekly" },
  marketing: { marketing_updates: false },
} as unknown as NotificationPreferencesApiResponse;

describe("NotificationPreferencesForm", () => {
  beforeEach(() => jest.clearAllMocks());

  it("saves a changed preference with the rest", async () => {
    updatePreferences.mockResolvedValue({});
    render(<NotificationPreferencesForm initialPreferences={preferences} />);

    const started = screen.getByRole("switch", { name: "Generation started" });
    expect(started).not.toBeChecked();
    await userEvent.click(started);
    await userEvent.click(
      screen.getByRole("button", { name: "Save preferences" }),
    );

    await waitFor(() =>
      expect(updatePreferences).toHaveBeenCalledWith(
        expect.objectContaining({ gen_started: true, gen_completed: true }),
      ),
    );
    expect(await screen.findByText("Saved")).toBeInTheDocument();
  });

  it("says so when the save fails", async () => {
    updatePreferences.mockRejectedValue(new Error("boom"));
    render(<NotificationPreferencesForm initialPreferences={preferences} />);

    await userEvent.click(screen.getByRole("switch", { name: "Payments" }));
    await userEvent.click(
      screen.getByRole("button", { name: "Save preferences" }),
    );

    expect(
      await screen.findByText("Your preferences couldn't be saved. Try again."),
    ).toBeInTheDocument();
  });

  it("asks how often only while the digest is on", async () => {
    render(<NotificationPreferencesForm initialPreferences={preferences} />);

    expect(screen.getByRole("combobox", { name: "How often" })).toBeDisabled();
    await userEvent.click(
      screen.getByRole("switch", { name: "Send me a digest" }),
    );
    expect(
      screen.getByRole("combobox", { name: "How often" }),
    ).not.toBeDisabled();
  });
});
