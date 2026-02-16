"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Mail,
  ShieldCheck,
  User as UserIcon,
  Users as UsersIcon,
} from "lucide-react";
import { useState } from "react";
import { DataTable } from "@/components/data-table";
import { ImpersonationStartDialog } from "@/components/impersonation/impersonation-start-dialog";
import { PageLayout } from "@/components/page-layout";
import { CanAccess } from "@/components/permissions/can-access";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ErrorPage } from "@/components/ui/error-states";
import { apiClient } from "@/lib/api-client";
import type { User } from "@/lib/api-client/users";
import { PERMISSIONS } from "@/lib/permissions";
import type { Column, RowAction } from "@/types/data-table";

interface UserData extends Record<string, unknown> {
  id: string;
  name: string;
  email: string;
  status: string;
  email_verified: boolean;
  display_name: string | null | undefined;
  full_name: string | null | undefined;
  initials: string;
}

export default function AdminUsersPage() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showImpersonateDialog, setShowImpersonateDialog] = useState(false);

  const breadcrumbs = [
    { label: "Admin", href: "/admin" },
    { label: "User Management" },
  ];

  // Fetch all users
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => apiClient.users.list(),
    throwOnError: true,
  });

  const handleImpersonate = (userId: string) => {
    const user = data?.users.find((u) => u.id === userId);
    if (user) {
      setSelectedUser(user);
      setShowImpersonateDialog(true);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      {
        variant: "default" | "secondary" | "destructive" | "outline";
        text: string;
      }
    > = {
      active: { variant: "default", text: "Active" },
      inactive: { variant: "secondary", text: "Inactive" },
      suspended: { variant: "destructive", text: "Suspended" },
      pending: { variant: "outline", text: "Pending" },
    };

    const config = variants[status] || variants.active;
    return <Badge variant={config.variant}>{config.text}</Badge>;
  };
  const getUserInitials = (user: User) => {
    if (user.display_name) {
      const parts = user.display_name.split(" ");
      if (parts.length >= 2 && parts[0]?.[0] && parts[1]?.[0]) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
      return user.display_name.slice(0, 2).toUpperCase();
    }
    if (user.full_name) {
      const parts = user.full_name.split(" ");
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
      return user.full_name.slice(0, 2).toUpperCase();
    }
    return user.email.slice(0, 2).toUpperCase();
  };

  // Transform users data for DataTable
  const tableData: UserData[] = (data?.users || []).map((user) => ({
    id: user.id,
    name: user.display_name || user.full_name || user.email,
    email: user.email,
    status: user.status,
    email_verified: user.email_verified,
    display_name: user.display_name,
    full_name: user.full_name,
    initials: getUserInitials(user),
  }));

  // Define columns
  const columns: Column<UserData>[] = [
    {
      key: "name",
      header: "User",
      width: "250px",
      cell: (value, row) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {row.initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{value as string}</p>
            {row.full_name && row.display_name && row.full_name !== row.display_name && (
              <p className="text-sm text-muted-foreground">
                {row.full_name}
              </p>
            )}
          </div>
        </div>
      ),
      searchable: true,
    },
    {
      key: "email",
      header: "Email",
      width: "250px",
      searchable: true,
    },
    {
      key: "full_name",
      header: "Full Name",
      width: "150px",
      cell: (value) => (
        <span className="text-sm text-muted-foreground">
          {value as string}
        </span>
      ),
      searchable: true,
    },
    {
      key: "status",
      header: "Status",
      width: "120px",
      cell: (value) => getStatusBadge(value as string),
    },
    {
      key: "email_verified",
      header: "Verified",
      width: "120px",
      cell: (value) => {
        const verified = value as boolean;
        return verified ? (
          <Badge variant="outline" className="text-green-600 border-green-600">
            <ShieldCheck className="h-3 w-3 mr-1" />
            Yes
          </Badge>
        ) : (
          <Badge variant="outline" className="text-amber-600 border-amber-600">
            No
          </Badge>
        );
      },
    },
  ];

  // Define row actions
  const rowActions: RowAction<UserData>[] = [
    {
      label: "Impersonate",
      icon: <UserIcon className="h-4 w-4" />,
      onClick: (row) => handleImpersonate(row.id),
      primary: true,
    },
  ];

  if (error) {
    return (
      <ErrorPage
        title="Failed to load users"
        message="There was an error loading the user list. Please try again."
        retry={() => refetch()}
      />
    );
  }

  return (
    <PageLayout
      title="User Management"
      description="Manage system users and impersonation"
      breadcrumbs={breadcrumbs}
    >
      <CanAccess
        permission={PERMISSIONS.USER_READ}
        fallback={
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Access Denied</CardTitle>
              <CardDescription>
                You don't have permission to view user management.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Required permission:{" "}
                <code className="text-xs bg-muted px-1 rounded">user.read</code>
              </p>
            </CardContent>
          </Card>
        }
      >
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Users
                </CardTitle>
                <UsersIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data?.total_count || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Registered accounts
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Users
                </CardTitle>
                <ShieldCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data?.users.filter((u) => u.status === "active").length || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Currently active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Verified</CardTitle>
                <Mail className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data?.users.filter((u) => u.email_verified).length || 0}
                </div>
                <p className="text-xs text-muted-foreground">Email verified</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <UserIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data?.users.filter((u) => u.status === "pending").length ||
                    0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Awaiting verification
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Users</CardTitle>
              <CardDescription>
                View and manage user accounts. Click "Impersonate" to view the
                system as that user.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={columns}
                data={tableData}
                isLoading={isLoading}
                rowActions={rowActions}
                emptyTitle="No users found"
                emptyDescription="There are no registered users in the system."
                searchPlaceholder="Search by name or email..."
                searchFields={["name", "email", "full_name"]}
                pageSize={10}
                pageSizeOptions={[10, 25, 50, 100]}
                tableId="admin-users"
              />
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="text-blue-900 dark:text-blue-100">
                About Impersonation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
              <p>
                <strong>Impersonation</strong> allows you to view the system as
                another user for troubleshooting and support purposes.
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>All actions are performed as the impersonated user</li>
                <li>Your session is logged for audit and security purposes</li>
                <li>A yellow banner will display while impersonating</li>
                <li>You can stop impersonation at any time</li>
              </ul>
            </CardContent>
          </Card>

          {/* Impersonation Dialog */}
          <ImpersonationStartDialog
            user={selectedUser}
            open={showImpersonateDialog}
            onOpenChange={setShowImpersonateDialog}
            onStarted={() => {
              // Dialog handles everything, just reset state
              setSelectedUser(null);
            }}
          />
        </div>
      </CanAccess>
    </PageLayout>
  );
}
