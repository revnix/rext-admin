/**
 * An error toast is reported (rext-control task 894), from the one place every toast passes
 * through: where it came up, the name the code gave it, and its sentence only when that is one
 * of the app's own fixed texts. A toast carrying a backend's answer or a person's data is counted
 * and never quoted.
 */
import { act, render, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { analytics } from "@/lib/analytics";
import { setWords, wordsLoaded } from "@/lib/analytics-recording";
import { markOf } from "@/lib/recording-words";

jest.mock("@/lib/analytics", () => ({ analytics: { track: jest.fn() } }));

const track = analytics.track as jest.Mock;
const sent = () =>
  track.mock.calls
    .filter(([event]) => event === "error_toast_shown")
    .map(([, properties]) => properties);

const OWN = "An error occurred. Please try again.";
const UPDATING = "Rext is updating";
const THEIRS = "Workspace acme-corp of ana@example.com is over its limit";

const realFetch = global.fetch;

beforeEach(() => {
  track.mockClear();
  // The app's own words are in place, as a recorded session has them from its start.
  setWords([OWN, UPDATING]);
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => [markOf(OWN), markOf(UPDATING)],
  }) as unknown as typeof fetch;
  window.history.replaceState(null, "", "/w/acme-corp/content/6f1c2d3e");
});
afterEach(() => {
  act(() => {
    toast.dismiss();
  });
  global.fetch = realFetch;
});

describe("an error toast", () => {
  it("is reported with its sentence when that is one of the app's own", async () => {
    render(<Toaster />);

    act(() => {
      toast.error(OWN);
    });

    await waitFor(() =>
      expect(sent()).toEqual([
        { route: "/w/*/content/*", own_words: true, message: OWN },
      ]),
    );
  });

  it("is counted and not quoted when its sentence is not the app's own", async () => {
    render(<Toaster />);

    act(() => {
      toast.error(THEIRS);
    });

    await waitFor(() =>
      expect(sent()).toEqual([{ route: "/w/*/content/*", own_words: false }]),
    );
    const everything = JSON.stringify(track.mock.calls);
    for (const kept of ["acme-corp", "ana@example.com", "over its limit"]) {
      expect(everything).not.toContain(kept);
    }
  });

  it("carries the name the code gave it, and is reported once while it shows", async () => {
    render(<Toaster />);

    act(() => {
      toast.error(UPDATING, { id: "sign-in-backend-away" });
    });
    await waitFor(() => expect(sent()).toHaveLength(1));
    // The same toast, said again in place: still the one report.
    act(() => {
      toast.error(UPDATING, { id: "sign-in-backend-away" });
    });
    act(() => {
      toast.success("Saved");
    });
    await waitFor(() => expect(sent()).toHaveLength(1));

    expect(sent()).toEqual([
      {
        route: "/w/*/content/*",
        toast: "sign-in-backend-away",
        own_words: true,
        message: UPDATING,
      },
    ]);
  });

  it("is not reported for a toast that is not an error", async () => {
    render(<Toaster />);

    act(() => {
      toast.success("Saved");
      toast.info(UPDATING);
      toast(OWN);
    });
    // Give the report its turn: it has nothing to say.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(sent()).toEqual([]);
  });

  it("is sent at once while the word list isn't read, saying nothing of whose words they were, and reads the list for the next", async () => {
    setWords(null);
    render(<Toaster />);

    act(() => {
      toast.error(OWN);
    });
    await waitFor(() => expect(sent()).toEqual([{ route: "/w/*/content/*" }]));
    expect(global.fetch).toHaveBeenCalledWith("/api/recording-words");
    await waitFor(() => expect(wordsLoaded()).toBe(true));

    act(() => {
      toast.error(UPDATING);
    });
    await waitFor(() =>
      expect(sent()[1]).toEqual({
        route: "/w/*/content/*",
        own_words: true,
        message: UPDATING,
      }),
    );
  });

  it("goes out with the page it came up on, even when the page changes straight after", async () => {
    render(<Toaster />);

    act(() => {
      toast.error(OWN);
    });
    await waitFor(() => expect(sent()).toHaveLength(1));
    window.history.replaceState(null, "", "/settings/security");

    expect(sent()[0].route).toBe("/w/*/content/*");
  });
});
