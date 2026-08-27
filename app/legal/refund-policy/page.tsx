import { ArrowLeft } from "lucide-react";
import type { Metadata, Route } from "next";
import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Refund Policy",
  description:
    "REXT AI refund and cancellation policy for subscription services",
};

export default function RefundPolicyPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/settings/subscription">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Subscription
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Refund & Cancellation Policy</CardTitle>
          <CardDescription>
            Effective Date: October 20, 2025 | Last Updated: October 20, 2025 |
            Version 1.0
          </CardDescription>
        </CardHeader>
        <CardContent className="prose prose-sm dark:prose-invert max-w-none">
          <Alert>
            <AlertDescription>
              <strong>Summary:</strong> We offer a 14-day money-back guarantee
              for new subscriptions. Cancel anytime to stop future charges.
            </AlertDescription>
          </Alert>

          <h2>1. Money-Back Guarantee</h2>
          <p>
            We want you to be completely satisfied with REXT AI. That's why we
            offer:
          </p>

          <h3>14-Day Money-Back Guarantee</h3>
          <ul>
            <li>
              <strong>Eligibility:</strong> New subscribers only (first-time
              purchase of any plan)
            </li>
            <li>
              <strong>Period:</strong> 14 days from your initial payment date
            </li>
            <li>
              <strong>Process:</strong> Contact support to request a refund
            </li>
            <li>
              <strong>Refund:</strong> Full refund to original payment method
            </li>
            <li>
              <strong>Processing Time:</strong> 5-10 business days
            </li>
          </ul>

          <h3>What's Not Covered</h3>
          <p>The money-back guarantee does NOT apply to:</p>
          <ul>
            <li>Subscription renewals (only the first payment)</li>
            <li>Plan upgrades after the initial 14-day period</li>
            <li>Add-on purchases or one-time fees</li>
            <li>Accounts suspended for Terms of Service violations</li>
          </ul>

          <h2>2. Cancellation Policy</h2>
          <h3>How to Cancel</h3>
          <p>You can cancel your subscription at any time through:</p>
          <ul>
            <li>
              Your account settings: Settings → Subscription → Cancel
              Subscription
            </li>
            <li>Contacting our support team</li>
            <li>The LemonSqueezy customer portal</li>
          </ul>

          <h3>What Happens When You Cancel</h3>
          <ul>
            <li>
              <strong>Immediate Effect:</strong> Automatic renewal is disabled
            </li>
            <li>
              <strong>Access:</strong> You retain access until the end of your
              current billing period
            </li>
            <li>
              <strong>No Refund:</strong> No refund for the current billing
              period (unless within 14-day guarantee)
            </li>
            <li>
              <strong>Data:</strong> Your data is retained for 30 days after
              cancellation
            </li>
          </ul>

          <h3>Reactivation</h3>
          <p>
            If you cancel and later want to resume, you can reactivate your
            subscription:
          </p>
          <ul>
            <li>Within 30 days: Reactivate with your existing data intact</li>
            <li>
              After 30 days: Start a new subscription (data may be deleted)
            </li>
          </ul>

          <h2>3. Refund Eligibility</h2>
          <h3>Eligible for Refund</h3>
          <ul>
            <li>First-time subscription within 14 days</li>
            <li>Technical issues preventing service use (at our discretion)</li>
            <li>Duplicate or erroneous charges</li>
            <li>Service downtime exceeding our SLA (if applicable)</li>
          </ul>

          <h3>NOT Eligible for Refund</h3>
          <ul>
            <li>Subscription renewals (after initial 14-day period)</li>
            <li>Partial month/year refunds (unless service failure)</li>
            <li>Change of mind after 14-day guarantee period</li>
            <li>
              Failure to use the service (non-usage is not grounds for refund)
            </li>
            <li>Terms of Service violations</li>
          </ul>

          <h2>4. Plan Changes & Refunds</h2>
          <h3>Upgrading</h3>
          <ul>
            <li>You pay the prorated difference immediately</li>
            <li>No refund for unused time on the previous plan</li>
            <li>New features available immediately</li>
          </ul>

          <h3>Downgrading</h3>
          <ul>
            <li>Takes effect at the end of the current billing period</li>
            <li>No refund for the difference in price</li>
            <li>You keep current features until the period ends</li>
          </ul>

          <h2>5. Payment Failures</h2>
          <p>If a payment fails:</p>
          <ul>
            <li>We'll retry the charge 3 times over 7 days</li>
            <li>You'll receive email notifications</li>
            <li>Your account may be suspended after 7 days</li>
            <li>No refund for failed payment periods</li>
          </ul>

          <h2>6. Refund Process</h2>
          <h3>How to Request a Refund</h3>
          <ol>
            <li>
              Contact us at{" "}
              <a href="mailto:support@wrext.com">support@wrext.com</a> within 14
              days
            </li>
            <li>Include your account email and reason for refund</li>
            <li>We'll review and respond within 2 business days</li>
            <li>If approved, refund processed within 5-10 business days</li>
          </ol>

          <h3>Refund Method</h3>
          <p>
            All refunds are issued to the original payment method. We cannot
            issue refunds to different cards or accounts.
          </p>

          <h2>7. Pro-Rated Refunds</h2>
          <p>
            We generally do NOT offer pro-rated refunds for partial billing
            periods, except in cases of:
          </p>
          <ul>
            <li>Extended service outages (at our discretion)</li>
            <li>Billing errors on our part</li>
            <li>Legal requirements</li>
          </ul>

          <h2>8. Dispute Resolution</h2>
          <p>If you're not satisfied with our refund decision:</p>
          <ul>
            <li>Reply to our support team with additional context</li>
            <li>Request escalation to a manager</li>
            <li>We'll review all disputes within 5 business days</li>
          </ul>

          <h2>9. Chargebacks</h2>
          <p>
            <strong>Please contact us before initiating a chargeback.</strong>{" "}
            Chargebacks:
          </p>
          <ul>
            <li>May result in account suspension</li>
            <li>Incur administrative fees</li>
            <li>Take longer to resolve than direct refunds</li>
          </ul>
          <p>
            We're committed to fair refunds and will work with you to resolve
            any billing issues.
          </p>

          <h2>10. Questions?</h2>
          <p>For questions about refunds or cancellations, contact:</p>
          <ul>
            <li>
              Email: <a href="mailto:support@wrext.com">support@wrext.com</a>
            </li>
            <li>
              Support Portal:{" "}
              <Link href={`/help` as Route} className="text-primary underline">
                wrext.com/help
              </Link>
            </li>
            <li>Response Time: Within 24 hours on business days</li>
          </ul>

          <div className="mt-8 p-4 border rounded-lg bg-muted">
            <p className="text-sm font-semibold mb-2">Quick Actions</p>
            <div className="flex flex-wrap gap-4 text-sm">
              <Link
                href="/settings/subscription"
                className="text-primary hover:underline"
              >
                Cancel Subscription
              </Link>
              <Link
                href="/legal/subscription-terms"
                className="text-primary hover:underline"
              >
                Subscription Terms
              </Link>
              <Link
                href={`/contact` as Route}
                className="text-primary hover:underline"
              >
                Contact Support
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
