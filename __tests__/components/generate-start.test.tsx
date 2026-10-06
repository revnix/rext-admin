import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { KeywordForm } from "@/components/generate-content/keyword";
import { RecentKeywords } from "@/components/generate-content/recent-keywords";
import { useGeneratePreferencesStore } from "@/stores/generate-preferences-store";

const push = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));
jest.mock("@/providers/workspace-provider", () => ({
  useWorkspace: () => ({
    workspace: { id: "w1" },
    workspaceId: "w1",
    workspaceSlug: "acme",
  }),
}));
jest.mock("@/hooks/use-auth-session", () => ({
  useAuthSession: () => ({ user: { id: "u1" } }),
}));

const granted = new Set<string>();
jest.mock("@/hooks/use-permission", () => ({
  useWorkspacePermission: (permission: string) => ({
    hasPermission: granted.has(permission),
    isLoading: false,
  }),
}));

const searchLibrary = jest.fn();
jest.mock("@/lib/generate-content/library-item", () => ({
  searchLibrary: (...args: unknown[]) => searchLibrary(...args),
  libraryStartQuery: (key: string) => `library=${encodeURIComponent(key)}`,
}));

// The cost comes from the backend's cost table (E13); here it is a stand-in.
jest.mock("@/components/generate-content/run-cost", () => ({
  RunCostLabel: () => <span>· 1 credit</span>,
  RunCostTooltip: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock("@/components/ui/country-dropdown", () => ({
  CountryDropdown: ({
    value,
    onChange,
  }: {
    value: string;
    onChange: (country: { alpha2: string }) => void;
  }) => (
    <button type="button" onClick={() => onChange({ alpha2: "gb" })}>
      Country {value}
    </button>
  ),
}));

const entry = (key: string, keyword: string, timestamp: string) => ({
  key,
  value: {
    original_query: keyword,
    recommendations: [],
    seo_state: {
      keyword_difficulty: 42,
      intent: ["commercial"],
      volume: 1200,
      volume_status: "ok",
    },
    timestamp,
  },
});

const renderRecent = () =>
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <RecentKeywords />
    </QueryClientProvider>,
  );

const renderForm = (props: Partial<Parameters<typeof KeywordForm>[0]> = {}) => {
  const handlers = {
    onSubmit: jest.fn(),
    onKeywordChange: jest.fn(),
    onCountryChange: jest.fn(),
  };
  render(
    <KeywordForm userKeyword="crm" country="us" {...handlers} {...props} />,
  );
  return handlers;
};

beforeEach(() => {
  jest.clearAllMocks();
  granted.clear();
  useGeneratePreferencesStore.setState({ countryByWorkspace: {} });
});

describe("RecentKeywords", () => {
  it("lists the five newest keywords as compact cards, each with Use", async () => {
    granted.add("content.read");
    granted.add("content.create");
    searchLibrary.mockResolvedValue(
      ["one", "two", "three", "four", "five", "six"].map((keyword, i) =>
        entry(`k${i}`, keyword, `2026-10-0${6 - i}T09:00:00Z`),
      ),
    );
    renderRecent();

    const section = await screen.findByRole("region", {
      name: "Recent keywords",
    });
    expect(within(section).getAllByRole("listitem")).toHaveLength(5);
    expect(within(section).queryByText("six")).toBeNull();
    expect(within(section).getAllByText("1.2K searches")).toHaveLength(5);
    expect(
      within(section).getByRole("link", { name: "All keywords" }),
    ).toHaveAttribute("href", "/w/acme/keywords");
    expect(searchLibrary).toHaveBeenCalledWith("u1", "w1");
  });

  it("starts an article from the saved research on Use", async () => {
    granted.add("content.read");
    granted.add("content.create");
    searchLibrary.mockResolvedValue([
      entry("library_seo tools_1", "seo tools", "2026-10-05T09:00:00Z"),
    ]);
    renderRecent();

    fireEvent.click(
      await screen.findByRole("button", { name: "Use: seo tools" }),
    );
    expect(push).toHaveBeenCalledWith(
      "/w/acme/generate_content?library=library_seo%20tools_1",
    );
  });

  it("locks Use for a member who may not generate", async () => {
    granted.add("content.read");
    searchLibrary.mockResolvedValue([
      entry("k1", "crm", "2026-10-05T09:00:00Z"),
    ]);
    renderRecent();

    const use = await screen.findByRole("button", { name: "Use: crm" });
    expect(use).toHaveAttribute("aria-disabled", "true");
    fireEvent.click(use);
    expect(push).not.toHaveBeenCalled();
  });

  it("shows nothing before the first keyword", async () => {
    granted.add("content.read");
    searchLibrary.mockResolvedValue([]);
    const { container } = renderRecent();
    await waitFor(() => expect(searchLibrary).toHaveBeenCalled());
    await act(() => Promise.resolve());
    expect(container).toBeEmptyDOMElement();
  });

  it("reads nothing for a member who may not read the workspace's content", () => {
    const { container } = renderRecent();
    expect(searchLibrary).not.toHaveBeenCalled();
    expect(container).toBeEmptyDOMElement();
  });
});

describe("KeywordForm", () => {
  it("starts a new search in the country this workspace searched in last", () => {
    granted.add("content.create");
    useGeneratePreferencesStore.setState({ countryByWorkspace: { w1: "de" } });
    const { onCountryChange } = renderForm({ restoreCountry: true });
    expect(onCountryChange).toHaveBeenCalledTimes(1);
    expect(onCountryChange).toHaveBeenCalledWith("de");
  });

  it("keeps a restored run's own country", () => {
    granted.add("content.create");
    useGeneratePreferencesStore.setState({ countryByWorkspace: { w1: "de" } });
    const { onCountryChange } = renderForm();
    expect(onCountryChange).not.toHaveBeenCalled();
  });

  it("remembers the country the user picks, for this workspace", () => {
    granted.add("content.create");
    const { onCountryChange } = renderForm({ restoreCountry: true });
    fireEvent.click(screen.getByRole("button", { name: "Country us" }));
    expect(onCountryChange).toHaveBeenCalledWith("gb");
    expect(useGeneratePreferencesStore.getState().countryByWorkspace).toEqual({
      w1: "gb",
    });
  });

  it("puts the run's cost on Analyze", () => {
    granted.add("content.create");
    const { onSubmit } = renderForm();
    const analyze = screen.getByRole("button", { name: /Analyze/ });
    expect(analyze).toHaveTextContent("Analyze· 1 credit");
    fireEvent.click(analyze);
    expect(onSubmit).toHaveBeenCalled();
  });

  it("locks Analyze for a member who may not generate", () => {
    const { onSubmit } = renderForm();
    const analyze = screen.getByRole("button", { name: /Analyze/ });
    expect(analyze).toHaveAttribute("aria-disabled", "true");
    expect(analyze).not.toHaveTextContent("credit");
    fireEvent.submit(analyze.closest("form") as HTMLFormElement);
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
