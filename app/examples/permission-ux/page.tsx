"use client";

import {
  CreditCard,
  Edit,
  Settings,
  Shield,
  Trash2,
  Users,
} from "lucide-react";
import { PageLayout } from "@/components/page-layout";
import {
  LockedFeatureTooltip,
  PermissionLoading,
} from "@/components/permission";
import { PermissionGuard } from "@/components/permission/permission-guard";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  CONTENT_PERMISSIONS,
  BILLING_PERMISSIONS,
  WORKSPACE_PERMISSIONS,
  MEMBER_PERMISSIONS,
} from "@/lib/permissions";

/**
 * Permission UX Examples Page
 *
 * Demonstrates all permission UX improvements:
 * - LockedFeatureTooltip component
 * - CanAccess with showLockedTooltip
 * - PermissionLoading states
 * - AccessDenied component
 */
export default function PermissionUXExamplesPage() {
  return (
    <PageLayout
      title="Permission UX Examples"
      description="Interactive examples of permission-based UX improvements"
    >
      <div className="space-y-8">
        {/* Section 1: Locked Feature Tooltips */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Locked Feature Tooltips
            </CardTitle>
            <CardDescription>
              Hover over disabled buttons to see permission requirements
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold mb-3">
                Direct LockedFeatureTooltip Usage
              </h3>
              <div className="flex flex-wrap gap-3">
                <LockedFeatureTooltip permission={CONTENT_PERMISSIONS.DELETE}>
                  <Button disabled variant="destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Content
                  </Button>
                </LockedFeatureTooltip>

                <LockedFeatureTooltip
                  permission={BILLING_PERMISSIONS.READ}
                  requiredRole="Workspace Owner"
                  showIcon
                >
                  <Button disabled variant="outline">
                    <CreditCard className="h-4 w-4 mr-2" />
                    View Subscription
                  </Button>
                </LockedFeatureTooltip>

                <LockedFeatureTooltip
                  message="Upgrade to Pro plan to export analytics"
                  showIcon
                >
                  <Button disabled>Export Data</Button>
                </LockedFeatureTooltip>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-sm font-semibold mb-3">
                CanAccess with showLockedTooltip
              </h3>
              <div className="flex flex-wrap gap-3">
                {/* These will be disabled with tooltips if user lacks permission */}
                <PermissionGuard
                  permission={CONTENT_PERMISSIONS.UPDATE}
                  showTooltip
                >
                  <Button variant="outline">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Content
                  </Button>
                </PermissionGuard>

                <PermissionGuard
                  permission={MEMBER_PERMISSIONS.UPDATE_ROLE}
                  showTooltip
                >
                  <Button variant="outline">
                    <Users className="h-4 w-4 mr-2" />
                    Manage Members
                  </Button>
                </PermissionGuard>

                <PermissionGuard
                  permission={WORKSPACE_PERMISSIONS.UPDATE}
                  showTooltip
                  tooltipMessage="Contact your workspace admin for access"
                >
                  <Button variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    Workspace Settings
                  </Button>
                </PermissionGuard>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Loading States */}
        <Card>
          <CardHeader>
            <CardTitle>Permission Loading States</CardTitle>
            <CardDescription>
              Different loading indicators while checking permissions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm font-medium mb-2">Skeleton Loader</p>
                <PermissionLoading variant="skeleton" size="md" />
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Spinner Loader</p>
                <PermissionLoading
                  variant="spinner"
                  message="Checking..."
                  size="md"
                />
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Minimal Loader</p>
                <PermissionLoading
                  variant="minimal"
                  message="Verifying access"
                  size="md"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Real-world Examples */}
        <Card>
          <CardHeader>
            <CardTitle>Real-world Action Buttons</CardTitle>
            <CardDescription>
              Examples showing how permission guards work in practice
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Content Actions */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Content Actions</h3>
              <div className="flex gap-2">
                <PermissionGuard permission={CONTENT_PERMISSIONS.READ}>
                  <Button variant="outline" size="sm">
                    View
                  </Button>
                </PermissionGuard>

                <PermissionGuard
                  permission={CONTENT_PERMISSIONS.UPDATE}
                  showTooltip
                >
                  <Button variant="outline" size="sm">
                    <Edit className="h-3 w-3 mr-2" />
                    Edit
                  </Button>
                </PermissionGuard>

                <PermissionGuard
                  permission={CONTENT_PERMISSIONS.DELETE}
                  showTooltip
                >
                  <Button variant="destructive" size="sm">
                    <Trash2 className="h-3 w-3 mr-2" />
                    Delete
                  </Button>
                </PermissionGuard>
              </div>
            </div>

            <Separator />

            {/* Workspace Actions */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Workspace Actions</h3>
              <div className="flex gap-2">
                <PermissionGuard
                  permission={WORKSPACE_PERMISSIONS.UPDATE}
                  showTooltip
                >
                  <Button variant="outline" size="sm">
                    <Settings className="h-3 w-3 mr-2" />
                    Settings
                  </Button>
                </PermissionGuard>

                <PermissionGuard
                  permission={MEMBER_PERMISSIONS.UPDATE_ROLE}
                  showTooltip
                >
                  <Button variant="outline" size="sm">
                    <Users className="h-3 w-3 mr-2" />
                    Members
                  </Button>
                </PermissionGuard>

                <PermissionGuard
                  permission={BILLING_PERMISSIONS.READ}
                  showTooltip
                  tooltipMessage="Only workspace owners can view subscription"
                >
                  <Button variant="outline" size="sm">
                    <CreditCard className="h-3 w-3 mr-2" />
                    Subscription
                  </Button>
                </PermissionGuard>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 4: Usage Guide */}
        <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/50">
          <CardHeader>
            <CardTitle className="text-blue-700 dark:text-blue-300">
              Usage Guide
            </CardTitle>
            <CardDescription>
              How to use these UX improvements in your components
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="font-semibold mb-1">1. Locked Feature Tooltips</p>
              <code className="block bg-muted p-2 rounded text-xs">
                {`<LockedFeatureTooltip permission="content.delete">
  <Button disabled>Delete</Button>
</LockedFeatureTooltip>`}
              </code>
            </div>

            <div>
              <p className="font-semibold mb-1">2. CanAccess with Tooltips</p>
              <code className="block bg-muted p-2 rounded text-xs">
                {`<PermissionGuard permission="content.update" showLockedTooltip>
  <Button>Edit</Button>
</PermissionGuard>`}
              </code>
            </div>

            <div>
              <p className="font-semibold mb-1">3. Loading States</p>
              <code className="block bg-muted p-2 rounded text-xs">
                {`<PermissionGuard
  permission="content.read"
  showLoading
  loadingVariant="spinner"
>
  <ContentList />
</PermissionGuard>`}
              </code>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
