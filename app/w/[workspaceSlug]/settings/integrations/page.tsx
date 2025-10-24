"use client";

import {
  BookOpen,
  Code2,
  ExternalLink,
  Info,
  Key,
  Shield,
  Webhook,
} from "lucide-react";
import Link from "next/link";
import { CanAccess } from "@/components/permissions/can-access";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { WORKSPACE_PERMISSIONS } from "@/lib/permissions";

/**
 * Workspace Integrations Settings Page
 *
 * Manages:
 * - API keys for programmatic access
 * - Webhooks for event notifications
 * - Third-party integrations (Zapier, Make, Slack, Discord)
 * - Developer resources and documentation
 *
 * **Permission Required:** `workspace.update` (Admin+ only)
 *
 * NOTE: Full implementation will be added in a future phase.
 * This page provides a structured placeholder with clear organization.
 */
export default function WorkspaceIntegrationsSettings() {
  return (
    <CanAccess
      permission={WORKSPACE_PERMISSIONS.UPDATE}
      fallback={
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Integrations Access Restricted
            </CardTitle>
            <CardDescription>
              Only workspace administrators can manage integrations.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              API keys, webhooks, and third-party integrations are sensitive
              workspace settings that can access and modify workspace data. This
              page is restricted to workspace owners and administrators.
            </p>
            <div className="bg-muted p-3 rounded-md">
              <p className="text-xs font-mono">
                Required permission:{" "}
                <span className="font-semibold">workspace.update</span>
              </p>
            </div>
          </CardContent>
        </Card>
      }
    >
      <div className="space-y-6">
        {/* Info Banner */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Integrations and API management are coming soon. This page shows
            what will be available in future releases.
          </AlertDescription>
        </Alert>

        {/* API Access Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Key className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>API Access</CardTitle>
                  <CardDescription>
                    Generate and manage API keys for programmatic access
                  </CardDescription>
                </div>
              </div>
              <Badge variant="secondary">Coming Soon</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Features</h4>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Generate API keys with custom scopes</li>
                <li>View API usage and rate limits</li>
                <li>Rotate keys for security</li>
                <li>Set expiration dates</li>
              </ul>
            </div>

            <Separator />

            <div className="space-y-2">
              <h4 className="text-sm font-medium">Rate Limits (Planned)</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">Standard Plan</p>
                  <p className="text-sm font-medium">1,000 requests/hour</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">Pro Plan</p>
                  <p className="text-sm font-medium">10,000 requests/hour</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Webhooks Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Webhook className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Webhooks</CardTitle>
                  <CardDescription>
                    Receive real-time notifications about workspace events
                  </CardDescription>
                </div>
              </div>
              <Badge variant="secondary">Coming Soon</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Event Types (Planned)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="p-3 border rounded-lg">
                  <p className="text-sm font-medium">content.generated</p>
                  <p className="text-xs text-muted-foreground">
                    When new content is generated
                  </p>
                </div>
                <div className="p-3 border rounded-lg">
                  <p className="text-sm font-medium">topic.created</p>
                  <p className="text-xs text-muted-foreground">
                    When a new topic is created
                  </p>
                </div>
                <div className="p-3 border rounded-lg">
                  <p className="text-sm font-medium">member.added</p>
                  <p className="text-xs text-muted-foreground">
                    When a member joins the workspace
                  </p>
                </div>
                <div className="p-3 border rounded-lg">
                  <p className="text-sm font-medium">knowledge.updated</p>
                  <p className="text-xs text-muted-foreground">
                    When knowledge base is updated
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <h4 className="text-sm font-medium">Features</h4>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Configure webhook endpoints with custom headers</li>
                <li>Subscribe to specific event types</li>
                <li>Test webhooks with sample payloads</li>
                <li>View delivery logs and retry failed requests</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Third-Party Integrations */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Connected Services</CardTitle>
                <CardDescription>
                  Connect external services to enhance your workflow
                </CardDescription>
              </div>
              <Badge variant="secondary">Coming Soon</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Zapier */}
              <div className="p-4 border rounded-lg hover:border-primary/50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium">Zapier</h4>
                  <Badge variant="outline" className="text-xs">
                    Automation
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Automate workflows with 5000+ apps
                </p>
                <Button variant="outline" size="sm" disabled className="w-full">
                  <ExternalLink className="h-3 w-3 mr-2" />
                  Connect
                </Button>
              </div>

              {/* Make */}
              <div className="p-4 border rounded-lg hover:border-primary/50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium">Make (Integromat)</h4>
                  <Badge variant="outline" className="text-xs">
                    Automation
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Visual automation platform for complex workflows
                </p>
                <Button variant="outline" size="sm" disabled className="w-full">
                  <ExternalLink className="h-3 w-3 mr-2" />
                  Connect
                </Button>
              </div>

              {/* Slack */}
              <div className="p-4 border rounded-lg hover:border-primary/50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium">Slack</h4>
                  <Badge variant="outline" className="text-xs">
                    Notifications
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Get notifications in your Slack workspace
                </p>
                <Button variant="outline" size="sm" disabled className="w-full">
                  <ExternalLink className="h-3 w-3 mr-2" />
                  Connect
                </Button>
              </div>

              {/* Discord */}
              <div className="p-4 border rounded-lg hover:border-primary/50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium">Discord</h4>
                  <Badge variant="outline" className="text-xs">
                    Notifications
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Notify your community server about updates
                </p>
                <Button variant="outline" size="sm" disabled className="w-full">
                  <ExternalLink className="h-3 w-3 mr-2" />
                  Connect
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Developer Resources */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Code2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Developer Resources</CardTitle>
                <CardDescription>
                  Documentation and tools for developers
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* API Documentation */}
              <Button
                variant="outline"
                className="h-auto p-4 justify-start"
                disabled
                asChild
              >
                <div className="w-full">
                  <div className="flex items-start gap-3 w-full">
                    <BookOpen className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 text-left">
                      <p className="font-medium text-sm">API Documentation</p>
                      <p className="text-xs text-muted-foreground">
                        Complete API reference and guides
                      </p>
                    </div>
                    <ExternalLink className="h-4 w-4 flex-shrink-0" />
                  </div>
                </div>
              </Button>

              {/* SDKs */}
              <Button
                variant="outline"
                className="h-auto p-4 justify-start"
                disabled
                asChild
              >
                <div className="w-full">
                  <div className="flex items-start gap-3 w-full">
                    <Code2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 text-left">
                      <p className="font-medium text-sm">SDKs & Libraries</p>
                      <p className="text-xs text-muted-foreground">
                        JavaScript, Python, Ruby, and more
                      </p>
                    </div>
                    <ExternalLink className="h-4 w-4 flex-shrink-0" />
                  </div>
                </div>
              </Button>
            </div>

            <Separator />

            <div className="space-y-2">
              <h4 className="text-sm font-medium">Quick Links (Coming Soon)</h4>
              <div className="grid grid-cols-1 gap-2">
                <Link
                  href="#"
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors text-sm text-muted-foreground pointer-events-none"
                >
                  <span>API Authentication Guide</span>
                  <ExternalLink className="h-3 w-3" />
                </Link>
                <Link
                  href="#"
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors text-sm text-muted-foreground pointer-events-none"
                >
                  <span>Webhook Security Best Practices</span>
                  <ExternalLink className="h-3 w-3" />
                </Link>
                <Link
                  href="#"
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors text-sm text-muted-foreground pointer-events-none"
                >
                  <span>Code Examples & Tutorials</span>
                  <ExternalLink className="h-3 w-3" />
                </Link>
                <Link
                  href="#"
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors text-sm text-muted-foreground pointer-events-none"
                >
                  <span>Rate Limiting & Best Practices</span>
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </CanAccess>
  );
}
