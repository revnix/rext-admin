import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import CreateWorkspacePage from "@/app/w/create/page";
import { ThemeProvider } from "@/providers/theme-provider";

jest.mock("@/components/page-layout", () => ({
  PageLayout: ({ title, description, children }: any) => (
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

jest.mock("@/hooks/use-permission", () => ({
  usePermissionDecision: jest.fn(() => ({
    hasAccess: true,
    isLoading: false,
  })),
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

    expect(screen.getAllByText(/workspace limit reached/i).length).toBeGreaterThan(0);
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

    expect(screen.getByText(/checking workspace permissions/i)).toBeInTheDocument();
    expect(screen.queryByText(/workspace limit reached/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/workspace details/i)).not.toBeInTheDocument();
  });
});
