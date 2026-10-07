"use client";

import { use } from "react";
import { ArticleEditPage } from "@/components/editor/article-edit-page";

export default function EditArticlePage({
  params,
}: {
  params: Promise<{ workspaceSlug: string; id: string }>;
}) {
  const { workspaceSlug, id } = use(params);
  return <ArticleEditPage workspaceSlug={workspaceSlug} contentId={id} />;
}
