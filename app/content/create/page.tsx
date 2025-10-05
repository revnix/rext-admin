"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useCurrentWorkspace } from "@/stores/workspace-store";

export default function LegacyContentCreatePage() {
  const router = useRouter();
  const currentWorkspace = useCurrentWorkspace();

  useEffect(() => {
    if (currentWorkspace?.slug) {
      router.replace(`/w/${currentWorkspace.slug}/content/create`);
      return;
    }
    // No workspace selected, redirect to workspace selector
    router.replace("/workspaces");
  }, [currentWorkspace, router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}
