import type { Metadata } from "next";
import { Outfit, Inter, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { UserNotificationsListener } from "@/components/user-notifications-listener";
import { AuthProvider } from "@/providers/auth-provider";
import { InvitedUserOnboardingGate } from "@/providers/invited-user-onboarding-provider";
import { PostHogProvider } from "@/providers/posthog-provider";
import { QueryProvider } from "@/providers/query-provider";
import { SSEProvider } from "@/providers/sse-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import { TooltipProvider } from "@/providers/tooltip-provider";
import { WorkspaceWelcomeGate } from "@/providers/workspace-welcome-provider";
import { auth } from "@/auth";

// Design Tokens - Typography
const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
  metadataBase: new URL("https://admin.wrext.com"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://admin.wrext.com",
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
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${outfit.variable} ${inter.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        {/* LemonSqueezy Checkout Overlay Script */}
        <Script
          src="https://app.lemonsqueezy.com/js/lemon.js"
          strategy="afterInteractive"
        />

        <ThemeProvider defaultTheme="system">
          <AuthProvider session={session}>
            <PostHogProvider>
              <SSEProvider>
                <UserNotificationsListener />
                <QueryProvider>
                  <TooltipProvider>
                    {/* Welcome modal shows first, then invited user onboarding */}
                    <WorkspaceWelcomeGate>
                      <InvitedUserOnboardingGate>
                        {children}
                      </InvitedUserOnboardingGate>
                    </WorkspaceWelcomeGate>
                  </TooltipProvider>
                </QueryProvider>
              </SSEProvider>
            </PostHogProvider>
          </AuthProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
