"use client";

import { use } from "react";
import { ArticleEditPage } from "@/components/editor/article-edit-page";
import { WorkingSurface } from "@/components/layouts";

export default function EditArticlePage({
  params,
}: {
  params: Promise<{ workspaceSlug: string; id: string }>;
}) {
  const { workspaceSlug, id } = use(params);
  return (
    // A working surface with no room of its own: the editor draws the article's title as the
    // page's heading, and its bar runs from edge to edge under the shell's top bar.
    <WorkingSurface title="Edit article" ownHeading flush>
      <ArticleEditPage workspaceSlug={workspaceSlug} contentId={id} />
    </WorkingSurface>
  );
}
