import type { Metadata, Route } from "next";
import Link from "next/link";
import { DetailPage } from "@/components/layouts";
import { settingsRoutes } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Refunds and cancellation",
  description:
    "A full refund within 14 days of a payment if fewer than 100 credits were used, cancellation any time in the app, and what happens to your plan when you cancel.",
};

// The text is rext.ai's refund policy, word for word (rext-site-v3,
// src/content/legal/refunds.ts, 2026-10-05): the founder's rule on
// rext-control #88, recorded in DECISIONS.md, applied here by #163.
export default function RefundPolicyPage() {
  return (
    <DetailPage
      title="Refunds and cancellation"
      description="A full refund within 14 days of a payment if fewer than 100 credits were used, cancellation any time in the app, and what happens to your plan when you cancel."
      aside={
        <nav aria-labelledby="refund-actions" className="space-y-2">
          <h2 id="refund-actions" className="text-section text-foreground">
            Quick actions
          </h2>
          <ul className="space-y-1 text-body">
            <li>
              <Link href={settingsRoutes.plan as Route} className="link">
                Cancel your plan
              </Link>
            </li>
            <li>
              <Link href="/legal/subscription-terms" className="link">
                Subscription terms
              </Link>
            </li>
            <li>
              <a href="mailto:contact@rext.ai" className="link">
                Contact support
              </a>
            </li>
          </ul>
        </nav>
      }
    >
      <article className="prose prose-app max-w-prose">
        <p className="not-prose text-caption text-muted-foreground">
          Last updated 5 October 2026
        </p>

        <h2>The 14-day refund</h2>
        <p>
          If you ask within 14 days of a payment, and your account has used
          fewer than 100 credits since that payment, we refund that payment in
          full. 100 credits is about six articles.
        </p>
        <p>
          After 14 days, or once 100 credits have been used, the payment is not
          refunded, except where the law requires it.
        </p>

        <h2>No refunds for unused time</h2>
        <p>
          Cancelling does not refund the rest of a period you have paid for, and
          there are no partial refunds for a downgrade. Unused credits do not
          carry over: each month, your plan&apos;s credits are reset to its full
          amount.
        </p>

        <h2>How to ask for a refund</h2>
        <p>
          Write to <a href="mailto:contact@rext.ai">contact@rext.ai</a> from the
          email address on your account, with the order number from your
          receipt. The refund goes back to the way you paid, through our payment
          partner, and can take up to 10 days to appear on your statement.
        </p>

        <h2>Cancelling your plan</h2>
        <p>
          You can cancel any time in the app, under Subscription Management,
          with “Cancel Subscription”. You keep your plan, and its credits, until
          the end of the period you have paid for, and you are not charged
          again.
        </p>
        <p>
          To be sure the next payment is not taken, cancel at least 48 hours
          before your plan renews, as our payment partner&apos;s terms ask.
        </p>

        <h2>Customers in the EU and the UK</h2>
        <p>
          If you are a consumer in the EU or the UK, you also have the legal
          right to withdraw from a purchase within 14 days. The refund rule
          above does not limit that right.
        </p>

        <h2>The charge on your statement</h2>
        <p>
          Purchases are made through our payment partner, the merchant of record
          named at checkout (currently Lemon Squeezy), so the charge on your
          statement carries its name, starting with “LEMSQZY*”. Lemon Squeezy
          explains such charges on{" "}
          <a
            href="https://www.lemonsqueezy.com/why-did-lemon-squeeezy-charge-me"
            target="_blank"
            rel="noopener noreferrer"
          >
            its own page
          </a>
          . If you do not recognize a charge, write to us before you dispute it
          with your bank: we can usually sort it out faster.
        </p>

        <h2>If you dispute a charge</h2>
        <p>
          If a payment is disputed with a bank, we may pause the account until
          the dispute is settled.
        </p>
      </article>
    </DetailPage>
  );
}
