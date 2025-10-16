import { redirect } from "next/navigation";

/**
 * Workspace Settings Index Page
 *
 * Redirects to the general settings page
 */
export default async function WorkspaceSettingsPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;
  redirect(`/w/${workspaceSlug}/settings/general`);
}
