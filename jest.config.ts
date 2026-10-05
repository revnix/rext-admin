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

  // Today's coverage (2026-10-06), so a drop fails `pnpm test:ci`; raise these as
  // tests are added rather than lowering them.
  coverageThreshold: {
    global: {
      branches: 3.7,
      functions: 3.8,
      lines: 4.6,
      statements: 4.6,
    },
    "./components/ui/typeform/": {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0,
    },
    "./components/ui/content/": {
      branches: 44,
      functions: 50,
      lines: 48,
      statements: 46,
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

// Lexical ships ES modules only (from 0.51), so Jest has to transform it. next/jest
// leaves node_modules untransformed except its own list and lets a config only add
// to what is ignored, so Lexical is added to next/jest's two node_modules patterns
// (npm's folder layout and pnpm's).
const TRANSFORMED = {
  npm: "lexical|@lexical/[^/]+",
  pnpm: "lexical|@lexical\\+[^@]+",
};
const LEXICAL_FILES = [
  "/app/node_modules/lexical/Lexical.mjs",
  "/app/node_modules/.pnpm/lexical@0.52.0/node_modules/lexical/Lexical.mjs",
  "/app/node_modules/.pnpm/@lexical+markdown@0.52.0/node_modules/@lexical/markdown/LexicalMarkdown.mjs",
];

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default async () => {
  const config = await createJestConfig(customJestConfig)();
  const patterns = (config.transformIgnorePatterns ?? []).map((pattern) =>
    pattern
      .replace("(?!.pnpm)(?!(", `(?!.pnpm)(?!(${TRANSFORMED.npm}|`)
      .replace("\\.pnpm[\\\\/](?!(", `\\.pnpm[\\\\/](?!(${TRANSFORMED.pnpm}|`),
  );
  // If a next/jest upgrade changes its patterns, fail here rather than in every
  // test that loads the editor.
  for (const file of LEXICAL_FILES) {
    const ignoredBy = patterns.find((pattern) =>
      new RegExp(pattern).test(file),
    );
    if (ignoredBy) {
      throw new Error(
        `jest.config.ts: ${file} would not be transformed (ignored by ${ignoredBy}); update TRANSFORMED for this next/jest`,
      );
    }
  }
  return { ...config, transformIgnorePatterns: patterns };
};
