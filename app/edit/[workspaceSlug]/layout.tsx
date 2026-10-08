import type { Metadata, Route } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AnalyticsConsentPrompt } from "@/components/privacy/analytics-consent-prompt";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { WorkspaceProvider } from "@/providers/workspace-provider";

export const metadata: Metadata = { title: "Edit article" };

/**
 * The full-screen article editor (task 706): a workspace's pages without the app shell, so the
 * writing has the whole window. A page under /w always gets the shell (app/w/layout.tsx), which is
 * why the editor lives here. The same sign-in check and workspace context as app/w/[workspaceSlug].
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
    <WorkspaceProvider workspaceId={workspaceSlug}>
      {/* The editor's frame is the whole window. The shell asks the analytics question on every
          other signed-in page; the editor has no shell, so it is asked here, and the editor takes
          the height that is left under it. */}
      <div className="flex h-dvh flex-col bg-background">
        <div className="shrink-0 pb-4 empty:hidden">
          <AnalyticsConsentPrompt />
        </div>
        <div className="min-h-0 flex-1">
          <ErrorBoundary framed>{children}</ErrorBoundary>
        </div>
      </div>
    </WorkspaceProvider>
  );
}
