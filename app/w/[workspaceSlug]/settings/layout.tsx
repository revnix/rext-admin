import { SettingsPage } from "@/components/layouts";

/**
 * Workspace settings. One section for now: Brand voice and Members become sections here with task D5,
 * and the list of sections appears once there is more than one.
 */
export default function WorkspaceSettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SettingsPage
      title="Workspace settings"
      description="Manage workspace configuration and preferences"
      sections={[]}
    >
      <div className="lg:max-w-3xl">{children}</div>
    </SettingsPage>
  );
}
