/**
 * A page that is still open after its session ended (revnix/rext-control#858): it says so, and
 * holds the way back in. A sign-out's navigation used to be held back by the browser's own
 * "Leave site?" on a form with unsaved changes; "Stay" left a page that looked alive.
 */

import { act, render, renderHook, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SignedOutNotice } from "@/components/auth/signed-out-notice";
import { useLeaveGuard } from "@/components/forms/use-leave-guard";
import {
  isSignedOut,
  leaveSignedOut,
  reportSignedIn,
  reportSignedOut,
  signInAgain,
  signInUrlFromHere,
} from "@/lib/auth/signed-out";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));
jest.mock("sonner", () => ({
  toast: { warning: jest.fn(), dismiss: jest.fn() },
}));
jest.mock("@/lib/auth/go-to", () => ({ goTo: jest.fn() }));

const goTo = jest.requireMock("@/lib/auth/go-to").goTo as jest.Mock;
const { toast } = jest.requireMock("sonner") as {
  toast: { warning: jest.Mock; dismiss: jest.Mock };
};

/** Whether the browser would ask "Leave site?" on leaving now. */
const browserWouldAsk = () => {
  const event = new Event("beforeunload", { cancelable: true });
  window.dispatchEvent(event);
  return event.defaultPrevented;
};

beforeEach(() => {
  goTo.mockClear();
  toast.warning.mockClear();
  toast.dismiss.mockClear();
  act(() => reportSignedIn());
  window.history.pushState({}, "", "/w/acme/personas/create?step=2");
});

describe("leaving for the sign-in page after a sign-out", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it("goes at once from a page with nothing unsaved", () => {
    jest.useFakeTimers();
    leaveSignedOut("/login?error=SessionEnded");

    expect(goTo).toHaveBeenCalledWith("/login?error=SessionEnded");
    expect(isSignedOut()).toBe(false);
  });

  it("says nothing while the page is being left, and says so if it is still open a moment later", () => {
    jest.useFakeTimers();
    leaveSignedOut("/login?error=SessionEnded");

    // A request the page refuses to send on its way out is no news.
    reportSignedOut();
    expect(isSignedOut()).toBe(false);

    jest.advanceTimersByTime(3000);
    expect(isSignedOut()).toBe(true);
  });

  it("does not leave a form with unsaved changes: the page says so and the person decides", () => {
    renderHook(() => useLeaveGuard(true));

    leaveSignedOut("/login?error=SessionEnded");

    expect(goTo).not.toHaveBeenCalled();
    expect(isSignedOut()).toBe(true);
  });
});

describe("the way back in", () => {
  it("goes to the sign-in page a sign-out was heading for", () => {
    reportSignedOut("/login?error=SessionEnded");
    signInAgain();
    expect(goTo).toHaveBeenCalledWith("/login?error=SessionEnded");
  });

  it("goes to the sign-in page with the way back to this page otherwise", () => {
    reportSignedOut();
    signInAgain();
    expect(goTo).toHaveBeenCalledWith(
      "/login?redirect=%2Fw%2Facme%2Fpersonas%2Fcreate%3Fstep%3D2&error=SessionExpired",
    );
  });

  it("names no page to come back to from the home page", () => {
    window.history.pushState({}, "", "/");
    expect(signInUrlFromHere("SessionEnded")).toBe("/login?error=SessionEnded");
  });
});

describe("the signed-out notice", () => {
  it("shows nothing while the page has its session", () => {
    render(<SignedOutNotice />);
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });

  it("says the page is signed out, and signs in again on its button", async () => {
    render(<SignedOutNotice />);
    act(() => reportSignedOut());

    const notice = await screen.findByRole("alertdialog", {
      name: "You've been signed out",
    });
    expect(notice).toHaveTextContent("Sign in again to carry on.");
    expect(notice).not.toHaveTextContent("won't be kept");

    await userEvent.click(
      screen.getByRole("button", { name: "Sign in again" }),
    );
    expect(goTo).toHaveBeenCalledTimes(1);
  });

  it("says what happens to unsaved text, and leaves without the browser asking again", async () => {
    renderHook(() => useLeaveGuard(true));
    render(<SignedOutNotice />);
    expect(browserWouldAsk()).toBe(true);
    act(() => reportSignedOut("/login"));

    expect(await screen.findByRole("alertdialog")).toHaveTextContent(
      "What you typed on this page won't be kept, so copy anything you need first.",
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Sign in again" }),
    );
    expect(goTo).toHaveBeenCalledWith("/login");
    expect(browserWouldAsk()).toBe(false);
  });

  it("says so too when the form was submitting as the session's end was met", async () => {
    // A form lifts its guard while it submits, and puts it back when the submit fails.
    const { rerender } = renderHook(
      ({ dirty }: { dirty: boolean }) => useLeaveGuard(dirty),
      { initialProps: { dirty: false } },
    );
    render(<SignedOutNotice />);
    act(() => reportSignedOut());
    expect(await screen.findByRole("alertdialog")).not.toHaveTextContent(
      "won't be kept",
    );

    rerender({ dirty: true });

    expect(screen.getByRole("alertdialog")).toHaveTextContent(
      "What you typed on this page won't be kept, so copy anything you need first.",
    );
  });

  it("stays in sight with the same button once put aside", async () => {
    render(<SignedOutNotice />);
    act(() => reportSignedOut());

    await userEvent.click(
      await screen.findByRole("button", { name: "Stay on this page" }),
    );

    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(toast.warning).toHaveBeenCalledWith(
      "You've been signed out",
      expect.objectContaining({
        duration: Number.POSITIVE_INFINITY,
        action: { label: "Sign in again", onClick: signInAgain },
      }),
    );
  });

  it("goes by itself when a session is found again", async () => {
    render(<SignedOutNotice />);
    act(() => reportSignedOut());
    await screen.findByRole("alertdialog");

    act(() => reportSignedIn());

    expect(screen.queryByRole("alertdialog")).toBeNull();
  });
});
