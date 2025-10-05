import { redirect } from "next/navigation";

/**
 * Workspace Root Page
 *
 * Redirects to the default workspace view (Topics).
 * Users accessing /w/{workspaceSlug} will be automatically redirected to /w/{workspaceSlug}/topics
 */
export default async function WorkspaceRootPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  // Await params (Next.js 15 requirement)
  const { workspaceSlug } = await params;

  // Redirect to topics as the default workspace view
  redirect(`/w/${workspaceSlug}/topics`);
}
