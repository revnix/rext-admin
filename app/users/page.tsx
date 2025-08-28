import {
  Clock,
  Plus,
  Shield,
  UserCheck,
  UserPlus,
  Users,
  UserX,
} from "lucide-react";
import { PageLayout } from "@/components/page-layout";
import { PlaceholderPage } from "@/components/placeholder-page";
import { Button } from "@/components/ui/button";

export default function UsersPage() {
  const breadcrumbs = [
    { label: "Configuration", href: "#" },
    { label: "Users" },
  ];

  const stats = [
    { title: "Total Users", value: "--", icon: Users },
    { title: "Active", value: "--", icon: UserCheck },
    { title: "Pending", value: "--", icon: Clock },
    { title: "Inactive", value: "--", icon: UserX },
  ];

  const columns = [
    { key: "name", header: "Name", width: "200px" },
    { key: "email", header: "Email", width: "250px" },
    { key: "role", header: "Role", width: "120px" },
    { key: "status", header: "Status", width: "100px" },
    { key: "lastLogin", header: "Last Login", width: "150px" },
    { key: "created", header: "Created", width: "120px" },
  ];

  const emptyActions = [
    { label: "Add User", icon: <UserPlus className="h-4 w-4" /> },
    {
      label: "Invite Users",
      variant: "outline" as const,
      icon: <Plus className="h-4 w-4" />,
    },
    {
      label: "Manage Roles",
      variant: "outline" as const,
      icon: <Shield className="h-4 w-4" />,
    },
  ];

  const tableActions = (
    <>
      <Button variant="outline">
        <Shield className="h-4 w-4 mr-2" />
        Manage Roles
      </Button>
      <Button>
        <UserPlus className="h-4 w-4 mr-2" />
        Add User
      </Button>
    </>
  );

  return (
    <PageLayout
      title="Users"
      description="Manage user accounts, roles, permissions, and access control for your organization."
      breadcrumbs={breadcrumbs}
    >
      <PlaceholderPage
        stats={stats}
        columns={columns}
        emptyTitle="No users found"
        emptyDescription="Start by adding your first user or inviting team members to join your organization."
        emptyActions={emptyActions}
        searchPlaceholder="Search users..."
        tableActions={tableActions}
      />
    </PageLayout>
  );
}
