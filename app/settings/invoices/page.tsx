import { InvoicesTable } from "@/components/billing/invoices-table";
import { SettingsGroup } from "@/components/settings/settings-group";

/** Account settings, Invoices: every payment with its receipt and the refund request. */
export default function InvoicesSettingsPage() {
  return (
    <SettingsGroup
      title="Invoices"
      description="Lemon Squeezy, our payment provider, takes the payments and sends a receipt for each."
    >
      <InvoicesTable />
    </SettingsGroup>
  );
}
