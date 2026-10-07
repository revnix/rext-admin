import { ShellLayout } from "@/components/shell/shell-layout";

/** Pricing lives inside the shell (plans/app/F-billing.md §2 item 2); signed out, proxy.ts sends the site's. */
export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ShellLayout>{children}</ShellLayout>;
}
