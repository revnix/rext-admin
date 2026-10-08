import { render, screen } from "@testing-library/react";
import { PlanChangeNotice } from "@/components/admin/refunds/plan-change-notice";
import type { PlanChangeCharge } from "@/lib/api-client/admin-refunds";

// The warning in the admin's refund dialogs (task F22): a customer who changed plan paid a second time,
// and a refund of the order gives back the first payment only.

const charge = (over: Partial<PlanChangeCharge> = {}): PlanChangeCharge => ({
  invoice_id: "inv-1",
  amount: 9996,
  refunded_amount: 0,
  outstanding_amount: 9996,
  currency: "USD",
  paid_at: "2026-10-08T03:42:15Z",
  ...over,
});

describe("PlanChangeNotice", () => {
  it("names the payment, its day and what to do", () => {
    render(<PlanChangeNotice charges={[charge()]} />);

    const notice = screen.getByRole("alert");
    expect(notice).toHaveTextContent(
      "This customer also paid for a plan change",
    );
    expect(notice).toHaveTextContent("$99.96 on Oct 8, 2026.");
    expect(notice).toHaveTextContent(
      "A refund here gives back the first payment only. Refund that invoice in Lemon Squeezy too, under the subscription's invoices.",
    );
  });

  it("shows what is still held when part was given back", () => {
    render(
      <PlanChangeNotice
        charges={[charge({ refunded_amount: 2000, outstanding_amount: 7996 })]}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "$79.96 on Oct 8, 2026.",
    );
  });

  it("lists each payment when there are several", () => {
    render(
      <PlanChangeNotice
        charges={[
          charge(),
          charge({
            invoice_id: "inv-2",
            amount: 3300,
            outstanding_amount: 3300,
            paid_at: "2026-10-09T10:00:00Z",
          }),
        ]}
      />,
    );

    const items = screen.getAllByRole("listitem");
    expect(items.map((item) => item.textContent)).toEqual([
      "$99.96 on Oct 8, 2026",
      "$33.00 on Oct 9, 2026",
    ]);
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Refund those invoices in Lemon Squeezy too",
    );
  });

  it("says the amount alone when the day is unknown", () => {
    render(<PlanChangeNotice charges={[charge({ paid_at: null })]} />);

    expect(screen.getByRole("alert")).toHaveTextContent("$99.96.");
  });

  it.each([
    ["no list", undefined],
    ["an empty list", []],
    ["a payment already given back", [charge({ outstanding_amount: 0 })]],
  ])("shows nothing for %s", (_, charges) => {
    const { container } = render(<PlanChangeNotice charges={charges} />);

    expect(container).toBeEmptyDOMElement();
  });
});
