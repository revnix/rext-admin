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

// The site's own description (rext.ai's meta description), so the app and the site say the same.
const DESCRIPTION =
  "Rext AI is an AI article writer for SEO. You approve the outline; it writes in your brand voice with linked sources and publishes to WordPress.";

export const metadata: Metadata = {
  // The browser tab, a bookmark and a shared link: "Rext AI", and "Log in · Rext AI" on a page that
  // names itself (task 809).
  title: {
    template: "%s · Rext AI",
    default: "Rext AI",
  },
  description: DESCRIPTION,
  keywords: [
    "keyword research",
    "content generation",
    "content management",
    "content calendar",
    "WordPress publishing",
  ],
  authors: [{ name: "Rext AI Team" }],
  creator: "Rext AI",
  publisher: "Rext AI",
  metadataBase: new URL("https://app.rext.ai"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://app.rext.ai",
    title: "Rext AI",
    description: DESCRIPTION,
    siteName: "Rext AI",
  },
  twitter: {
    card: "summary_large_image",
    title: "Rext AI",
    description: DESCRIPTION,
    creator: "@RextAI",
  },
  robots: {
    index: false, // The dashboard isn't for search results; the site is.
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
