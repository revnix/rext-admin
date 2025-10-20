import { ArrowLeft } from "lucide-react";
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
  title: "Subscription Terms of Service",
  description:
    "Terms and conditions governing WREXT subscription services and billing",
};

export default function SubscriptionTermsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/pricing">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Pricing
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Subscription Terms of Service</CardTitle>
          <CardDescription>
            Effective Date: October 20, 2025 | Last Updated: October 20, 2025 |
            Version 1.0
          </CardDescription>
        </CardHeader>
        <CardContent className="prose prose-sm dark:prose-invert max-w-none">
          <p className="lead">
            These Subscription Terms of Service govern your access to and use of
            WREXT's paid subscription services.
          </p>

          <h2>1. Introduction</h2>
          <p>
            Welcome to WREXT! By subscribing to any WREXT paid plan, you agree
            to these Terms in addition to our main Terms of Service and Privacy
            Policy.
          </p>

          <h3>Who Can Subscribe</h3>
          <ul>
            <li>You must be at least 16 years old to subscribe</li>
            <li>You must have the authority to enter into binding contracts</li>
            <li>You must provide accurate billing information</li>
          </ul>

          <h2>2. Subscription Plans</h2>
          <p>
            WREXT offers multiple subscription tiers with varying features and
            usage limits. All plans include:
          </p>
          <ul>
            <li>Access to core platform features</li>
            <li>Email support</li>
            <li>Regular platform updates</li>
            <li>Data security and encryption</li>
          </ul>

          <h2>3. Free Trial</h2>
          <p>
            New subscribers may be eligible for a 14-day free trial. During the
            trial:
          </p>
          <ul>
            <li>No payment information is required upfront</li>
            <li>You have full access to your selected plan's features</li>
            <li>You can cancel anytime before the trial ends</li>
            <li>Your subscription begins automatically after the trial ends</li>
          </ul>

          <h2>4. Billing & Payments</h2>
          <h3>Payment Processing</h3>
          <p>
            All payments are securely processed by LemonSqueezy, our third-party
            payment processor. We never store your full payment information.
          </p>

          <h3>Recurring Billing</h3>
          <ul>
            <li>
              Subscriptions automatically renew at the end of each billing
              period
            </li>
            <li>You will be charged on the same day each month/year</li>
            <li>You can cancel anytime to stop future charges</li>
            <li>Cancellation takes effect at the end of the current period</li>
          </ul>

          <h3>Payment Methods</h3>
          <p>
            We accept major credit cards, debit cards, and PayPal via
            LemonSqueezy.
          </p>

          <h2>5. Subscription Modifications</h2>
          <h3>Upgrading</h3>
          <ul>
            <li>Upgrades take effect immediately</li>
            <li>
              You're charged a prorated amount for the remainder of the billing
              period
            </li>
            <li>Your next bill will be for the full amount of the new plan</li>
          </ul>

          <h3>Downgrading</h3>
          <ul>
            <li>
              Downgrades take effect at the end of the current billing period
            </li>
            <li>You retain access to current features until the period ends</li>
            <li>
              If you exceed new plan limits, you must reduce usage before
              downgrading
            </li>
          </ul>

          <h2>6. Cancellation & Termination</h2>
          <h3>Your Right to Cancel</h3>
          <p>
            You can cancel your subscription at any time from your account
            settings. Upon cancellation:
          </p>
          <ul>
            <li>
              Access continues until the end of the current billing period
            </li>
            <li>
              No refund for the current billing period (see Refund Policy)
            </li>
            <li>Automatic renewal stops</li>
            <li>Your data is retained for 30 days after cancellation</li>
          </ul>

          <h3>Our Right to Terminate</h3>
          <p>We may suspend or terminate your subscription if:</p>
          <ul>
            <li>Payment fails or cannot be processed</li>
            <li>You violate our Terms of Service</li>
            <li>You engage in prohibited uses</li>
            <li>Required by law</li>
          </ul>

          <h2>7. Refund Policy</h2>
          <p>
            Please see our{" "}
            <Link
              href="/legal/refund-policy"
              className="text-primary underline"
            >
              Refund Policy
            </Link>{" "}
            for complete details on refunds and cancellations.
          </p>

          <h2>8. Usage Limits & Fair Use</h2>
          <p>
            Each subscription plan includes specific usage limits. Exceeding
            these limits may result in:
          </p>
          <ul>
            <li>Temporary feature restrictions</li>
            <li>Requirement to upgrade to a higher plan</li>
            <li>Additional usage fees (if applicable)</li>
          </ul>

          <h2>9. Service Availability</h2>
          <p>
            While we strive for 99.9% uptime, we do not guarantee uninterrupted
            service. We are not liable for:
          </p>
          <ul>
            <li>Scheduled maintenance downtime</li>
            <li>Emergency maintenance</li>
            <li>Third-party service failures</li>
            <li>Internet or network connectivity issues</li>
          </ul>

          <h2>10. Data & Privacy</h2>
          <p>
            Your data privacy is important to us. See our{" "}
            <Link href="/legal/privacy" className="text-primary underline">
              Privacy Policy
            </Link>{" "}
            for details on how we collect, use, and protect your data.
          </p>

          <h2>11. Changes to Terms</h2>
          <p>
            We may update these Subscription Terms from time to time. We will:
          </p>
          <ul>
            <li>Notify you via email of material changes</li>
            <li>Give you 30 days notice before changes take effect</li>
            <li>Allow you to cancel if you disagree with changes</li>
          </ul>

          <h2>12. Contact Information</h2>
          <p>
            For questions about subscriptions, billing, or these terms, contact
            us at:
          </p>
          <ul>
            <li>
              Email: <a href="mailto:support@wrext.com">support@wrext.com</a>
            </li>
            <li>
              Support Portal:{" "}
              <Link href="/help" className="text-primary underline">
                wrext.com/help
              </Link>
            </li>
          </ul>

          <div className="mt-8 p-4 border rounded-lg bg-muted">
            <p className="text-sm font-semibold mb-2">Quick Links</p>
            <div className="flex flex-wrap gap-4 text-sm">
              <Link
                href="/legal/terms"
                className="text-primary hover:underline"
              >
                Main Terms of Service
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
              <Link
                href="/settings/subscription"
                className="text-primary hover:underline"
              >
                Manage Subscription
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
