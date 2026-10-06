import type { Metadata, Viewport } from "next";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import "./globals.css";
import { fontVariables } from "./fonts";
import { Toaster } from "@/components/ui/sonner";
import { LemonSqueezyProvider } from "@/components/subscription/lemonsqueezy-provider";
import { UserNotificationsListener } from "@/components/user-notifications-listener";
import { AuthProvider } from "@/providers/auth-provider";
import { PostHogProvider } from "@/providers/posthog-provider";
import { QueryProvider } from "@/providers/query-provider";
import { SSEProvider } from "@/providers/sse-provider";
import { MotionProvider } from "@/providers/motion-provider";
import { WorkspaceWelcomeGate } from "@/providers/workspace-welcome-provider";
import { auth } from "@/auth";

// Light only (design/app-language.md §3): native controls and scrollbars stay light on a system set to dark.
export const viewport: Viewport = {
  colorScheme: "light",
};

export const metadata: Metadata = {
  title: {
    template: "%s | Rext AI Admin",
    default: "Rext AI Admin - AI-Powered Content Management Platform",
  },
  description:
    "Comprehensive admin dashboard for managing AI-generated topics, content flows, and automation workflows. Create, organize, and optimize your content strategy with intelligent insights.",
  keywords: [
    "content management",
    "AI content generation",
    "topic management",
    "content flows",
    "automation",
    "admin dashboard",
  ],
  authors: [{ name: "Rext AI Team" }],
  creator: "Rext AI",
  publisher: "Rext AI",
  metadataBase: new URL("https://app.rext.ai"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://app.rext.ai",
    title: "Rext AI Admin - AI-Powered Content Management Platform",
    description:
      "Comprehensive admin dashboard for managing AI-generated topics, content flows, and automation workflows.",
    siteName: "Rext AI Admin",
  },
  twitter: {
    card: "summary_large_image",
    title: "Rext AI Admin - AI-Powered Content Management Platform",
    description:
      "Comprehensive admin dashboard for managing AI-generated topics, content flows, and automation workflows.",
    creator: "@RextAI",
  },
  icons: {
    icon: [
      { url: "/favicons/favicon.ico" },
      { url: "/favicons/favicon.svg", type: "image/svg+xml" },
      { url: "/favicons/favicon-96x96.png", type: "image/png", sizes: "96x96" },
    ],
    apple: [
      {
        url: "/favicons/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  manifest: "/favicons/site.webmanifest",
  robots: {
    index: false, // Admin dashboard shouldn't be indexed
    follow: false,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Seed SessionProvider without a client `/api/auth/session` GET. Auth.js
  // reissues its JWT cookie on every such GET, so an older in-flight read can
  // otherwise overwrite a just-rotated refresh credential.
  const session = await auth();

  return (
    <html lang="en" className={fontVariables} suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        {/*
          Loads lemon.js and owns the checkout overlay lifecycle, so a purchase
          completes in place instead of navigating the user to LemonSqueezy.
        */}
        <LemonSqueezyProvider />

        <AuthProvider session={session}>
          <PostHogProvider>
            <SSEProvider>
              <UserNotificationsListener />
              <QueryProvider>
                <MotionProvider>
                  <WorkspaceWelcomeGate>
                    {/* URL search params as state (nuqs): filters survive a reload */}
                    <NuqsAdapter>{children}</NuqsAdapter>
                  </WorkspaceWelcomeGate>
                </MotionProvider>
              </QueryProvider>
            </SSEProvider>
          </PostHogProvider>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
