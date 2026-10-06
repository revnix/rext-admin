import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PageSkeleton, SectionSkeleton } from "@/components/layouts";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { Notice } from "@/components/ui/notice";
import { RouteError } from "@/components/ui/route-error";

describe("Notice with a close button", () => {
  it("names the button and calls onDismiss", async () => {
    const onDismiss = jest.fn();
    render(
      <Notice
        tone="warning"
        title="Workspaces limit almost reached"
        onDismiss={onDismiss}
        dismissLabel="Dismiss workspaces usage warning"
      />,
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Dismiss workspaces usage warning" }),
    );
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("has none without onDismiss", () => {
    render(<Notice tone="success" title="Saved" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});

describe("ErrorBoundary", () => {
  it("shows a danger Notice in place of a part that throws, and Try again draws it again", async () => {
    const quiet = jest.spyOn(console, "error").mockImplementation(() => {});
    let fail = true;
    function Chart() {
      if (fail) throw new Error("Cannot read properties of undefined");
      return <p>The chart</p>;
    }
    render(
      <QueryClientProvider client={new QueryClient()}>
        <ErrorBoundary title="The chart didn't load">
          <Chart />
        </ErrorBoundary>
      </QueryClientProvider>,
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "The chart didn't load",
    );
    expect(screen.queryByText(/Cannot read/)).not.toBeInTheDocument();

    fail = false;
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(screen.getByText("The chart")).toBeInTheDocument();
    quiet.mockRestore();
  });

  it("puts the Notice in the page's frame around a whole page", () => {
    const quiet = jest.spyOn(console, "error").mockImplementation(() => {});
    function Page(): never {
      throw new Error("The page broke");
    }
    const { container } = render(
      <QueryClientProvider client={new QueryClient()}>
        <ErrorBoundary framed>
          <Page />
        </ErrorBoundary>
      </QueryClientProvider>,
    );
    expect(container.querySelector('[data-slot="page"]')).toContainElement(
      screen.getByRole("alert"),
    );
    quiet.mockRestore();
  });
});

describe("The retired names", () => {
  it("leave no second name for the error boundary (C5b #449)", async () => {
    const boundary = await import("@/components/ui/error-boundary");
    expect(Object.keys(boundary)).toEqual(["ErrorBoundary"]);
  });
});

describe("RouteError", () => {
  const error = Object.assign(
    new Error("Cannot read properties of undefined"),
    {
      digest: "abc123",
    },
  );

  it("inside the shell, is a danger Notice in the page's frame", async () => {
    const reset = jest.fn();
    const { container } = render(
      <RouteError
        error={error}
        reset={reset}
        title="Billing error"
        layout="container"
        navigationLink="/settings/subscription"
        navigationLabel="Subscription settings"
      />,
    );
    expect(container.querySelector('[data-slot="page"]')).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Billing error");
    expect(screen.getByText("Error ID: abc123")).toBeInTheDocument();
    expect(screen.queryByText(/Cannot read/)).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Subscription settings" }),
    ).toHaveAttribute("href", "/settings/subscription");
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("inside a page layout, is the Notice alone", () => {
    const { container } = render(
      <RouteError error={error} reset={jest.fn()} layout="inline" />,
    );
    expect(
      container.querySelector('[data-slot="page"]'),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("on a page of its own, makes the title the h1", () => {
    render(<RouteError error={error} reset={jest.fn()} title="Login error" />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Login error" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Error abc123")).toBeInTheDocument();
  });
});

describe("The layouts' skeletons", () => {
  it("say what is loading and hold back for 200 ms", () => {
    render(<PageSkeleton layout="form" label="Checking workspace limits..." />);
    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("Checking workspace limits...");
    expect(status).toHaveClass("delay-200", "fill-mode-backwards");
  });

  it("draw a settings section without a second frame", () => {
    const { container } = render(<SectionSkeleton />);
    expect(
      container.querySelector('[data-slot="page"]'),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Loading");
  });
});
