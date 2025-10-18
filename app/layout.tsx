import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/providers/auth-provider";
import { OnboardingProvider } from "@/providers/onboarding-provider";
import { QueryProvider } from "@/providers/query-provider";
import { SSEProvider } from "@/providers/sse-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import { TooltipProvider } from "@/providers/tooltip-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: "%s | Wrext Admin",
    default: "Wrext Admin - AI-Powered Content Management Platform",
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
  authors: [{ name: "Wrext Team" }],
  creator: "Wrext",
  publisher: "Wrext",
  metadataBase: new URL("https://admin.wrext.com"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://admin.wrext.com",
    title: "Wrext Admin - AI-Powered Content Management Platform",
    description:
      "Comprehensive admin dashboard for managing AI-generated topics, content flows, and automation workflows.",
    siteName: "Wrext Admin",
  },
  twitter: {
    card: "summary_large_image",
    title: "Wrext Admin - AI-Powered Content Management Platform",
    description:
      "Comprehensive admin dashboard for managing AI-generated topics, content flows, and automation workflows.",
    creator: "@wrext",
  },
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        {/* LemonSqueezy Checkout Overlay Script */}
        <Script
          src="https://app.lemonsqueezy.com/js/lemon.js"
          strategy="afterInteractive"
        />

        <ThemeProvider>
          <AuthProvider>
            <SSEProvider>
              <QueryProvider>
                <TooltipProvider>
                  <OnboardingProvider>{children}</OnboardingProvider>
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
