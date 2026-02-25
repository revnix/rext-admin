import Link from "next/link";
import { LemonSqueezyBadge } from "@/components/ui/security-badge";
import type { Route } from "next";

/**
 * Footer Component with Policy Links
 *
 * Provides easy access to legal documents and policies required for compliance.
 * Used on payment-related pages (pricing, billing, subscription).
 */

export interface FooterProps {
  variant?: "default" | "minimal";
  className?: string;
}

export function Footer({ variant = "default", className = "" }: FooterProps) {
  if (variant === "minimal") {
    return (
      <footer className={`border-t mt-8 pt-6 pb-4 ${className}`}>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/legal/terms"
              className="hover:text-foreground transition-colors"
            >
              Terms of Service
            </Link>
            <span className="text-muted-foreground/50">•</span>
            <Link
              href="/legal/privacy"
              className="hover:text-foreground transition-colors"
            >
              Privacy Policy
            </Link>
            <span className="text-muted-foreground/50">•</span>
            <Link
              href="/legal/refund-policy"
              className="hover:text-foreground transition-colors"
            >
              Refund Policy
            </Link>
          </div>
          <LemonSqueezyBadge size="sm" showLogo={false} />
        </div>
      </footer>
    );
  }

  return (
    <footer className={`border-t mt-12 pt-8 pb-6 ${className}`}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {/* Legal */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm text-foreground">Legal</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <Link
                href="/legal/terms"
                className="hover:text-foreground transition-colors"
              >
                Terms of Service
              </Link>
            </li>
            <li>
              <Link
                href="/legal/subscription-terms"
                className="hover:text-foreground transition-colors"
              >
                Subscription Terms
              </Link>
            </li>
            <li>
              <Link
                href="/legal/refund-policy"
                className="hover:text-foreground transition-colors"
              >
                Refund Policy
              </Link>
            </li>
            <li>
              <Link
                href="/legal/privacy"
                className="hover:text-foreground transition-colors"
              >
                Privacy Policy
              </Link>
            </li>
          </ul>
        </div>

        {/* Support */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm text-foreground">Support</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <Link
                href={`/help` as Route}
                className="hover:text-foreground transition-colors"
              >
                Help Center
              </Link>
            </li>
            <li>
              <Link
                href={`/contact` as Route}
                className="hover:text-foreground transition-colors"
              >
                Contact Support
              </Link>
            </li>
            <li>
              <Link
                href={`/settings/subscription` as Route}
                className="hover:text-foreground transition-colors"
              >
                Manage Subscription
              </Link>
            </li>
          </ul>
        </div>

        {/* Resources */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm text-foreground">Resources</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <Link
                href={`/docs` as Route}
                className="hover:text-foreground transition-colors"
              >
                Documentation
              </Link>
            </li>
            <li>
              <Link
                href={`/api` as Route}
                className="hover:text-foreground transition-colors"
              >
                API Reference
              </Link>
            </li>
            <li>
              <Link
                href={`/changelog` as Route}
                className="hover:text-foreground transition-colors"
              >
                Changelog
              </Link>
            </li>
          </ul>
        </div>

        {/* Payment Processor */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm text-foreground">
            Payment Processing
          </h4>
          <div className="space-y-2">
            <LemonSqueezyBadge size="sm" />
            <p className="text-xs text-muted-foreground">
              Secure payments processed by LemonSqueezy
            </p>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="mt-8 pt-6 border-t text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} REXT. All rights reserved.</p>
      </div>
    </footer>
  );
}

/**
 * SubscriptionAgreement Component
 *
 * Displays "By subscribing..." text with links to policies.
 * Used near subscription buttons/CTAs.
 */

export interface SubscriptionAgreementProps {
  className?: string;
}

export function SubscriptionAgreement({
  className = "",
}: SubscriptionAgreementProps) {
  return (
    <p className={`text-xs text-muted-foreground text-center ${className}`}>
      By subscribing, you agree to our{" "}
      <Link
        href={`/legal/subscription-terms` as Route}
        className="text-primary hover:underline"
      >
        Subscription Terms
      </Link>{" "}
      and{" "}
      <Link
        href={`/legal/refund-policy` as Route}
        className="text-primary hover:underline"
      >
        Refund Policy
      </Link>
      . See our{" "}
      <Link
        href={`/legal/privacy` as Route}
        className="text-primary hover:underline"
      >
        Privacy Policy
      </Link>{" "}
      for how we handle your data.
    </p>
  );
}
