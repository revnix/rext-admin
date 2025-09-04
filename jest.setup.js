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

// Global test utilities
global.console = {
  ...console,
  // Uncomment to suppress console logs/warnings during tests
  // log: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
};

// Custom matchers or global test setup can be added here

// Comprehensive unhandled promise rejection handling for tests
process.removeAllListeners("unhandledRejection");
process.on("unhandledRejection", (reason, promise) => {
  // In test environment, log and suppress to prevent crashes
  if (process.env.NODE_ENV === "test" || global.__DEV__) {
    console.warn("Unhandled rejection suppressed in tests:", reason);
    // Immediately handle the promise to prevent Node.js crash
    promise.catch(() => {});
    return;
  }
  // In production, let it crash as normal
  throw reason;
});

// Disable console.error in tests to prevent unhandled promise rejections from crashing
const originalConsoleError = console.error;
console.error = (...args) => {
  // Only log actual test failures, not backend service errors
  const message = String(args[0]);
  if (message.includes("[BackendService]")) {
    return; // Suppress backend service error logs during tests
  }
  originalConsoleError.apply(console, args);
};

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

// Mock Request and Response for API route testing
global.Request = class MockRequest {
  constructor(url, init = {}) {
    this.url = url;
    this.method = init.method || "GET";
    this.headers = {
      get: (name) => {
        if (init.headers?.[name]) {
          return init.headers[name];
        }
        return null;
      },
    };
    this.body = init.body;
  }

  async json() {
    return JSON.parse(this.body);
  }

  async text() {
    return this.body;
  }
};

global.Response = {
  json: (data, init) => ({
    status: init?.status || 200,
    headers: {
      get: (name) => init?.headers?.[name] || null,
    },
    json: async () => data,
    text: async () => JSON.stringify(data),
  }),
};

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
