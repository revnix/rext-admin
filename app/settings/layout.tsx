import { PageLayout } from "@/components/page-layout";
import { SettingsNav } from "@/components/settings/settings-nav";
import { ShellLayout } from "@/components/shell/shell-layout";
import { APIErrorBoundary } from "@/components/ui/error-boundary";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ShellLayout>
      <PageLayout
        title="Settings"
        description="Manage your account settings and preferences"
      >
        <div className="space-y-6">
          {/* Top Navigation */}
          <SettingsNav />

          {/* Main Content */}
          <div className="w-full">
            <APIErrorBoundary>{children}</APIErrorBoundary>
          </div>
        </div>
      </PageLayout>
    </ShellLayout>
  );
}
