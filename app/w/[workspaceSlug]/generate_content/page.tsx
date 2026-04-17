"use client";

import { useEffect, useState } from "react";
import { PageLayout } from "@/components/page-layout";
import { useWorkspace } from "@/providers/workspace-provider";
import { SelectionView } from "@/components/generate-content/selection-view";
import { FreshGenerationView } from "@/components/generate-content/fresh-generation-view";
import { useRouter, useSearchParams } from "next/navigation";
import type { Route } from "next";

type PageView = "selection" | "fresh" | "library";

export default function Page() {
  const { workspace } = useWorkspace();
  const router = useRouter();
  const [view, setView] = useState<PageView>("selection");
  const [selectedLibraryKeyword, setSelectedLibraryKeyword] = useState<
    string | undefined
  >(undefined);
  const urlParams = useSearchParams();
  const libraryKeyword = urlParams.get("library");
  const libraryIntent = urlParams.get("intent");
  const isLibrary = libraryKeyword !== null;

  useEffect(() => {
    if (libraryKeyword) {
      setSelectedLibraryKeyword(libraryKeyword);
      setView("fresh");
    }
  }, [libraryKeyword]);

  const handleStartFresh = () => {
    setSelectedLibraryKeyword(undefined);
    setView("fresh");
  };

  const handlePickFromLibrary = () => {
    setView("library");
    router.push(`/w/${workspace?.slug}/generate_content/library` as Route);
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
      className="!py-0"
    >
      <div className="w-full">
        {view === "selection" && (
          <SelectionView
            onStartFresh={handleStartFresh}
            onPickFromLibrary={handlePickFromLibrary}
          />
        )}
        {view === "fresh" && (
          <FreshGenerationView
            onBack={handleBackToSelection}
            initialKeyword={selectedLibraryKeyword}
            initialIntent={libraryIntent ?? undefined}
            isLibrary={isLibrary}
          />
        )}
      </div>
    </PageLayout>
  );
}
