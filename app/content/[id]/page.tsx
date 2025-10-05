"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { use, useEffect } from "react";
import { useCurrentWorkspace } from "@/stores/workspace-store";

type ContentDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default function ContentDetailPage({ params }: ContentDetailPageProps) {
  const router = useRouter();
  const currentWorkspace = useCurrentWorkspace();
  const { id } = use(params);

  useEffect(() => {
    if (currentWorkspace?.slug) {
      router.replace(`/w/${currentWorkspace.slug}/content/${id}`);
      return;
    }
    // No workspace selected, redirect to workspace selector
    router.replace("/workspaces");
  }, [currentWorkspace, id, router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}
