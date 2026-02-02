"use client";

import { PageLayout } from "@/components/page-layout";
import { BrandVoiceSection } from "@/components/workspace-settings/brand-voice-section";
import { workspaceRoutes } from "@/lib/routes";
import { useWorkspace } from "@/providers/workspace-provider";

export default function BrandVoicePage() {
    const { workspace, workspaceSlug } = useWorkspace();

    const breadcrumbs = [
        { label: "Dashboard", href: "/" },
        {
            label: workspace?.title || "...",
            href: workspaceRoutes.root(workspaceSlug),
        },
        { label: "Brand Voice" },
    ];

    return (
        <PageLayout
            title="Brand Voice"
            description="Define and manage your brand's unique voice and personality for AI-powered content creation."
            breadcrumbs={breadcrumbs}
        >
            <div className="w-full py-6">
                <BrandVoiceSection />
            </div>
        </PageLayout>
    );
}
