import { SettingsPage } from "@/components/layouts";
import { ShellLayout } from "@/components/shell/shell-layout";
import { APIErrorBoundary } from "@/components/ui/error-boundary";
import { settingsRoutes } from "@/lib/routes";

const SECTIONS = [
  { label: "Account & preferences", href: settingsRoutes.root },
  { label: "Security", href: settingsRoutes.security },
  { label: "Trash", href: settingsRoutes.trash },
  { label: "Billing", href: settingsRoutes.subscription },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ShellLayout>
      <SettingsPage
        title="Settings"
        description="Manage your account settings and preferences"
        sections={SECTIONS}
      >
        <APIErrorBoundary>{children}</APIErrorBoundary>
      </SettingsPage>
    </ShellLayout>
  );
}
