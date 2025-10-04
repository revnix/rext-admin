import { redirect } from "next/navigation";

/**
 * Workspace Root Page
 *
 * Redirects to the default workspace view (Topics).
 * Users accessing /w/{workspaceId} will be automatically redirected to /w/{workspaceId}/topics
 */
export default async function WorkspaceRootPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  // Await params (Next.js 15 requirement)
  const { workspaceId } = await params;

  // Redirect to topics as the default workspace view
  redirect(`/w/${workspaceId}/topics`);
}
