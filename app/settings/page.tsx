"use client";

import { DangerZoneSection } from "@/components/settings/danger-zone-section";
import { DisplayPreferencesSection } from "@/components/settings/display-preferences-section";
import { NotificationPreferencesSection } from "@/components/settings/notification-preferences-section";
import { PrivacyDataSection } from "@/components/settings/privacy-data-section";
import { ProfileSection } from "@/components/settings/profile-section";
import { Separator } from "@/components/ui/separator";

/**
 * Account & Preferences Page
 *
 * Consolidated settings page that includes:
 * - Profile Information (name, email, bio, avatar)
 * - Display Preferences (theme, date/time format)
 * - Notification Preferences (email, in-app, digest)
 * - Privacy & Data (data export)
 * - Danger Zone (account deactivation)
 *
 * This replaces the old separate pages:
 * - /settings/general
 * - /settings/account
 * - /settings/notifications
 */
export default function AccountPreferencesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Account & Preferences
        </h2>
        <p className="text-muted-foreground mt-1">
          Manage your profile, display preferences, and notifications
        </p>
      </div>

      <ProfileSection />
      <Separator />
      <DisplayPreferencesSection />
      <Separator />
      <NotificationPreferencesSection />
      <Separator />
      <PrivacyDataSection />
      <Separator />
      <DangerZoneSection />
    </div>
  );
}
