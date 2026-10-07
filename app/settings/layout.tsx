import { SettingsPage } from "@/components/layouts";
import { ShellLayout } from "@/components/shell/shell-layout";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { settingsRoutes } from "@/lib/routes";

/**
 * Account settings (plans/app/D-pages.md §2.7): one SettingsPage, a route per section. Billing is
 * Plan, Usage and Invoices (plans/app/F-billing.md F5).
 */
const SECTIONS = [
  { label: "Profile", href: settingsRoutes.root },
  { label: "Security and sessions", href: settingsRoutes.security },
  { label: "Notifications", href: settingsRoutes.notifications },
  { label: "Plan", href: settingsRoutes.plan },
  { label: "Usage", href: settingsRoutes.usage },
  { label: "Invoices", href: settingsRoutes.invoices },
  { label: "Data and trash", href: settingsRoutes.data },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ShellLayout>
      <SettingsPage
        title="Account settings"
        description="Your profile, how you sign in, what you hear about, your plan and your data."
        sections={SECTIONS}
      >
        <ErrorBoundary>{children}</ErrorBoundary>
      </SettingsPage>
    </ShellLayout>
  );
}
