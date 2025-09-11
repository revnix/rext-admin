const nextJest = require("next/jest");

// Providing the path to your Next.js app which will enable loading next.config.js and .env files
const createJestConfig = nextJest({ dir: "./" });

// Custom Jest configuration
const customJestConfig = {
  // Setup files after environment setup
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],

  // Test environment
  testEnvironment: "jsdom",

  // Module name mapping for path aliases
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },

  // Test file patterns
  testMatch: [
    "**/__tests__/**/*.(ts|tsx|js|jsx)",
    "**/*.(test|spec).(ts|tsx|js|jsx)",
  ],

  // Exclude utility files from being treated as tests
  testPathIgnorePatterns: ["/node_modules/", "/.next/", "/__tests__/utils/"],

  // Coverage configuration
  collectCoverageFrom: [
    "lib/**/*.{ts,tsx}",
    "data/**/*.{ts,tsx}",
    "types/**/*.{ts,tsx}",
    "components/**/*.{ts,tsx}",
    "app/**/*.{ts,tsx}",
    "services/**/*.{ts,tsx}",
    "stores/**/*.{ts,tsx}",
    "schemas/**/*.{ts,tsx}",
    "constants/**/*.{ts,tsx}",
    "!**/*.d.ts",
    "!**/node_modules/**",
    "!**/.next/**",
    "!**/index.ts", // Exclude index files
  ],

  // Coverage thresholds - focused on tested files only
  coverageThreshold: {
    "lib/topic-builder-utils.ts": {
      branches: 58,
      functions: 66,
      lines: 70,
      statements: 70,
    },
    "data/topic-builder-options.ts": {
      branches: 60,
      functions: 30,
      lines: 60,
      statements: 60,
    },
  },

  // Transform configuration
  preset: "ts-jest",

  // Module file extensions
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],

  // Transform files
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest",
  },

  // Clear mocks between tests
  clearMocks: true,

  // Verbose output
  verbose: true,
};

// Export Jest configuration created by Next.js
module.exports = createJestConfig(customJestConfig);
