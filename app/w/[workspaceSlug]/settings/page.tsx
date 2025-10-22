"use client";

import { Separator } from "@/components/ui/separator";
import { BrandVoiceSection } from "@/components/workspace-settings/brand-voice-section";
import { DangerZoneSection } from "@/components/workspace-settings/danger-zone-section";
import { GeneralInfoSection } from "@/components/workspace-settings/general-info-section";
import { TeamAccessSection } from "@/components/workspace-settings/team-access-section";
import { WorkspacePreferencesSection } from "@/components/workspace-settings/workspace-preferences-section";

/**
 * Workspace Settings Root Page
 *
 * Consolidated workspace settings page that combines:
 * - General information (name, slug, description, URL)
 * - Brand voice profile configuration
 * - Team & access management
 * - Workspace preferences
 * - Danger zone (delete workspace)
 *
 * Replaces old separate pages:
 * - /w/[slug]/settings/general
 * - /w/[slug]/settings/team (consolidated into Team & Access section)
 */
export default function WorkspaceSettingsPage() {
  return (
    <div className="space-y-6">
      <GeneralInfoSection />

      <Separator />

      <BrandVoiceSection />

      <Separator />

      <TeamAccessSection />

      <Separator />

      <WorkspacePreferencesSection />

      <Separator />

      <DangerZoneSection />
    </div>
  );
}
