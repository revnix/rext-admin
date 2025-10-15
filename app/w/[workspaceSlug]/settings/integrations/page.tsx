"use client";

import { Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Workspace Integrations Settings Page
 *
 * Manages:
 * - API keys for programmatic access
 * - Webhooks for event notifications
 * - Third-party integrations (Zapier, Make, etc.)
 *
 * NOTE: Full implementation will be added in a future phase.
 */
export default function WorkspaceIntegrationsSettings() {
  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Integrations and API management will be implemented in a future phase.
        </AlertDescription>
      </Alert>

      {/* API Keys */}
      <Card>
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
          <CardDescription>
            Manage API keys for programmatic access to your workspace
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Coming soon: Generate and manage API keys for workspace access
          </p>
        </CardContent>
      </Card>

      {/* Webhooks */}
      <Card>
        <CardHeader>
          <CardTitle>Webhooks</CardTitle>
          <CardDescription>
            Configure webhooks to receive real-time notifications about
            workspace events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Coming soon: Set up webhooks for content generation, member updates,
            and more
          </p>
        </CardContent>
      </Card>

      {/* Third-Party Integrations */}
      <Card>
        <CardHeader>
          <CardTitle>Third-Party Integrations</CardTitle>
          <CardDescription>
            Connect external services to enhance your workflow
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg opacity-50">
              <h4 className="text-sm font-medium mb-1">Zapier</h4>
              <p className="text-xs text-muted-foreground">
                Automate workflows with 5000+ apps
              </p>
            </div>

            <div className="p-4 border rounded-lg opacity-50">
              <h4 className="text-sm font-medium mb-1">Make (Integromat)</h4>
              <p className="text-xs text-muted-foreground">
                Visual automation platform
              </p>
            </div>

            <div className="p-4 border rounded-lg opacity-50">
              <h4 className="text-sm font-medium mb-1">Slack</h4>
              <p className="text-xs text-muted-foreground">
                Get notifications in your workspace
              </p>
            </div>

            <div className="p-4 border rounded-lg opacity-50">
              <h4 className="text-sm font-medium mb-1">Discord</h4>
              <p className="text-xs text-muted-foreground">
                Notify your community server
              </p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mt-4">
            These integrations are coming soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
