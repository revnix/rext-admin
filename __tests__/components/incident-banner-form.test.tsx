/**
 * The super admin's switch for the incident banner (rext-control#728): what is showing now, the
 * form that shows a banner or replaces it, and "Switch it off".
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { IncidentBannerForm } from "@/components/admin/incident-banner-form";
import { apiClient } from "@/lib/api-client";

jest.mock("@/lib/api-client", () => ({
  apiClient: {
    incidentBanner: { get: jest.fn(), set: jest.fn(), clear: jest.fn() },
  },
}));
const mockToast = { success: jest.fn(), error: jest.fn() };
jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
}));

const api = apiClient.incidentBanner as unknown as Record<string, jest.Mock>;

const MESSAGE = "Article writing is slower than usual. We're working on it.";
const NONE = {
  active: false,
  message: null,
  areas: [],
  started_at: null,
  expires_at: null,
};
const showing = (changes: Record<string, unknown> = {}) => ({
  active: true,
  message: MESSAGE,
  areas: ["generation"],
  started_at: new Date().toISOString(),
  expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  ...changes,
});

/**
 * The backend, as far as the form can tell: what it says is showing, which a switch changes. The
 * form reads again after each switch, so the read has to answer with the new state.
 */
function serve(initial: unknown) {
  let state = initial;
  api.get.mockImplementation(async () => state);
  api.set.mockImplementation(async (input) => {
    state = showing(input);
    return state;
  });
  api.clear.mockImplementation(async () => {
    state = NONE;
    return state;
  });
}

function renderForm() {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <IncidentBannerForm />
    </QueryClientProvider>,
  );
}

const now = () => screen.getByRole("region", { name: "Showing now" });

beforeEach(() => jest.clearAllMocks());

describe("IncidentBannerForm", () => {
  it("says no banner is showing, and asks for a message before it shows one", async () => {
    api.get.mockResolvedValue(NONE);
    const user = userEvent.setup();
    renderForm();

    expect(
      await within(now()).findByText("No banner is showing."),
    ).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Show the banner" }));
    expect(await screen.findByText("Say what is happening")).toBeVisible();
    expect(api.set).not.toHaveBeenCalled();
  });

  it("shows a banner with its message, what is affected and an hour by default", async () => {
    serve(NONE);
    const user = userEvent.setup();
    renderForm();
    await within(now()).findByText("No banner is showing.");

    await user.type(screen.getByLabelText(/Message/), MESSAGE);
    await user.click(
      screen.getByRole("checkbox", { name: "Writing articles" }),
    );
    await user.click(screen.getByRole("checkbox", { name: "Publishing" }));
    await user.click(screen.getByRole("button", { name: "Show the banner" }));

    await waitFor(() =>
      expect(api.set).toHaveBeenCalledWith({
        message: MESSAGE,
        areas: ["generation", "publishing"],
        duration_minutes: 60,
      }),
    );
    // What is showing now is said at once, from the answer, with its switch.
    const state = within(now());
    expect(await state.findByText("A banner is showing")).toBeVisible();
    expect(now()).toHaveTextContent(MESSAGE);
    expect(now()).toHaveTextContent("Affected: writing articles, publishing.");
    expect(now()).toHaveTextContent(/It ends by itself at /);
    expect(mockToast.success).toHaveBeenCalledWith(
      "The banner is showing. Everyone signed in sees it within a minute.",
    );
    // The form now replaces it.
    expect(
      screen.getByRole("button", { name: "Replace the banner" }),
    ).toBeVisible();
  });

  it("unticks an area", async () => {
    serve(NONE);
    const user = userEvent.setup();
    renderForm();
    await within(now()).findByText("No banner is showing.");

    await user.type(screen.getByLabelText(/Message/), MESSAGE);
    await user.click(screen.getByRole("checkbox", { name: "Billing" }));
    await user.click(screen.getByRole("checkbox", { name: "Signing in" }));
    await user.click(screen.getByRole("checkbox", { name: "Billing" }));
    await user.click(screen.getByRole("button", { name: "Show the banner" }));

    await waitFor(() =>
      expect(api.set).toHaveBeenCalledWith(
        expect.objectContaining({ areas: ["sign_in"] }),
      ),
    );
  });

  it("refuses a message over the limit before any request", async () => {
    api.get.mockResolvedValue(NONE);
    const user = userEvent.setup();
    renderForm();
    await within(now()).findByText("No banner is showing.");

    const field = screen.getByLabelText(/Message/);
    // The field itself stops at the limit, so the words can't run past it.
    expect(field).toHaveAttribute("maxlength", "280");
    await user.click(field);
    await user.paste("x".repeat(300));
    expect(field).toHaveValue("x".repeat(280));
  });

  it("switches off the banner that is showing", async () => {
    serve(showing());
    const user = userEvent.setup();
    renderForm();

    await within(now()).findByText("A banner is showing");
    await user.click(screen.getByRole("button", { name: "Switch it off" }));

    await waitFor(() => expect(api.clear).toHaveBeenCalledTimes(1));
    expect(
      await within(now()).findByText("No banner is showing."),
    ).toBeVisible();
    expect(mockToast.success).toHaveBeenCalledWith("The banner is off.");
    expect(
      screen.getByRole("button", { name: "Show the banner" }),
    ).toBeVisible();
  });

  it("says why when the banner couldn't be switched on, and shows none", async () => {
    api.get.mockResolvedValue(NONE);
    api.set.mockRejectedValue(
      new Error("the store that holds it can't be reached."),
    );
    const user = userEvent.setup();
    renderForm();
    await within(now()).findByText("No banner is showing.");

    await user.type(screen.getByLabelText(/Message/), MESSAGE);
    await user.click(screen.getByRole("button", { name: "Show the banner" }));

    await waitFor(() =>
      expect(mockToast.error).toHaveBeenCalledWith(
        "The banner wasn't switched on: the store that holds it can't be reached.",
      ),
    );
    expect(within(now()).getByText("No banner is showing.")).toBeVisible();
    // What was typed is still there to send again.
    expect(screen.getByLabelText(/Message/)).toHaveValue(MESSAGE);
  });

  it("says so when it can't read what is showing, and still takes a banner", async () => {
    api.get.mockRejectedValue(new Error("We couldn't reach the server."));
    renderForm();

    expect(
      await within(now()).findByText("The banner's state couldn't be read"),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Show the banner" }),
    ).toBeEnabled();
  });

  it("stays busy until the request settles, so a second click sends nothing more", async () => {
    serve(NONE);
    let settle: () => void = () => {};
    api.set.mockImplementation(
      (input) =>
        new Promise((resolve) => {
          settle = () => {
            serve(showing(input));
            resolve(showing(input));
          };
        }),
    );
    const user = userEvent.setup();
    renderForm();
    await within(now()).findByText("No banner is showing.");

    await user.type(screen.getByLabelText(/Message/), MESSAGE);
    const submit = screen.getByRole("button", { name: "Show the banner" });
    await user.click(submit);
    await waitFor(() => expect(submit).toBeDisabled());
    await user.click(submit);
    expect(api.set).toHaveBeenCalledTimes(1);

    settle();
    expect(await within(now()).findByText("A banner is showing")).toBeVisible();
  });

  it("doesn't let a read that was already on its way undo a fresh switch", async () => {
    // The first read is still in flight, holding "none", when the banner is switched on.
    let answerOldRead: (banner: unknown) => void = () => {};
    api.get
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            answerOldRead = resolve;
          }),
      )
      .mockResolvedValue(showing());
    api.set.mockImplementation(async (input) => showing(input));
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(/Message/), MESSAGE);
    await user.click(screen.getByRole("button", { name: "Show the banner" }));
    expect(await within(now()).findByText("A banner is showing")).toBeVisible();

    answerOldRead(NONE);
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(within(now()).getByText("A banner is showing")).toBeVisible();
  });
});
