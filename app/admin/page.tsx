"use client";

import {
  BarChart3,
  DollarSign,
  Shield,
  TrendingUp,
  UserCog,
  Users,
  Webhook,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageLayout } from "@/components/page-layout";
import { PermissionGuard } from "@/components/permission/permission-guard";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { usePermissionUser } from "@/hooks/use-permission";

export default function AdminDashboardPage() {
  const router = useRouter();
  const user = usePermissionUser();

  const adminCards = [
    {
      title: "User Management",
      description: "Manage users, view details, and modify user accounts",
      href: "/admin/users",
      icon: UserCog,
      permission: "user.read",
    },
    {
      title: "Roles & Permissions",
      description: "Configure roles and assign permissions",
      href: "/admin/roles",
      icon: Shield,
      permission: "role.read",
    },
    {
      title: "System Statistics",
      description: "View system metrics and analytics",
      href: "/admin/statistics",
      icon: BarChart3,
      permission: null, // Always visible to admins
    },
    {
      title: "Subscription Analytics",
      description: "Monitor MRR, churn, trial conversion, and revenue metrics",
      href: "/admin/analytics/subscriptions",
      icon: TrendingUp,
      permission: null, // Requires super admin (checked in page)
    },
    {
      title: "Webhook Monitoring",
      description: "Monitor webhook events and retry failed webhooks",
      href: "/admin/webhooks",
      icon: Webhook,
      permission: null, // Requires super admin (checked in page)
    },
    {
      title: "Refund Management",
      description: "View refund history and manage refund requests",
      href: "/admin/refunds",
      icon: DollarSign,
      permission: null, // Requires super admin (checked in page)
    },
  ];

  return (
    <PermissionGuard
      permission={["audit.read", "user.read", "role.read", "system.manage"]}
      requireAll={false}
      fallback={
        <PageLayout title="Access Denied" description="Admin access required">
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Admin Access Required
              </CardTitle>
              <CardDescription>
                Only administrators can access this area.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                The admin dashboard requires administrator permissions.
              </p>
              <div className="bg-muted p-3 rounded-md">
                <p className="text-xs font-mono">
                  Required: Admin or Super Admin role
                </p>
              </div>
              <Button onClick={() => router.push("/")} variant="outline">
                Return to Dashboard
              </Button>
            </CardContent>
          </Card>
        </PageLayout>
      }
    >
      <PageLayout
        title="Administration"
        description="Manage users, roles, and system settings"
      >
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {adminCards.map((card) => {
              const Icon = card.icon;
              return (
                <Link key={card.href} href={card.href}>
                  <Card className="hover:border-primary transition-colors cursor-pointer h-full">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <CardTitle className="text-xl">{card.title}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>{card.description}</CardDescription>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Welcome, {user?.name || "Admin"}</CardTitle>
              <CardDescription>
                You have administrator access to the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p>
                  <strong>Role:</strong> {user?.role || "Not set"}
                </p>
                <p>
                  <strong>Permissions:</strong>{" "}
                  {user?.permissions && user.permissions.length > 0
                    ? `${user.permissions.length} permissions`
                    : "No permissions loaded"}
                </p>
                {user?.permissions && user.permissions.length > 0 && (
                  <details className="mt-4">
                    <summary className="cursor-pointer text-primary hover:underline">
                      View all permissions
                    </summary>
                    <ul className="mt-2 space-y-1 pl-4">
                      {user.permissions.map((permission) => (
                        <li key={permission} className="text-muted-foreground">
                          • {permission}
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Only show warning if user doesn't have role or permissions */}
          {(!user?.role ||
            !user?.permissions ||
            user.permissions.length === 0) && (
            <Card className="border-yellow-200 bg-yellow-50/50">
              <CardHeader>
                <CardTitle className="text-yellow-800">
                  <Users className="inline h-5 w-5 mr-2" />
                  Backend Integration Required
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-yellow-800">
                <p>
                  The admin features will be fully functional once the backend
                  includes{" "}
                  <code className="bg-yellow-100 px-1 rounded">role</code> and{" "}
                  <code className="bg-yellow-100 px-1 rounded">
                    permissions
                  </code>{" "}
                  in the JWT token during login.
                </p>
                <p className="mt-2">
                  Currently, the permission system is ready but needs backend
                  integration to populate user roles and permissions in the
                  session.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </PageLayout>
    </PermissionGuard>
  );
}
