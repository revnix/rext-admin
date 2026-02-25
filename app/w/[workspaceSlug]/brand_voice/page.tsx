"use client";

import { PageLayout } from "@/components/page-layout";
import { BrandVoiceSection } from "@/components/workspace-settings/brand-voice-section";

export default function BrandVoicePage() {
  return (
    <PageLayout
      title="Brand Voice"
      description="Define and manage your brand's unique voice and personality for AI-powered content creation."
      fullWidth
    >
      <div className="max-w-4xl py-6">
        <BrandVoiceSection />
      </div>
    </PageLayout>
  );
}
