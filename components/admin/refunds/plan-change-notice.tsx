import { Notice } from "@/components/ui/notice";
import type { PlanChangeCharge } from "@/lib/api-client/admin-refunds";
import { dateFormat } from "@/lib/formatters/date-formatters";

function formatAmount(cents: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
  }).format((cents ?? 0) / 100);
}

/** What is still held of one plan change's payment, and the day it was paid. */
function describe(charge: PlanChangeCharge) {
  const amount = formatAmount(charge.outstanding_amount, charge.currency);
  const day = dateFormat.short(charge.paid_at);
  return day ? `${amount} on ${day}` : amount;
}

/**
 * Tells the person refunding that the customer also paid for a plan change. Lemon Squeezy charges a
 * plan change as an invoice of the subscription, which a refund of the order doesn't give back: it has
 * to be refunded in Lemon Squeezy's dashboard. Shows nothing when there is no such payment.
 *
 * `full` says the refund in hand gives back all that is left of the order, so the plan change's payment
 * goes back with it. For a part refund, or before the amount is known, the notice says the payment is
 * there and leaves how much of it to give back to the person: telling them to refund all of it would
 * give the customer more than was decided.
 */
export function PlanChangeNotice({
  charges,
  full = false,
  className,
}: {
  charges?: PlanChangeCharge[] | null;
  full?: boolean;
  className?: string;
}) {
  const held = (charges ?? []).filter(
    (charge) => charge.outstanding_amount > 0,
  );
  if (held.length === 0) return null;

  return (
    <Notice
      tone="warning"
      title="This customer also paid for a plan change"
      className={className}
    >
      {held.length === 1 ? (
        <p>{describe(held[0])}.</p>
      ) : (
        <ul className="list-disc pl-4">
          {held.map((charge) => (
            <li key={charge.invoice_id}>{describe(charge)}</li>
          ))}
        </ul>
      )}
      {full ? (
        <p>
          A refund here gives back the first payment only. Refund{" "}
          {held.length === 1 ? "that invoice" : "those invoices"} in Lemon
          Squeezy too, under the subscription's invoices.
        </p>
      ) : (
        <p>
          A refund here comes out of the first payment only. If the customer is
          to get any of the plan change's payment back as well, refund{" "}
          {held.length === 1 ? "that invoice" : "those invoices"} in Lemon
          Squeezy, under the subscription's invoices.
        </p>
      )}
    </Notice>
  );
}
