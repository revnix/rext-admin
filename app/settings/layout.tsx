import { PageLayout } from "@/components/page-layout";
import { SettingsNav } from "@/components/settings/settings-nav";
import { APIErrorBoundary } from "@/components/ui/error-boundary";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PageLayout
      title="Settings"
      description="Manage your account settings and preferences"
    >
      <div className="space-y-6">
        {/* Top Navigation */}
        <SettingsNav />

        {/* Main Content */}
        <main className="w-full">
          <APIErrorBoundary>{children}</APIErrorBoundary>
        </main>
      </div>
    </PageLayout>
  );
}
