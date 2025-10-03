import { PageLayout } from "@/components/page-layout";
import { SettingsNav } from "@/components/settings/settings-nav";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const breadcrumbs = [{ label: "Settings" }];

  return (
    <PageLayout
      title="Settings"
      description="Manage your account settings and preferences"
      breadcrumbs={breadcrumbs}
    >
      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar Navigation */}
        <aside className="md:w-64 shrink-0">
          <SettingsNav />
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </PageLayout>
  );
}
