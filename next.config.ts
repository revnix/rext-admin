import withBundleAnalyzer from "@next/bundle-analyzer";
import type { NextConfig } from "next";

// Configure bundle analyzer (enabled when ANALYZE=true)
const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  // ============================================================================
  // 1. PACKAGE IMPORT OPTIMIZATION
  // ============================================================================
  // Reduces bundle size by tree-shaking large libraries
  // Works with both Webpack AND Turbopack
  // See: https://nextjs.org/docs/app/api-reference/config/next-config-js/optimizePackageImports
  experimental: {
    optimizePackageImports: [
      // Radix UI Components (NOT pre-optimized by default)
      // These are heavily used in the app and can save ~50-100KB
      "@radix-ui/react-alert-dialog",
      "@radix-ui/react-avatar",
      "@radix-ui/react-checkbox",
      "@radix-ui/react-collapsible",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-icons",
      "@radix-ui/react-label",
      "@radix-ui/react-popover",
      "@radix-ui/react-progress",
      "@radix-ui/react-radio-group",
      "@radix-ui/react-scroll-area",
      "@radix-ui/react-select",
      "@radix-ui/react-separator",
      "@radix-ui/react-slider",
      "@radix-ui/react-slot",
      "@radix-ui/react-tabs",
      "@radix-ui/react-toggle-group",
      "@radix-ui/react-tooltip",

      // Icon & Date Libraries (Already optimized by default, but explicit is better)
      "lucide-react", // ~60KB savings
      "date-fns", // ~50KB savings

      // Heavy Animation & Chart Libraries (NOT pre-optimized)
      "framer-motion", // ~80KB savings
      "recharts", // ~400KB+ library, only load used charts

      // Form & UI Libraries
      "react-hook-form", // Tree-shake validators
      "react-day-picker", // Only load needed components
      "cmdk", // Command palette library

      // Utilities
      "canvas-confetti", // Only load when needed
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
        protocol: "https",
        hostname: "*.r2.cloudflarestorage.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.r2.dev",
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
  output: "standalone", // For Docker/container deployments

  // ============================================================================
  // 5. DEVELOPMENT CONFIGURATION
  // ============================================================================
  reactStrictMode: true, // Enable React strict mode for better error detection
};

// Export config wrapped with bundle analyzer
export default bundleAnalyzer(nextConfig);
