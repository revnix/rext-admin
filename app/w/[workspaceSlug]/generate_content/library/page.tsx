"use client";

import { PageLayout } from "@/components/page-layout";
import { useWorkspace } from "@/providers/workspace-provider";
import { LibraryView } from "@/components/generate-content/library-view";

export default function Page() {
  const { workspace } = useWorkspace();

  return (
    <PageLayout
      title="Generate Content"
      hideTitle={true}
      description={`View, edit, and manage AI-generated content for ${workspace?.name || "this workspace"}.`}
      fullWidth
    >
      <div className="w-full">
        <LibraryView />
      </div>
    </PageLayout>
  );
}
