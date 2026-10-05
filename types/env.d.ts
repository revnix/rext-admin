/**
 * Environment variable type definitions for Rext AI-admin
 *
 * This file provides TypeScript type safety for environment variables
 * used throughout the application, particularly for backend API configuration.
 */

declare namespace NodeJS {
  interface ProcessEnv {
    /**
     * Backend API base URL for topic generation service
     *
     * @example "http://127.0.0.1:2024" (development)
     * @example "https://api.rext.ai" (production)
     */
    BACKEND_API_URL: string;

    /**
     * Node.js environment mode
     */
    NODE_ENV: "development" | "production" | "test";

    /**
     * Next.js build ID (automatically set by Next.js)
     */
    NEXT_BUILD_ID?: string;
  }
}
