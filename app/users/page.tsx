"use client";

import {
  Ban,
  Edit3,
  Eye,
  Settings,
  Shield,
  UserPlus,
  Users as UsersIcon,
} from "lucide-react";

import Link from "next/link";
import { DataTable, type RowAction } from "@/components/data-table";
import { PageLayout } from "@/components/page-layout";
import { Button } from "@/components/ui/button";
import type { UserData } from "@/types/data-table";

export default function UsersPage() {
  const breadcrumbs = [
    { label: "Organization", href: "#" },
    { label: "Users" },
  ];

  // Users data matching UserData interface
  const usersData: UserData[] = [
    {
      id: "1",
      name: "Sarah Johnson",
      email: "sarah.johnson@revnix.com",
      role: "Admin",
      status: "Active",
      joinDate: "2023-11-15",
      lastLogin: "2024-01-22 16:45",
      totalLogins: 247,
      permissions: ["Full Access", "User Management", "System Settings"],
    },
    {
      id: "2",
      name: "Mike Chen",
      email: "mike.chen@revnix.com",
      role: "Editor",
      status: "Active",
      joinDate: "2023-12-01",
      lastLogin: "2024-01-22 14:20",
      totalLogins: 156,
      permissions: ["Content Management", "Flow Management", "Analytics"],
    },
    {
      id: "3",
      name: "David Park",
      email: "david.park@revnix.com",
      role: "Viewer",
      status: "Active",
      joinDate: "2024-01-05",
      lastLogin: "2024-01-22 11:30",
      totalLogins: 43,
      permissions: ["View Only", "Dashboard Access"],
    },
    {
      id: "4",
      name: "Emma Davis",
      email: "emma.davis@revnix.com",
      role: "Editor",
      status: "Pending",
      joinDate: "2024-01-20",
      lastLogin: "Never",
      totalLogins: 0,
      permissions: ["Content Management", "Social Media"],
    },
    {
      id: "5",
      name: "Lisa Wong",
      email: "lisa.wong@revnix.com",
      role: "Admin",
      status: "Inactive",
      joinDate: "2023-10-10",
      lastLogin: "2024-01-15 09:20",
      totalLogins: 89,
      permissions: ["Full Access", "User Management", "Billing"],
    },
    {
      id: "6",
      name: "Carlos Mendez",
      email: "carlos.mendez@revnix.com",
      role: "Editor",
      status: "Active",
      joinDate: "2024-01-08",
      lastLogin: "2024-01-21 15:45",
      totalLogins: 67,
      permissions: ["Content Management", "Flow Management"],
    },
  ];

  const columns = [
    { key: "name", header: "Name", width: "200px" },
    { key: "email", header: "Email", width: "250px" },
    { key: "role", header: "Role", width: "100px" },
    { key: "status", header: "Status", width: "100px" },
    { key: "joinDate", header: "Join Date", width: "120px" },
    { key: "lastLogin", header: "Last Login", width: "130px" },
    { key: "totalLogins", header: "Logins", width: "80px" },
  ];

  const emptyActions = [
    {
      label: "Invite User",
      icon: <UserPlus className="h-4 w-4" />,
      href: "/users/invite",
    },
  ];

  const tableActions = (
    <div className="flex items-center gap-2">
      <Button asChild variant="default">
        <Link href="/users/invite">
          <UserPlus className="h-4 w-4 mr-2" />
          Invite User
        </Link>
      </Button>
      <Button asChild variant="outline">
        <Link href="/users/settings">
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Link>
      </Button>
    </div>
  );

  const handleRowClick = (row: UserData) => {
    console.log("Clicked user:", row);
  };

  const rowActions: RowAction<UserData>[] = [
    {
      label: "View Profile",
      icon: <Eye className="h-4 w-4" />,
      onClick: (row: UserData) => console.log("View user:", row.name),
    },
    {
      label: "Edit User",
      icon: <Edit3 className="h-4 w-4" />,
      onClick: (row: UserData) => console.log("Edit user:", row.name),
    },
    {
      label: "Permissions",
      icon: <Shield className="h-4 w-4" />,
      onClick: (row: UserData) => console.log("Edit permissions:", row.name),
    },
    {
      label: "Deactivate",
      icon: <Ban className="h-4 w-4" />,
      onClick: (row: UserData) => console.log("Deactivate user:", row.name),
      variant: "destructive" as const,
    },
  ];

  return (
    <PageLayout
      title="Users"
      description="Manage user accounts, roles, permissions, and access control for your organization."
      breadcrumbs={breadcrumbs}
    >
      <DataTable<UserData>
        columns={columns}
        data={usersData}
        emptyTitle="No users found"
        emptyDescription="Start by adding your first user or inviting team members to join your organization."
        emptyActions={emptyActions}
        emptyIcon={<UsersIcon className="h-8 w-8 text-muted-foreground" />}
        searchPlaceholder="Search users by name, email, role, status..."
        actions={tableActions}
        onRowClick={handleRowClick}
        rowActions={rowActions}
        pageSize={10}
        searchFields={["name", "email", "role", "status"]}
      />
    </PageLayout>
  );
}
