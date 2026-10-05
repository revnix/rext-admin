import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import CreateWorkspacePage from "@/app/w/create/page";
import { ThemeProvider } from "@/providers/theme-provider";

interface PageLayoutProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

jest.mock("@/components/page-layout", () => ({
  PageLayout: ({ title, description, children }: PageLayoutProps) => (
    <div>
      <h1>{title}</h1>
      <p>{description}</p>
      {children}
    </div>
  ),
}));

jest.mock("@/components/workspace", () => ({
  WorkspaceCreateWizard: () => <div>Workspace details</div>,
}));

jest.mock("@/hooks/use-page-title", () => ({
  usePageTitle: jest.fn(),
}));

// Must be a real jest.mock registration: the page imports the module normally,
// so a bare jest.requireMock (automock) would never reach the component and the
// real React-Query hook would run instead.
jest.mock("@/components/subscription/usage-limit-warning", () => ({
  useResourceLimit: jest.fn(),
}));

const mockUseResourceLimit = jest.requireMock(
  "@/components/subscription/usage-limit-warning",
).useResourceLimit;

describe("CreateWorkspacePage", () => {
  beforeEach(() => {
    mockUseResourceLimit.mockReset();
  });

  it("shows a limit reached state when the plan workspace cap is already used", () => {
    mockUseResourceLimit.mockReturnValue({
      isLimitReached: true,
      isLoading: false,
      canCreate: false,
      usagePercentage: 100,
    });

    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <CreateWorkspacePage />
        </ThemeProvider>
      </QueryClientProvider>,
    );

    expect(
      screen.getAllByText(/workspace limit reached/i).length,
    ).toBeGreaterThan(0);
    expect(screen.queryByText(/workspace details/i)).not.toBeInTheDocument();
  });

  it("waits for the limit check to finish before rendering the wizard", () => {
    mockUseResourceLimit.mockReturnValue({
      isLimitReached: false,
      isLoading: true,
      canCreate: false,
      usagePercentage: 0,
    });

    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <CreateWorkspacePage />
        </ThemeProvider>
      </QueryClientProvider>,
    );

    expect(screen.getByText(/checking workspace limits/i)).toBeInTheDocument();
    expect(
      screen.queryByText(/workspace limit reached/i),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/workspace details/i)).not.toBeInTheDocument();
  });

  it("keeps the wizard mounted when creating the last allowed workspace", () => {
    mockUseResourceLimit.mockReturnValue({
      isLimitReached: false,
      isLoading: false,
      canCreate: true,
      usagePercentage: 50,
    });

    const queryClient = new QueryClient();

    const { rerender } = render(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <CreateWorkspacePage />
        </ThemeProvider>
      </QueryClientProvider>,
    );

    mockUseResourceLimit.mockReturnValue({
      isLimitReached: true,
      isLoading: false,
      canCreate: false,
      usagePercentage: 100,
    });

    rerender(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <CreateWorkspacePage />
        </ThemeProvider>
      </QueryClientProvider>,
    );

    expect(screen.getByText(/workspace details/i)).toBeInTheDocument();
    expect(
      screen.queryByText(/workspace limit reached/i),
    ).not.toBeInTheDocument();
  });
});
