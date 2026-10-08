import type { Metadata, Route } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ShellLayout } from "@/components/shell/shell-layout";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { WorkspaceProvider } from "@/providers/workspace-provider";

export const metadata: Metadata = { title: "Edit article" };

/**
 * The article editor (tasks 706 and 839): a workspace's page inside the app's shell like every
 * other, with the sidebar collapsed by default so the writing has the room; it opens from its
 * trigger. It lives outside /w because that area's layout mounts the shell with the saved sidebar
 * state. The same sign-in check and workspace context as app/w/[workspaceSlug].
 */
export default async function EditLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ workspaceSlug: string }>;
}) {
  const session = await auth();
  if (!session) {
    redirect("/login" as Route);
  }
  const { workspaceSlug } = await params;

  return (
    <ShellLayout sidebar="collapsed">
      <WorkspaceProvider workspaceId={workspaceSlug}>
        <ErrorBoundary framed>{children}</ErrorBoundary>
      </WorkspaceProvider>
    </ShellLayout>
  );
}
