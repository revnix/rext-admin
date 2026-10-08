/**
 * The shared error boundary's fallback (rext-control task 798): a part that is an extra over
 * something plainer (a wait's filling view over the wait's own box) is replaced by that plainer
 * view when it throws, with no notice and nothing to try again, and the error is logged as the
 * notice's path logs it.
 */
import { render, screen } from "@testing-library/react";
import { FillBoundary } from "@/components/generate-content/fill-progress";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { log } from "@/lib/logger";

jest.mock("@/lib/logger", () => ({
  log: { error: jest.fn(), warn: jest.fn(), info: jest.fn() },
}));
const logged = log.error as jest.Mock;

function Throws(): never {
  throw new Error("the filling view broke");
}

beforeEach(() => {
  logged.mockClear();
  // React reports a caught render error on the console; the test reads the log instead.
  jest.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());

describe("the error boundary with a fallback", () => {
  it("shows the fallback in place of the notice, with nothing to try again", () => {
    render(
      <ErrorBoundary fallback={<p>The wait's own box</p>}>
        <Throws />
      </ErrorBoundary>,
    );

    expect(screen.getByText("The wait's own box")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Try again" })).toBeNull();
    expect(screen.queryByText(/didn't load/)).toBeNull();
  });

  it("logs the error as its notice path does", () => {
    render(
      <ErrorBoundary fallback={<p>The wait's own box</p>}>
        <Throws />
      </ErrorBoundary>,
    );

    expect(logged).toHaveBeenCalledWith(
      "ErrorBoundary caught an error:",
      expect.objectContaining({ message: "the filling view broke" }),
    );
  });

  it("takes nothing as a fallback too: the part is simply gone", () => {
    const { container } = render(
      <ErrorBoundary fallback={null}>
        <Throws />
      </ErrorBoundary>,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("still shows its notice with Try again when no fallback is given", () => {
    render(
      <ErrorBoundary title="The editor didn't load">
        <Throws />
      </ErrorBoundary>,
    );
    expect(screen.getByText("The editor didn't load")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Try again" }),
    ).toBeInTheDocument();
  });
});

describe("a step's filling view that throws", () => {
  it("leaves the wait's box alone in its place, through the shared boundary", () => {
    render(
      <FillBoundary fallback={<p>Run in progress</p>}>
        <Throws />
      </FillBoundary>,
    );
    expect(screen.getByText("Run in progress")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Try again" })).toBeNull();
    expect(logged).toHaveBeenCalledTimes(1);
  });
});
