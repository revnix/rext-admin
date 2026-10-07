import withBundleAnalyzer from "@next/bundle-analyzer";
import type { NextConfig } from "next";
// Validates the environment as the config loads: see env.ts.
import "./env";

// Configure bundle analyzer (enabled when ANALYZE=true)
const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  typedRoutes: true,
  // ============================================================================
  // 1. PACKAGE IMPORT OPTIMIZATION
  // ============================================================================
  // Reduces bundle size by tree-shaking large libraries
  // Works with both Webpack AND Turbopack
  // See: https://nextjs.org/docs/app/api-reference/config/next-config-js/optimizePackageImports
  experimental: {
    optimizePackageImports: [
      // Radix UI primitives, one package (NOT pre-optimized by default)
      // These are heavily used in the app and can save ~50-100KB
      "radix-ui",

      // Icon & Date Libraries (Already optimized by default, but explicit is better)
      "lucide-react", // ~60KB savings
      "date-fns", // ~50KB savings

      // Heavy Animation & Chart Libraries (NOT pre-optimized)
      "motion", // ~80KB savings
      "recharts", // ~400KB+ library, only load used charts

      // Form & UI Libraries
      "react-hook-form", // Tree-shake validators
      "react-day-picker", // Only load needed components
      "cmdk", // Command palette library
    ],
  },

  // ============================================================================
  // 2. IMAGE OPTIMIZATION
  // ============================================================================
  // Automatically optimize images to modern formats
  images: {
    formats: ["image/avif", "image/webp"], // Modern formats, better compression
    minimumCacheTTL: 60, // Cache images for 60 seconds
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "2024",
        pathname: "/media/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "2024",
        pathname: "/media/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "2024",
        pathname: "/avatars/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "9000",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "9000",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.r2.cloudflarestorage.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.r2.dev",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "minio",
        port: "9000",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "api.rext.ai",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "staging-api.rext.ai",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.google.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "github.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "microsoft.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "facebook.com",
        pathname: "/**",
      },
    ],
  },

  // ============================================================================
  // 3. PRODUCTION OPTIMIZATIONS
  // ============================================================================
  // Only apply heavy optimizations in production builds
  // Note: swcMinify is now the default in Next.js 15+ (deprecated option)
  ...(process.env.NODE_ENV === "production" && {
    compress: true, // Enable gzip compression
  }),

  // ============================================================================
  // 4. DEPLOYMENT CONFIGURATION
  // ============================================================================
  output: process.env.VERCEL ? undefined : "standalone", // Disable standalone on Vercel to fix .nft.json errors

  // Turbopack root directory to avoid workspace-root inference warnings
  turbopack: {
    root: __dirname,
  },

  // ============================================================================
  // 5. DEVELOPMENT CONFIGURATION
  // ============================================================================
  reactStrictMode: true, // Enable React strict mode for better error detection
  async redirects() {
    return [
      // Billing is three account settings sections since F5 (Plan, Usage, Invoices):
      // the old billing pages land on the section that does their job.
      {
        source: "/settings/billing",
        destination: "/settings/plan",
        permanent: false,
      },
      {
        source: "/settings/subscription",
        destination: "/settings/plan",
        permanent: false,
      },
      {
        source: "/subscription",
        destination: "/settings/plan",
        permanent: false,
      },
      {
        source: "/billing",
        destination: "/settings/invoices",
        permanent: false,
      },
      {
        source: "/usage",
        destination: "/settings/usage",
        permanent: false,
      },
      {
        // The topic-based content wizard is retired (articles start from
        // keyword research): an old bookmark opens the keyword flow.
        source: "/w/:workspaceSlug/content/create",
        destination: "/w/:workspaceSlug/generate-content",
        permanent: false,
      },
      {
        // The Topic Builder is removed (E16): its pages open the keyword library.
        source: "/w/:workspaceSlug/topics/:path*",
        destination: "/w/:workspaceSlug/keywords",
        permanent: false,
      },
      {
        // The keyword library moved out of Generate to Keywords (D15): the list and each
        // keyword's page keep their old addresses working.
        source: "/w/:workspaceSlug/generate_content/library/:path*",
        destination: "/w/:workspaceSlug/keywords/:path*",
        permanent: false,
      },
      {
        // One slug convention, kebab-case (FB2.2): Generate moved from generate_content to
        // generate-content. Bookmarks, sent emails and the dock's saved links keep working, with
        // their query (?thread=, ?library=). After the library's redirect above, which goes first.
        source: "/w/:workspaceSlug/generate_content",
        destination: "/w/:workspaceSlug/generate-content",
        permanent: true,
      },
      {
        // Deeper addresses under the old one, if any were ever shared. The exact address above
        // goes first: through this rule it would gain a trailing slash and a second redirect.
        source: "/w/:workspaceSlug/generate_content/:path*",
        destination: "/w/:workspaceSlug/generate-content/:path*",
        permanent: true,
      },
      {
        // Knowledge bases are removed (E16): their pages open the workspace's settings.
        source: "/w/:workspaceSlug/knowledge/:path*",
        destination: "/w/:workspaceSlug/settings",
        permanent: false,
      },
      {
        // Customer management was folded into User Management. Redirect rather
        // than 404 so existing bookmarks and links keep working.
        source: "/admin/customers",
        destination: "/admin/users",
        permanent: false,
      },
      {
        source: "/admin/customers/:path*",
        destination: "/admin/users",
        permanent: false,
      },
      // Legacy pages removed on 2026-10-06 (D19): an old bookmark lands on the page
      // that does the job now.
      {
        // Lifetime licences: no lifetime plan exists; the plan is in Plan.
        source: "/licenses",
        destination: "/settings/plan",
        permanent: false,
      },
      {
        // Sessions are part of Security and sessions.
        source: "/settings/sessions",
        destination: "/settings/security",
        permanent: false,
      },
      {
        // The profile is account settings' first section.
        source: "/profile",
        destination: "/settings",
        permanent: false,
      },
      {
        // The account's trash is part of Data and trash.
        source: "/settings/trash",
        destination: "/settings/data",
        permanent: false,
      },
      {
        // Brand voice and members are sections of workspace settings.
        source: "/w/:workspaceSlug/brand_voice",
        destination: "/w/:workspaceSlug/settings/brand-voice",
        permanent: false,
      },
      {
        source: "/w/:workspaceSlug/members",
        destination: "/w/:workspaceSlug/settings/members",
        permanent: false,
      },
      {
        // Deleted workspaces are restored from the account's trash (Data and trash).
        source: "/w/:workspaceSlug/settings/trash",
        destination: "/settings/data",
        permanent: false,
      },
      {
        source: "/admin/analytics/subscriptions",
        destination: "/admin/subscriptions",
        permanent: false,
      },
      {
        // Workspace invitation reporting (no navigation reached it) is retired with the
        // other analytics pages; the overview is the nearest page.
        source: "/admin/analytics/invitations",
        destination: "/admin",
        permanent: false,
      },
      {
        source: "/admin/analytics",
        destination: "/admin",
        permanent: false,
      },
      {
        source: "/admin/statistics",
        destination: "/admin",
        permanent: false,
      },
      {
        // Email templates were never wired to a working API; email reporting stays.
        source: "/admin/email-templates",
        destination: "/admin/email-analytics",
        permanent: false,
      },
    ];
  },
};

// Export config wrapped with bundle analyzer
export default bundleAnalyzer(nextConfig);
