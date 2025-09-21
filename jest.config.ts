import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: "./",
});

// Add any custom config to be passed to Jest
const customJestConfig: Config = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testEnvironment: "jsdom",

  // Module name mapping for absolute imports
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    "^~/(.*)$": "<rootDir>/$1",
  },

  // Test patterns
  testMatch: [
    "**/__tests__/**/*.(test|spec).(js|jsx|ts|tsx)",
    "**/*.(test|spec).(js|jsx|ts|tsx)",
  ],

  // Ignore patterns
  testPathIgnorePatterns: ["/node_modules/", "/.next/", "/__tests__/utils/"],

  // Coverage configuration
  collectCoverageFrom: [
    "app/**/*.{js,jsx,ts,tsx}",
    "components/**/*.{js,jsx,ts,tsx}",
    "hooks/**/*.{js,jsx,ts,tsx}",
    "lib/**/*.{js,jsx,ts,tsx}",
    "services/**/*.{js,jsx,ts,tsx}",
    "stores/**/*.{js,jsx,ts,tsx}",
    "schemas/**/*.{js,jsx,ts,tsx}",
    "types/**/*.{js,jsx,ts,tsx}",
    "data/**/*.{js,jsx,ts,tsx}",
    "constants/**/*.{js,jsx,ts,tsx}",
    "!**/*.d.ts",
    "!**/node_modules/**",
    "!**/.next/**",
    "!**/index.ts",
  ],

  // Realistic coverage thresholds
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },

  // Environment setup for React 19 compatibility
  testEnvironmentOptions: {
    customExportConditions: [""],
  },

  // Clear mocks between tests
  clearMocks: true,

  // Enable detailed output for comprehensive testing
  verbose: true,

  // Show all console output for detailed debugging
  silent: false,

  // Use default reporter with verbose output
  reporters: ["default"],

  // Bail after first test suite failure (set to false for complete run)
  bail: false,

  // Show detailed diff output for failed assertions
  expand: true,

  // Error handling configuration
  errorOnDeprecated: true,

  // Detect open handles to catch async issues
  detectOpenHandles: true,

  // Force exit to ensure all tests complete
  forceExit: false,

  // Maximum number of workers for parallel execution
  maxWorkers: "50%",

  // Global test timeout (30 seconds for detailed testing)
  testTimeout: 30000,

  // Show each individual test name as it runs
  notify: false,

  // Continue running tests even if some fail
  passWithNoTests: false,

  // Module file extensions
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(customJestConfig);
