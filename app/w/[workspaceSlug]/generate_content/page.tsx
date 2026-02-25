"use client";

import { useState } from "react";
import { PageLayout } from "@/components/page-layout";
import { useWorkspace } from "@/providers/workspace-provider";
import { SelectionView } from "@/components/generate-content/selection-view";
import { LibraryView } from "@/components/generate-content/library-view";
import { FreshGenerationView } from "@/components/generate-content/fresh-generation-view";

type PageView = "selection" | "fresh" | "library";

export default function Page() {
  const { workspace } = useWorkspace();
  const [view, setView] = useState<PageView>("selection");
  const [selectedLibraryKeyword, setSelectedLibraryKeyword] = useState<
    string | undefined
  >(undefined);

  const handleStartFresh = () => {
    setSelectedLibraryKeyword(undefined);
    setView("fresh");
  };

  const handlePickFromLibrary = () => {
    setView("library");
  };

  const handleLibraryKeywordSelect = (keyword: string) => {
    setSelectedLibraryKeyword(keyword);
    setView("fresh");
  };

  const handleBackToSelection = () => {
    setView("selection");
    setSelectedLibraryKeyword(undefined);
  };

  return (
    <PageLayout
      title="Generate Content"
      hideTitle={true}
      description={`View, edit, and manage AI-generated content for ${workspace?.name || "this workspace"}.`}
      fullWidth
    >
      <div className="w-full">
        {view === "selection" && (
          <SelectionView
            onStartFresh={handleStartFresh}
            onPickFromLibrary={handlePickFromLibrary}
          />
        )}

        {view === "library" && (
          <LibraryView
            onSelectKeyword={handleLibraryKeywordSelect}
            onBack={handleBackToSelection}
          />
        )}

        {view === "fresh" && (
          <FreshGenerationView
            onBack={handleBackToSelection}
            initialKeyword={selectedLibraryKeyword}
          />
        )}
      </div>
    </PageLayout>
  );
}
