import { redirect } from "next/navigation";

/**
 * Workspace Settings Index Page
 *
 * Redirects to the general settings page
 */
export default function WorkspaceSettingsPage({
  params,
}: {
  params: { workspaceSlug: string };
}) {
  redirect(`/w/${params.workspaceSlug}/settings/general`);
}
