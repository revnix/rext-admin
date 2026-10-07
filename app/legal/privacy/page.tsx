import type { Metadata } from "next";
import { DetailPage } from "@/components/layouts";
import { RelatedPolicies } from "@/components/legal/related-policies";

export const metadata: Metadata = {
  title: "Privacy Policy - Payments & Billing",
  description:
    "How REXT AI handles your payment and billing data with security and privacy",
};

export default function PrivacyPolicyPage() {
  return (
    <DetailPage
      title="Privacy policy: payments and billing"
      description="We never store your full payment information. All payments are securely processed by LemonSqueezy."
      aside={<RelatedPolicies current="/legal/privacy" />}
    >
      <article className="prose prose-app max-w-prose">
        <p className="not-prose text-caption text-muted-foreground">
          Last updated 7 October 2026
        </p>

        <h2>1. Payment Information We Collect</h2>
        <h3>What We Store</h3>
        <ul>
          <li>
            <strong>Subscription Details:</strong> Plan type, billing period,
            status, renewal date
          </li>
          <li>
            <strong>Transaction Metadata:</strong> Transaction ID, amount, date,
            status
          </li>
          <li>
            <strong>Partial Card Info:</strong> Last 4 digits of card, card type
            (for display only)
          </li>
          <li>
            <strong>Billing Email:</strong> Email used for receipts and invoices
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
            <strong>Access Control:</strong> Strict role-based access to billing
            data
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
            <strong>Analytics:</strong> The plan and billing period of a
            checkout or a purchase, when usage analytics is on for you (section
            10). Never card or payment details.
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
          <li>Request account deletion (payment data deleted after 7 years)</li>
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

        <h2>9. Support Chat</h2>
        <p>
          &ldquo;Chat with us&rdquo;, in the help menu, opens a chat run by{" "}
          <strong>Crisp</strong> (Crisp IM SAS, France), whose servers are in
          the European Union.
        </p>
        <ul>
          <li>
            The chat loads only when you open it. Until then, no Crisp script,
            request or cookie touches the app.
          </li>
          <li>
            We send Crisp your email, name and account ID, so we know who
            we&rsquo;re talking to.
          </li>
          <li>
            Crisp receives your messages and any files you send, with your IP
            address, browser, device and the page you&rsquo;re on.
          </li>
          <li>
            Once you open it, Crisp keeps its own cookies (
            <code>crisp-client/*</code>) for 6 months, so your conversation
            continues.
          </li>
          <li>
            We use the chat only to help you. We never change your account or
            billing because of a chat message alone: we confirm by email first.
          </li>
          <li>
            To have your chat history deleted, email{" "}
            <a href="mailto:contact@rext.ai">contact@rext.ai</a>.
          </li>
        </ul>

        <h2>10. Usage Analytics</h2>
        <p>
          We measure how the app is used with <strong>PostHog</strong> (PostHog
          Inc.), on its cloud in the European Union, so we can see which pages
          and steps work and which don&rsquo;t.
        </p>
        <ul>
          <li>
            In the EEA, the UK and Switzerland we ask you first, once, after you
            sign in. Until you answer, nothing is sent.
          </li>
          <li>Everywhere else it is on, and you can turn it off.</li>
          <li>
            When it is on, PostHog receives the pages you open and what you do
            on them (for example a keyword analysed, a title chosen, an article
            published or a plan bought, with that keyword or title), together
            with your account ID, email, name and role. It keeps an identifier
            in your browser&rsquo;s storage.
          </li>
          <li>
            When it is off, PostHog receives only anonymous counts of the kinds
            of page opened: no account, workspace, article or keyword, and
            nothing is kept in your browser.
          </li>
          <li>
            The links in our emails carry a key in their address. That key, and
            an email address in a sign-in page&rsquo;s address, are removed
            before anything is sent.
          </li>
          <li>
            You can change your choice at any time in Settings, Data, under
            &ldquo;Usage analytics&rdquo;. It is kept in the browser you are
            using, for six months.
          </li>
        </ul>

        <h2>11. Children's Privacy</h2>
        <p>
          We do not knowingly collect payment information from anyone under 16.
          If you believe a child has provided payment details, contact us
          immediately at contact@rext.ai.
        </p>

        <h2>12. Changes to This Policy</h2>
        <p>We may update this privacy policy to reflect:</p>
        <ul>
          <li>Changes in payment processing</li>
          <li>New legal requirements</li>
          <li>Service improvements</li>
        </ul>
        <p>
          Material changes will be announced via email 14 days before taking
          effect.
        </p>

        <h2>13. Contact & Questions</h2>
        <p>For privacy or billing questions:</p>
        <ul>
          <li>
            Email: <a href="mailto:contact@rext.ai">contact@rext.ai</a>
          </li>
        </ul>
      </article>
    </DetailPage>
  );
}
