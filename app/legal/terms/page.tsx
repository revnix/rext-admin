import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "General terms of service for using REXT platform",
};

export default function TermsOfServicePage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Terms of Service</CardTitle>
          <CardDescription>Last Updated: October 20, 2025</CardDescription>
        </CardHeader>
        <CardContent className="prose prose-sm dark:prose-invert max-w-none">
          <p className="lead">
            Welcome to REXT. These Terms of Service govern your use of our
            platform and services.
          </p>

          <div className="grid gap-4 my-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Looking for subscription-specific terms?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button
                    asChild
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <Link href="/legal/subscription-terms">
                      Subscription Terms of Service
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <Link href="/legal/refund-policy">Refund Policy</Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <Link href="/legal/privacy">
                      Privacy Policy (Payments & Billing)
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing or using REXT, you agree to be bound by these Terms of
            Service and all applicable laws and regulations.
          </p>

          <h2>2. Use License</h2>
          <p>
            Permission is granted to access and use REXT for personal or
            business purposes, subject to the restrictions in these Terms.
          </p>

          <h2>3. User Accounts</h2>
          <ul>
            <li>You must be at least 16 years old to create an account</li>
            <li>You are responsible for maintaining account security</li>
            <li>
              You must provide accurate and complete registration information
            </li>
            <li>You are responsible for all activities under your account</li>
          </ul>

          <h2>4. Acceptable Use</h2>
          <p>You agree NOT to:</p>
          <ul>
            <li>Violate any laws or regulations</li>
            <li>Infringe on intellectual property rights</li>
            <li>Transmit malicious code or viruses</li>
            <li>Attempt unauthorized access to our systems</li>
            <li>Use the service for spam or harassment</li>
            <li>Impersonate others or provide false information</li>
          </ul>

          <h2>5. Intellectual Property</h2>
          <p>
            All content, features, and functionality of REXT are owned by us and
            are protected by copyright, trademark, and other intellectual
            property laws.
          </p>

          <h2>6. User Content</h2>
          <ul>
            <li>You retain ownership of content you create</li>
            <li>
              You grant us a license to use, display, and distribute your
              content
            </li>
            <li>You are responsible for your content and its legality</li>
            <li>We may remove content that violates these Terms</li>
          </ul>

          <h2>7. Subscription Services</h2>
          <p>
            For detailed information about paid subscriptions, billing, and
            refunds, please see our{" "}
            <Link
              href="/legal/subscription-terms"
              className="text-primary underline"
            >
              Subscription Terms of Service
            </Link>
            .
          </p>

          <h2>8. Termination</h2>
          <p>
            We reserve the right to suspend or terminate your account for
            violations of these Terms, with or without notice.
          </p>

          <h2>9. Limitation of Liability</h2>
          <p>
            REXT is provided "as is" without warranties of any kind. We are not
            liable for any indirect, incidental, or consequential damages.
          </p>

          <h2>10. Changes to Terms</h2>
          <p>
            We may update these Terms from time to time. Continued use of REXT
            after changes constitutes acceptance of the new Terms.
          </p>

          <h2>11. Contact</h2>
          <p>
            Questions about these Terms? Contact us at{" "}
            <a href="mailto:legal@wrext.com">legal@wrext.com</a>.
          </p>

          <div className="mt-8 p-4 border rounded-lg bg-muted">
            <p className="text-sm font-semibold mb-2">Related Policies</p>
            <div className="flex flex-wrap gap-4 text-sm">
              <Link
                href="/legal/subscription-terms"
                className="text-primary hover:underline"
              >
                Subscription Terms
              </Link>
              <Link
                href="/legal/refund-policy"
                className="text-primary hover:underline"
              >
                Refund Policy
              </Link>
              <Link
                href="/legal/privacy"
                className="text-primary hover:underline"
              >
                Privacy Policy
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
