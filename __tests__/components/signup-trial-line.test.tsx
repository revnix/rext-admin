/**
 * Sign-up names the trial from the plan catalogue (C13): the figures are the backend's, and the
 * line is simply absent while the catalogue loads or when it fails, so the form never waits on it.
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import {
  SignupTrialLine,
  trialLine,
} from "@/components/auth/signup-trial-line";
import { apiClient } from "@/lib/api-client";
import type { CatalogTrial } from "@/types/plan-catalog";

jest.mock("@/lib/api-client", () => ({
  apiClient: { subscriptions: { getCatalog: jest.fn() } },
}));

const getCatalog = apiClient.subscriptions.getCatalog as jest.Mock;

const trial: CatalogTrial = {
  plan_name: "trial",
  days: 7,
  credits: 60,
  articles: 4,
  credits_renew: false,
  card_required: false,
  max_workspaces: 1,
  max_members_per_workspace: 1,
};

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("trialLine", () => {
  it("names the length, the credits and the articles from the catalogue", () => {
    expect(trialLine(trial)).toBe(
      "A new account starts with a 7-day trial: 60 credits, about 4 articles, no card needed.",
    );
  });

  it("says nothing about a card when the trial needs one", () => {
    expect(
      trialLine({ ...trial, card_required: true, days: 14, credits: 1200 }),
    ).toBe(
      "A new account starts with a 14-day trial: 1,200 credits, about 4 articles.",
    );
  });
});

describe("SignupTrialLine", () => {
  beforeEach(() => getCatalog.mockReset());

  it("shows the line once the catalogue answers", async () => {
    getCatalog.mockResolvedValue({ trial });
    render(<SignupTrialLine />, { wrapper });
    expect(
      await screen.findByText(/7-day trial: 60 credits/),
    ).toBeInTheDocument();
  });

  it("shows nothing while the catalogue loads", () => {
    getCatalog.mockReturnValue(new Promise(() => {}));
    const { container } = render(<SignupTrialLine />, { wrapper });
    expect(container).toBeEmptyDOMElement();
  });

  it("shows nothing when the catalogue fails or has no trial", async () => {
    getCatalog.mockRejectedValue(new Error("down"));
    const failed = render(<SignupTrialLine />, { wrapper });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(failed.container).toBeEmptyDOMElement();

    getCatalog.mockResolvedValue({ trial: null });
    const none = render(<SignupTrialLine />, { wrapper });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(none.container).toBeEmptyDOMElement();
  });
});
