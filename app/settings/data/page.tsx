import { AccountDeactivation } from "@/components/account-settings/account-deactivation";
import { PrivacySettings } from "@/components/account-settings/privacy-settings";
import { DeletedWorkspaces } from "@/components/settings/deleted-workspaces";
import { SettingsGroup } from "@/components/settings/settings-group";

/** Account settings, Data and trash: export your data, the deleted workspaces, closing the account. */
export default function DataAndTrashSettingsPage() {
  return (
    <div className="flex flex-col gap-8">
      <SettingsGroup
        title="Export your data"
        description="A copy of what your account holds, sent to your email address."
      >
        <PrivacySettings />
      </SettingsGroup>
      <DeletedWorkspaces />
      <SettingsGroup
        title="Close your account"
        description="What happens to your plan and your data is set out below, before you confirm."
      >
        <AccountDeactivation />
      </SettingsGroup>
    </div>
  );
}
