"use client";

import { DangerZoneSection } from "@/components/settings/danger-zone-section";
import { DisplayPreferencesSection } from "@/components/settings/display-preferences-section";
import { NotificationPreferencesSection } from "@/components/settings/notification-preferences-section";
import { PrivacyDataSection } from "@/components/settings/privacy-data-section";
import { ProfileSection } from "@/components/settings/profile-section";
import { APIErrorBoundary } from "@/components/ui/error-boundary";
import { Separator } from "@/components/ui/separator";


/**
 * Account & Preferences Page
 *
 * Consolidated settings page at /settings that includes:
 * - Profile Information (name, email, bio, avatar)
 * - Display Preferences (theme, date/time format)
 * - Notification Preferences (email, in-app, digest)
 * - Privacy & Data (data export)
 * - Danger Zone (account deactivation)
 *
 * Part of Settings Consolidation (Phase 3)
 * Replaced old pages: general/, account/, notifications/
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
      <APIErrorBoundary>
        <ProfileSection />
      </APIErrorBoundary>
      <Separator />
      <APIErrorBoundary>
        <DisplayPreferencesSection />
      </APIErrorBoundary>
      <Separator />
      <APIErrorBoundary>
        <NotificationPreferencesSection />
      </APIErrorBoundary>
      <Separator />
      <APIErrorBoundary>
        <PrivacyDataSection />
      </APIErrorBoundary>
      <Separator />
      <APIErrorBoundary>
        <DangerZoneSection />
      </APIErrorBoundary>
    </div>
  );
}
