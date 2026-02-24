import { ArrowLeft, Shield } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { accountSettingsRoutes } from "@/lib/routes";
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
  title: "Privacy Policy - Payments & Billing",
  description:
    "How REXT handles your payment and billing data with security and privacy",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={accountSettingsRoutes.root}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Settings
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Privacy Policy - Payments & Billing</CardTitle>
          <CardDescription>
            Effective Date: October 20, 2025 | Last Updated: October 20, 2025
          </CardDescription>
        </CardHeader>
        <CardContent className="prose prose-sm dark:prose-invert max-w-none">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <strong>Your Privacy Matters:</strong> We never store your full
              payment information. All payments are securely processed by
              LemonSqueezy.
            </AlertDescription>
          </Alert>

          <h2>1. Payment Information We Collect</h2>
          <h3>What We Store</h3>
          <ul>
            <li>
              <strong>Subscription Details:</strong> Plan type, billing period,
              status, renewal date
            </li>
            <li>
              <strong>Transaction Metadata:</strong> Transaction ID, amount,
              date, status
            </li>
            <li>
              <strong>Partial Card Info:</strong> Last 4 digits of card, card
              type (for display only)
            </li>
            <li>
              <strong>Billing Email:</strong> Email used for receipts and
              invoices
            </li>
          </ul>

          <h3>What We DON'T Store</h3>
          <ul>
            <li>Full credit card numbers</li>
            <li>CVV/CVC codes</li>
            <li>Card expiration dates (full)</li>
            <li>Bank account details</li>
            <li>PayPal credentials</li>
          </ul>

          <h2>2. How Payment Data is Protected</h2>
          <h3>Third-Party Payment Processing</h3>
          <p>
            All payment information is collected and processed by{" "}
            <strong>LemonSqueezy</strong>, a PCI DSS Level 1 certified payment
            processor. When you enter payment details:
          </p>
          <ul>
            <li>
              Your payment information goes directly to LemonSqueezy (not our
              servers)
            </li>
            <li>Data is encrypted in transit using TLS 1.2+</li>
            <li>LemonSqueezy stores your payment methods securely</li>
            <li>We receive only a secure token to process future charges</li>
          </ul>

          <h3>Our Security Measures</h3>
          <ul>
            <li>
              <strong>Encryption:</strong> All data encrypted at rest and in
              transit
            </li>
            <li>
              <strong>Access Control:</strong> Strict role-based access to
              billing data
            </li>
            <li>
              <strong>Audit Logging:</strong> All payment actions are logged
            </li>
            <li>
              <strong>Regular Audits:</strong> Security audits and penetration
              testing
            </li>
          </ul>

          <h2>3. How We Use Your Billing Data</h2>
          <p>We use your billing information to:</p>
          <ul>
            <li>Process subscription payments</li>
            <li>Send receipts and invoices</li>
            <li>Manage subscription upgrades/downgrades</li>
            <li>Handle refunds and disputes</li>
            <li>Prevent fraud and abuse</li>
            <li>Comply with tax and accounting requirements</li>
            <li>Analyze subscription trends (aggregated data only)</li>
          </ul>

          <h3>What We DON'T Do</h3>
          <ul>
            <li>Sell your payment information to third parties</li>
            <li>Use payment data for marketing without consent</li>
            <li>Share card details with anyone (we don't have them)</li>
          </ul>

          <h2>4. Data Sharing & Third Parties</h2>
          <h3>Payment Processor: LemonSqueezy</h3>
          <p>
            LemonSqueezy processes all payments and stores your payment methods.
            They:
          </p>
          <ul>
            <li>Are PCI DSS Level 1 compliant</li>
            <li>Have their own privacy policy (see LemonSqueezy.com)</li>
            <li>Use your data only for payment processing</li>
            <li>Provide secure customer portal for managing payments</li>
          </ul>

          <h3>Other Service Providers</h3>
          <p>
            We may share limited billing data (transaction amounts, dates) with:
          </p>
          <ul>
            <li>
              <strong>Email Service:</strong> To send receipts and billing
              notifications
            </li>
            <li>
              <strong>Analytics:</strong> Aggregated data only (no personal
              information)
            </li>
            <li>
              <strong>Tax Services:</strong> For tax compliance (as required by
              law)
            </li>
          </ul>

          <h2>5. Your Rights & Controls</h2>
          <h3>Access Your Data</h3>
          <ul>
            <li>View subscription details in your account settings</li>
            <li>Access invoices and payment history</li>
            <li>Request a complete data export (includes billing data)</li>
          </ul>

          <h3>Update Payment Method</h3>
          <ul>
            <li>Update card/payment info through the customer portal</li>
            <li>Changes take effect immediately</li>
            <li>Old payment methods are securely removed by LemonSqueezy</li>
          </ul>

          <h3>Delete Your Data</h3>
          <ul>
            <li>Cancel subscription to stop future charges</li>
            <li>
              Request account deletion (payment data deleted after 7 years)
            </li>
            <li>
              Note: We must retain some billing data for tax/legal compliance
            </li>
          </ul>

          <h2>6. Data Retention</h2>
          <h3>Active Subscriptions</h3>
          <ul>
            <li>Billing data retained for the life of your subscription</li>
            <li>Transaction history maintained for your records</li>
          </ul>

          <h3>After Cancellation</h3>
          <ul>
            <li>
              <strong>Subscription Data:</strong> 30 days (for reactivation)
            </li>
            <li>
              <strong>Transaction Records:</strong> 7 years (tax compliance)
            </li>
            <li>
              <strong>Payment Methods:</strong> Immediately removed from
              LemonSqueezy
            </li>
          </ul>

          <h2>7. Compliance</h2>
          <h3>PCI DSS Compliance</h3>
          <p>
            While we don't directly handle payment cards, we follow PCI DSS
            guidelines:
          </p>
          <ul>
            <li>Use certified payment processor (LemonSqueezy)</li>
            <li>Never store sensitive card data</li>
            <li>Secure transmission of all payment data</li>
            <li>Regular security assessments</li>
          </ul>

          <h3>GDPR Compliance (EU Users)</h3>
          <ul>
            <li>Right to access your payment data</li>
            <li>Right to data portability (export)</li>
            <li>Right to deletion (with legal exceptions)</li>
            <li>Right to object to processing</li>
          </ul>

          <h3>CCPA Compliance (California Users)</h3>
          <ul>
            <li>Right to know what data we collect</li>
            <li>Right to delete personal information</li>
            <li>Right to opt-out of data sales (we don't sell data)</li>
          </ul>

          <h2>8. Payment Disputes & Fraud</h2>
          <h3>Fraud Prevention</h3>
          <p>To protect against fraud, we:</p>
          <ul>
            <li>Monitor for suspicious payment activity</li>
            <li>Verify high-value transactions</li>
            <li>May temporarily hold new accounts</li>
            <li>Share fraud data with LemonSqueezy</li>
          </ul>

          <h3>Dispute Resolution</h3>
          <p>For billing disputes:</p>
          <ul>
            <li>Contact support first (faster resolution)</li>
            <li>Provide transaction ID and details</li>
            <li>We'll investigate within 3 business days</li>
            <li>
              Chargebacks should be last resort (may affect account standing)
            </li>
          </ul>

          <h2>9. Children's Privacy</h2>
          <p>
            We do not knowingly collect payment information from anyone under
            16. If you believe a child has provided payment details, contact us
            immediately at support@wrext.com.
          </p>

          <h2>10. Changes to This Policy</h2>
          <p>We may update this privacy policy to reflect:</p>
          <ul>
            <li>Changes in payment processing</li>
            <li>New legal requirements</li>
            <li>Service improvements</li>
          </ul>
          <p>
            Material changes will be announced via email 30 days before taking
            effect.
          </p>

          <h2>11. Contact & Questions</h2>
          <p>For privacy or billing questions:</p>
          <ul>
            <li>
              Email: <a href="mailto:privacy@wrext.com">privacy@wrext.com</a>
            </li>
            <li>
              Support: <a href="mailto:support@wrext.com">support@wrext.com</a>
            </li>
            <li>
              Data Protection Officer:{" "}
              <a href="mailto:dpo@wrext.com">dpo@wrext.com</a>
            </li>
          </ul>

          <div className="mt-8 p-4 border rounded-lg bg-muted">
            <p className="text-sm font-semibold mb-2">
              Your Data, Your Control
            </p>
            <div className="flex flex-wrap gap-4 text-sm">
              <Link href={accountSettingsRoutes.root} className="text-primary hover:underline">
                Export My Data
              </Link>
              <Link
                href={accountSettingsRoutes.subscription}
                className="text-primary hover:underline"
              >
                Manage Subscription
              </Link>
              <Link
                href="/legal/subscription-terms"
                className="text-primary hover:underline"
              >
                Subscription Terms
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
