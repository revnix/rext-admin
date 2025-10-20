"use client";

import { AccountDeactivation } from "@/components/account-settings/account-deactivation";
import { OAuthAccounts } from "@/components/account-settings/oauth-accounts";
import { PasswordChange } from "@/components/account-settings/password-change";
import { PrivacySettings } from "@/components/account-settings/privacy-settings";
import { ProfileEdit } from "@/components/account-settings/profile-edit";
import { SecuritySettings } from "@/components/account-settings/security-settings";
import { UIPreferences } from "@/components/account-settings/ui-preferences";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AccountSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Account Settings</h2>
        <p className="text-muted-foreground mt-1">
          Manage your profile, security, privacy, and account data
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="privacy">Preferences</TabsTrigger>
          <TabsTrigger value="danger">Danger Zone</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your personal information and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileEdit />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Security Information</CardTitle>
                <CardDescription>
                  View your account security details and recent activity
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SecuritySettings />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Password</CardTitle>
                <CardDescription>
                  Change your password to keep your account secure
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PasswordChange />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>OAuth Accounts</CardTitle>
                <CardDescription>
                  Manage connected third-party accounts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <OAuthAccounts />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="privacy">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Privacy & Data</CardTitle>
                <CardDescription>
                  Export your data and manage privacy settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PrivacySettings />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Appearance & Accessibility</CardTitle>
                <CardDescription>
                  Customize theme, accessibility, and interface preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UIPreferences />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="danger">
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>Irreversible account actions</CardDescription>
            </CardHeader>
            <CardContent>
              <AccountDeactivation />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
