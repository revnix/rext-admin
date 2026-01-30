import type { Metadata } from "next";
import { Outfit, Inter, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { UserNotificationsListener } from "@/components/user-notifications-listener";
import { AuthProvider } from "@/providers/auth-provider";
import { InvitedUserOnboardingProvider } from "@/providers/invited-user-onboarding-provider";
import { OnboardingProvider } from "@/providers/onboarding-provider";
import { QueryProvider } from "@/providers/query-provider";
import { SSEProvider } from "@/providers/sse-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import { TooltipProvider } from "@/providers/tooltip-provider";
import { WorkspaceWelcomeProvider } from "@/providers/workspace-welcome-provider";

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
    template: "%s | Rext Admin",
    default: "Rext Admin - AI-Powered Content Management Platform",
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
  authors: [{ name: "Rext Team" }],
  creator: "Rext",
  publisher: "Rext",
  metadataBase: new URL("https://admin.wrext.com"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://admin.wrext.com",
    title: "Rext Admin - AI-Powered Content Management Platform",
    description:
      "Comprehensive admin dashboard for managing AI-generated topics, content flows, and automation workflows.",
    siteName: "Rext Admin",
  },
  twitter: {
    card: "summary_large_image",
    title: "Rext Admin - AI-Powered Content Management Platform",
    description:
      "Comprehensive admin dashboard for managing AI-generated topics, content flows, and automation workflows.",
    creator: "@Rext",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
          <AuthProvider>
            <SSEProvider>
              <UserNotificationsListener />
              <QueryProvider>
                <TooltipProvider>
                  {/* Welcome modal shows first, then invited user onboarding, then regular onboarding */}
                  <WorkspaceWelcomeProvider>
                    <InvitedUserOnboardingProvider>
                      <OnboardingProvider>{children}</OnboardingProvider>
                    </InvitedUserOnboardingProvider>
                  </WorkspaceWelcomeProvider>
                </TooltipProvider>
              </QueryProvider>
            </SSEProvider>
          </AuthProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
