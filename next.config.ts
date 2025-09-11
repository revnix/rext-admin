import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  // Bundle splitting and optimization
  webpack: (config, { dev, isServer }) => {
    // Enable webpack bundle analyzer in development
    if (dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          cacheGroups: {
            ...config.optimization.splitChunks?.cacheGroups,
            // Extract common vendor libraries
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: "vendors",
              chunks: "all",
              priority: 10,
            },
            // Extract topic builder related components
            topicBuilder: {
              test: /[\\/]components[\\/]topic-builder[\\/]/,
              name: "topic-builder",
              chunks: "all",
              priority: 20,
            },
            // Extract UI components
            ui: {
              test: /[\\/]components[\\/]ui[\\/]/,
              name: "ui-components",
              chunks: "all",
              priority: 15,
            },
            // Extract common components
            common: {
              name: "common",
              minChunks: 2,
              chunks: "all",
              priority: 5,
              enforce: true,
            },
          },
        },
      };
    }

    return config;
  },

  // Enable experimental features for better bundle splitting
  experimental: {
    optimizePackageImports: [
      "@radix-ui/react-icons",
      "lucide-react",
      "framer-motion",
    ],
  },
};

export default nextConfig;
