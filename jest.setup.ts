// Jest setup file for global test configuration

// Enable jest-dom matchers
import "@testing-library/jest-dom";

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
const localStorageMock: Storage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock: Storage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};
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
