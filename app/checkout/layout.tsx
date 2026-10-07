import { ShellLayout } from "@/components/shell/shell-layout";

/** The checkout's return pages live inside the shell (plans/app/F-billing.md F7), like pricing. */
export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ShellLayout>{children}</ShellLayout>;
}
