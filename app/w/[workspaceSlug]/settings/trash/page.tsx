"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { settingsRoutes } from "@/lib/routes";

export default function WorkspaceTrashSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Workspace trash</h2>
        <p className="text-muted-foreground">
          Workspace restore and trash management are now handled in account
          settings.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Moved to account settings</CardTitle>
          <CardDescription>
            Use the account-level trash page to restore deleted workspaces.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            The workspace-scoped trash page no longer manages restore actions.
          </p>
          <Button variant="outline" asChild>
            <Link href={settingsRoutes.trash}>Go to Trash</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
