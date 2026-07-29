"use client";

import Link from "next/link";
import { PageLayout } from "@/components/page-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { settingsRoutes } from "@/lib/routes";

export default function TrashSettingsPage() {
  return (
    <PageLayout
      title="Trash"
      description="Trash is now managed per workspace in workspace settings."
    >
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Trash</h2>
          <p className="text-muted-foreground">
            The trash page was moved to workspace settings. Open a workspace and
            use its settings to restore deleted workspaces.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Trash moved</CardTitle>
            <CardDescription>
              Workspace recovery is now scoped to each workspace's settings.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              The old account-level trash page no longer manages workspace
              restore actions.
            </p>
            <Button variant="outline" asChild>
              <Link href={settingsRoutes.root}>Back to account settings</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
