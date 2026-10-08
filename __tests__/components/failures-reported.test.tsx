/**
 * A failure a person meets is reported (rext-control task 894): that an error screen came up or a
 * page wasn't there, on which kind of page, and the error's class. Never the error's message, and
 * never a part of the address that isn't one of the app's own words.
 */
import { render } from "@testing-library/react";
import { PageNotFoundReport } from "@/components/analytics/page-not-found-report";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { RouteError } from "@/components/ui/route-error";
import { analytics } from "@/lib/analytics";
import { ApiError } from "@/lib/api-client/core";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
}));
jest.mock("@/lib/analytics", () => ({ analytics: { track: jest.fn() } }));
jest.mock("@/lib/logger", () => ({
  log: { error: jest.fn(), warn: jest.fn(), info: jest.fn() },
}));

const track = analytics.track as jest.Mock;
const sent = (name: string) =>
  track.mock.calls
    .filter(([event]) => event === name)
    .map(([, properties]) => properties);

const SECRET = "Workspace acme-corp of ana@example.com could not be read";

function Throws(): never {
  throw new ApiError(500, SECRET);
}

beforeEach(() => {
  track.mockClear();
  window.history.replaceState(null, "", "/w/acme-corp/content/6f1c2d3e");
  // React reports a caught render error on the console.
  jest.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());

describe("an error screen", () => {
  it("says it came up for a page: where, the error's class, the backend's status, its digest", () => {
    const error = Object.assign(new ApiError(503, SECRET), {
      digest: "3721904455",
    });

    render(
      <RouteError
        error={error}
        reset={jest.fn()}
        logContext="WorkspaceError"
        layout="container"
      />,
    );

    expect(sent("error_screen_shown")).toEqual([
      {
        where: "page",
        context: "WorkspaceError",
        route: "/w/*/content/*",
        error_kind: "ApiError",
        status: 503,
        digest: "3721904455",
      },
    ]);
  });

  it("says it came up for a part of a page that shows its failure", () => {
    render(
      <ErrorBoundary title="The editor didn't load">
        <Throws />
      </ErrorBoundary>,
    );

    expect(sent("error_screen_shown")).toEqual([
      {
        where: "part",
        route: "/w/*/content/*",
        error_kind: "ApiError",
        status: 500,
      },
    ]);
  });

  it("says nothing for a part that falls back to a plainer view: the person is shown no failure", () => {
    render(
      <ErrorBoundary fallback={<p>The wait's own box</p>}>
        <Throws />
      </ErrorBoundary>,
    );

    expect(track).not.toHaveBeenCalled();
  });

  it("never carries the error's message or whose page it was", () => {
    render(<RouteError error={new ApiError(500, SECRET)} reset={jest.fn()} />);
    render(
      <ErrorBoundary>
        <Throws />
      </ErrorBoundary>,
    );

    const everything = JSON.stringify(track.mock.calls);
    for (const kept of ["acme-corp", "ana@example.com", "could not be read"]) {
      expect(everything).not.toContain(kept);
    }
  });
});

describe("a page that isn't there", () => {
  it("is reported once, as the address's shape", () => {
    window.history.replaceState(null, "", "/w/acme-corp/contnet");

    const { rerender } = render(<PageNotFoundReport />);
    rerender(<PageNotFoundReport />);

    expect(sent("page_not_found")).toEqual([{ route: "/w/*/*" }]);
  });
});
