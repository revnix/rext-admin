// Jest setup file for global test configuration

// Enable jest-dom matchers
import "@testing-library/jest-dom";

// Store original console methods for detailed test output
const _originalConsoleError = console.error;
const _originalConsoleWarn = console.warn;
const _originalConsoleLog = console.log;

// Enable all console output for detailed testing
// Note: All errors, warnings, and logs will be shown for comprehensive debugging

// Mock Next.js router
jest.mock("next/router", () => ({
  useRouter() {
    return {
      route: "/",
      pathname: "/",
      query: {},
      asPath: "/",
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn().mockResolvedValue(undefined),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
      isFallback: false,
    };
  },
}));

// Mock Next.js navigation
jest.mock("next/navigation", () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return "/";
  },
}));

// Global test utilities - no suppression to show real issues

// Mock window.matchMedia for components using media queries
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock localStorage for Zustand persist tests
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
} as Storage;
global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
} as Storage;
global.sessionStorage = sessionStorageMock;

// Mock TanStack Query Client for tests
jest.mock("@/lib/query-client", () => ({
  getQueryClient: () => ({
    clear: jest.fn(),
    getQueryCache: jest.fn(() => ({
      clear: jest.fn(),
    })),
    getMutationCache: jest.fn(() => ({
      clear: jest.fn(),
    })),
    invalidateQueries: jest.fn(),
    refetchQueries: jest.fn(),
  }),
}));

// Mock fetch globally
global.fetch = jest.fn();

// Mock Request for API route testing
global.Request = class MockRequest {
  url: string;
  method: string;
  headers: Headers;
  body: string | null;

  constructor(url: string, init: RequestInit = {}) {
    this.url = url;
    this.method = init.method || "GET";
    this.headers = {
      get: (name: string) => {
        if (
          init.headers &&
          typeof init.headers === "object" &&
          !Array.isArray(init.headers)
        ) {
          return (init.headers as Record<string, string>)[name] || null;
        }
        return null;
      },
      has: () => false,
      set: () => {},
      append: () => {},
      delete: () => {},
      forEach: () => {},
      entries: () => [][Symbol.iterator](),
      keys: () => [][Symbol.iterator](),
      values: () => [][Symbol.iterator](),
      getSetCookie: () => [],
    } as unknown as Headers;
    this.body = (init.body as string) || null;
  }

  async json() {
    return this.body ? JSON.parse(this.body) : null;
  }

  async text() {
    return this.body || "";
  }
} as unknown as typeof Request;

global.Response = {
  json: (data: unknown, init?: ResponseInit) =>
    ({
      status: init?.status || 200,
      headers: {
        get: (name: string) => {
          if (
            init?.headers &&
            typeof init.headers === "object" &&
            !Array.isArray(init.headers)
          ) {
            return (init.headers as Record<string, string>)[name] || null;
          }
          return null;
        },
      } as unknown as Headers,
      json: async () => data,
      text: async () => JSON.stringify(data),
      ok: true,
      redirected: false,
      statusText: "OK",
      type: "basic",
      url: "",
      clone: () => ({}) as Response,
      body: null,
      bodyUsed: false,
      arrayBuffer: async () => new ArrayBuffer(0),
      blob: async () => new Blob(),
      formData: async () => new FormData(),
    }) as Response,
} as typeof global.Response;

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Global test cleanup to prevent memory leaks
afterEach(() => {
  // Clear all timers
  jest.clearAllTimers();

  // Reset localStorage and sessionStorage mocks
  if (global.localStorage && "mockClear" in global.localStorage.clear) {
    (global.localStorage.clear as jest.Mock).mockClear();
    (global.localStorage.getItem as jest.Mock).mockClear();
    (global.localStorage.setItem as jest.Mock).mockClear();
    (global.localStorage.removeItem as jest.Mock).mockClear();
  }

  if (global.sessionStorage && "mockClear" in global.sessionStorage.clear) {
    (global.sessionStorage.clear as jest.Mock).mockClear();
    (global.sessionStorage.getItem as jest.Mock).mockClear();
    (global.sessionStorage.setItem as jest.Mock).mockClear();
    (global.sessionStorage.removeItem as jest.Mock).mockClear();
  }

  // Clear fetch mock
  if (global.fetch && "mockClear" in global.fetch) {
    (global.fetch as jest.Mock).mockClear();
  }
});

// Global test setup
beforeEach(() => {
  // Reset all mocks to clean state
  jest.clearAllMocks();

  // Reset localStorage mock
  if (global.localStorage && "mockReturnValue" in global.localStorage.getItem) {
    (global.localStorage.getItem as jest.Mock).mockReturnValue(null);
    (global.localStorage.setItem as jest.Mock).mockImplementation(() => {});
    (global.localStorage.removeItem as jest.Mock).mockImplementation(() => {});
    (global.localStorage.clear as jest.Mock).mockImplementation(() => {});
  }

  // Reset sessionStorage mock
  if (
    global.sessionStorage &&
    "mockReturnValue" in global.sessionStorage.getItem
  ) {
    (global.sessionStorage.getItem as jest.Mock).mockReturnValue(null);
    (global.sessionStorage.setItem as jest.Mock).mockImplementation(() => {});
    (global.sessionStorage.removeItem as jest.Mock).mockImplementation(
      () => {},
    );
    (global.sessionStorage.clear as jest.Mock).mockImplementation(() => {});
  }
});
