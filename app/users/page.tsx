import {
  Plus,
  UserPlus,
  Users,
} from "lucide-react";
import { PageLayout } from "@/components/page-layout";
import { PlaceholderPage } from "@/components/placeholder-page";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function UsersPage() {
  const breadcrumbs = [
    { label: "Configuration", href: "#" },
    { label: "Users" },
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
    { label: "Add User", icon: <UserPlus className="h-4 w-4" />, href: "/users/add" },
    {
      label: "Invite Users",
      variant: "outline" as const,
      icon: <Plus className="h-4 w-4" />,
      href: "/users/invite",
    },
  ];

  const tableActions = (
    <>
      <Button variant="outline" asChild>
        <Link href="/users/invite">
          <Plus className="h-4 w-4 mr-2" />
          Invite Users
        </Link>
      </Button>
      <Button asChild>
        <Link href="/users/add">
          <UserPlus className="h-4 w-4 mr-2" />
          Add User
        </Link>
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
        columns={columns}
        emptyTitle="No users found"
        emptyDescription="Start by adding your first user or inviting team members to join your organization."
        emptyActions={emptyActions}
        emptyIcon={<Users className="h-8 w-8 text-muted-foreground" />}
        searchPlaceholder="Search users..."
        tableActions={tableActions}
      />
    </PageLayout>
  );
}
