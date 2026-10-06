import { OAuthAccounts } from "@/components/account-settings/oauth-accounts";
import { ChangePasswordForm } from "@/components/profile/change-password-form";
import { ActivityLogTable } from "@/components/security/activity-log-table";
import { LoginHistoryTable } from "@/components/security/login-history-table";
import { ActiveSessions } from "@/components/settings/active-sessions";
import { SettingsGroup } from "@/components/settings/settings-group";

/**
 * Account settings, Security and sessions: the password, the Google or GitHub accounts linked for
 * signing in, the devices signed in, and the sign-ins and account activity.
 */
export default function SecuritySettingsPage() {
  return (
    <div className="flex flex-col gap-8">
      <SettingsGroup
        title="Password"
        description="Change the password you sign in with. An account opened with Google or GitHub sets its first one through the reset link on the login page."
      >
        <ChangePasswordForm />
      </SettingsGroup>
      <SettingsGroup
        title="Connected accounts"
        description="Google or GitHub accounts you can sign in with."
      >
        <OAuthAccounts />
      </SettingsGroup>
      <ActiveSessions />
      <SettingsGroup
        title="Sign-in history"
        description="Every attempt to sign in to your account, and where it came from. A failed one you don't recognise is a reason to change your password."
      >
        <LoginHistoryTable />
      </SettingsGroup>
      <SettingsGroup
        title="Activity"
        description="What changed in your account, newest first."
      >
        <ActivityLogTable />
      </SettingsGroup>
    </div>
  );
}
