"use client";

import {
  Calendar,
  Copy,
  Edit2,
  Eye,
  Lock,
  Mail,
  Plus,
  Shield,
  UserMinus,
  UserPlus,
  Users,
} from "lucide-react";
import Link from "next/link";
import { DataTable, type RowAction } from "@/components/data-table";
import { PageLayout } from "@/components/page-layout";
import { Button } from "@/components/ui/button";
import type { UserData } from "@/types/data-table";

export default function UsersPage() {
  const breadcrumbs = [
    { label: "Configuration", href: "#" },
    { label: "Users" },
  ];

  // Comprehensive users data - team members and their access control
  const usersData = [
    {
      id: "1",
      name: "Sarah Johnson",
      firstName: "Sarah",
      lastName: "Johnson",
      email: "sarah.johnson@revnix.com",
      role: "Admin",
      department: "Leadership",
      title: "Chief Technology Officer",
      status: "Active",
      avatar: "https://i.pravatar.cc/32?img=1",
      permissions: [
        "Create Flows",
        "Manage Users",
        "Configure Models",
        "Access Analytics",
        "Billing Management",
        "System Settings",
      ],
      flows: [
        "AI Blog Post Generator",
        "Newsletter Content Creator",
        "Social Media Content Pipeline",
      ],
      flowsCreated: 15,
      contentGenerated: 3421,
      lastLogin: "2024-01-22 16:45",
      loginCount: 342,
      accountCreated: "2023-08-15 10:00",
      lastActivity: "Approved memory: Customer feedback analysis",
      location: "San Francisco, CA",
      timezone: "PST",
      phone: "+1 (555) 123-4567",
      twoFactorEnabled: true,
      apiAccess: true,
      monthlyUsage: "$234.56",
      invitedBy: "System",
      onboardingCompleted: true,
      tags: ["admin", "cto", "leadership"],
    },
    {
      id: "2",
      name: "Mike Chen",
      firstName: "Mike",
      lastName: "Chen",
      email: "mike.chen@revnix.com",
      role: "Content Manager",
      department: "Marketing",
      title: "Senior Content Strategist",
      status: "Active",
      avatar: "https://i.pravatar.cc/32?img=2",
      permissions: [
        "Create Flows",
        "Manage Content",
        "Social Media Publishing",
        "View Analytics",
        "Approve Content",
      ],
      flows: [
        "Social Media Content Pipeline",
        "Brand Voice Compliance",
        "Twitter Thread Storyteller",
      ],
      flowsCreated: 23,
      contentGenerated: 2847,
      lastLogin: "2024-01-22 15:30",
      loginCount: 156,
      accountCreated: "2023-09-10 14:20",
      lastActivity: "Created flow: Instagram Story Creator",
      location: "Austin, TX",
      timezone: "CST",
      phone: "+1 (555) 234-5678",
      twoFactorEnabled: true,
      apiAccess: false,
      monthlyUsage: "$89.34",
      invitedBy: "Sarah Johnson",
      onboardingCompleted: true,
      tags: ["content", "marketing", "social-media"],
    },
    {
      id: "3",
      name: "Alex Rivera",
      firstName: "Alex",
      lastName: "Rivera",
      email: "alex.rivera@revnix.com",
      role: "Developer",
      department: "Engineering",
      title: "Senior Software Engineer",
      status: "Active",
      avatar: "https://i.pravatar.cc/32?img=3",
      permissions: [
        "Configure Models",
        "Manage Integrations",
        "API Access",
        "Debug Flows",
        "System Monitoring",
      ],
      flows: [
        "SEO Content Optimizer",
        "Technical Documentation Generator",
        "Code Comment Generator",
      ],
      flowsCreated: 8,
      contentGenerated: 567,
      lastLogin: "2024-01-22 14:20",
      loginCount: 89,
      accountCreated: "2023-10-05 09:30",
      lastActivity: "Configured model: Claude 3 Haiku",
      location: "Seattle, WA",
      timezone: "PST",
      phone: "+1 (555) 345-6789",
      twoFactorEnabled: true,
      apiAccess: true,
      monthlyUsage: "$45.67",
      invitedBy: "Sarah Johnson",
      onboardingCompleted: true,
      tags: ["developer", "engineering", "api"],
    },
    {
      id: "4",
      name: "Jennifer Taylor",
      firstName: "Jennifer",
      lastName: "Taylor",
      email: "jennifer.taylor@revnix.com",
      role: "Editor",
      department: "Content",
      title: "Content Editor",
      status: "Active",
      avatar: "https://i.pravatar.cc/32?img=4",
      permissions: [
        "Review Content",
        "Approve Drafts",
        "Edit Generated Content",
        "View Content Analytics",
        "Manage Quality Rules",
      ],
      flows: [
        "Content Quality Gate",
        "Editorial Review Process",
        "Brand Voice Compliance",
      ],
      flowsCreated: 12,
      contentGenerated: 1234,
      lastLogin: "2024-01-22 13:45",
      loginCount: 203,
      accountCreated: "2023-11-01 11:15",
      lastActivity: "Approved content: Social Media Post #47",
      location: "New York, NY",
      timezone: "EST",
      phone: "+1 (555) 456-7890",
      twoFactorEnabled: false,
      apiAccess: false,
      monthlyUsage: "$23.45",
      invitedBy: "Mike Chen",
      onboardingCompleted: true,
      tags: ["editor", "content", "quality"],
    },
    {
      id: "5",
      name: "David Park",
      firstName: "David",
      lastName: "Park",
      email: "david.park@revnix.com",
      role: "Designer",
      department: "Creative",
      title: "Visual Content Designer",
      status: "Active",
      avatar: "https://i.pravatar.cc/32?img=5",
      permissions: [
        "Create Visual Content",
        "Manage Brand Assets",
        "Design Templates",
        "Social Media Design",
        "Image Generation",
      ],
      flows: [
        "Visual Content Creator",
        "Instagram Stories",
        "Pinterest Marketing",
        "DALL-E Image Generator",
      ],
      flowsCreated: 18,
      contentGenerated: 892,
      lastLogin: "2024-01-22 12:30",
      loginCount: 134,
      accountCreated: "2023-12-01 15:45",
      lastActivity: "Generated images for Blog Post #23",
      location: "Los Angeles, CA",
      timezone: "PST",
      phone: "+1 (555) 567-8901",
      twoFactorEnabled: true,
      apiAccess: false,
      monthlyUsage: "$67.89",
      invitedBy: "Sarah Johnson",
      onboardingCompleted: true,
      tags: ["designer", "visual", "creative"],
    },
    {
      id: "6",
      name: "Emma Davis",
      firstName: "Emma",
      lastName: "Davis",
      email: "emma.davis@revnix.com",
      role: "Analyst",
      department: "Analytics",
      title: "Content Performance Analyst",
      status: "Active",
      avatar: "https://i.pravatar.cc/32?img=6",
      permissions: [
        "View Analytics",
        "Generate Reports",
        "Performance Tracking",
        "Data Export",
        "Insights Analysis",
      ],
      flows: [
        "Performance Analytics",
        "Content ROI Calculator",
        "Engagement Optimizer",
      ],
      flowsCreated: 6,
      contentGenerated: 234,
      lastLogin: "2024-01-22 11:15",
      loginCount: 67,
      accountCreated: "2024-01-05 13:20",
      lastActivity: "Generated monthly performance report",
      location: "Denver, CO",
      timezone: "MST",
      phone: "+1 (555) 678-9012",
      twoFactorEnabled: false,
      apiAccess: false,
      monthlyUsage: "$12.34",
      invitedBy: "Jennifer Taylor",
      onboardingCompleted: true,
      tags: ["analyst", "analytics", "reporting"],
    },
    {
      id: "7",
      name: "Carlos Mendez",
      firstName: "Carlos",
      lastName: "Mendez",
      email: "carlos.mendez@revnix.com",
      role: "Marketing Manager",
      department: "Marketing",
      title: "Digital Marketing Manager",
      status: "Pending",
      avatar: "https://i.pravatar.cc/32?img=7",
      permissions: [
        "Create Campaigns",
        "Manage Social Accounts",
        "Email Marketing",
        "Campaign Analytics",
        "Budget Management",
      ],
      flows: [],
      flowsCreated: 0,
      contentGenerated: 0,
      lastLogin: "Never",
      loginCount: 0,
      accountCreated: "2024-01-20 16:30",
      lastActivity: "Account created, onboarding pending",
      location: "Miami, FL",
      timezone: "EST",
      phone: "+1 (555) 789-0123",
      twoFactorEnabled: false,
      apiAccess: false,
      monthlyUsage: "$0.00",
      invitedBy: "Mike Chen",
      onboardingCompleted: false,
      tags: ["marketing", "pending", "campaigns"],
    },
    {
      id: "8",
      name: "Lisa Wong",
      firstName: "Lisa",
      lastName: "Wong",
      email: "lisa.wong@revnix.com",
      role: "Content Writer",
      department: "Content",
      title: "Senior Content Writer",
      status: "Suspended",
      avatar: "https://i.pravatar.cc/32?img=8",
      permissions: [
        "Create Content",
        "Edit Drafts",
        "Research Topics",
        "SEO Optimization",
      ],
      flows: [
        "AI Blog Post Generator",
        "Long-form Content Creator",
        "Email Newsletter Writer",
      ],
      flowsCreated: 9,
      contentGenerated: 445,
      lastLogin: "2024-01-18 09:45",
      loginCount: 78,
      accountCreated: "2023-11-15 10:00",
      lastActivity: "Account suspended for policy violation",
      location: "Portland, OR",
      timezone: "PST",
      phone: "+1 (555) 890-1234",
      twoFactorEnabled: false,
      apiAccess: false,
      monthlyUsage: "$0.00",
      invitedBy: "Jennifer Taylor",
      onboardingCompleted: true,
      tags: ["writer", "suspended", "content"],
    },
    {
      id: "9",
      name: "Robert Kim",
      firstName: "Robert",
      lastName: "Kim",
      email: "robert.kim@revnix.com",
      role: "QA Specialist",
      department: "Quality Assurance",
      title: "Content Quality Specialist",
      status: "Active",
      avatar: "https://i.pravatar.cc/32?img=9",
      permissions: [
        "Quality Testing",
        "Content Review",
        "Rule Management",
        "Compliance Checking",
        "Error Reporting",
      ],
      flows: [
        "Content Quality Gate",
        "Brand Compliance Checker",
        "Plagiarism Detection",
      ],
      flowsCreated: 14,
      contentGenerated: 678,
      lastLogin: "2024-01-22 10:00",
      loginCount: 112,
      accountCreated: "2023-10-20 14:15",
      lastActivity: "Updated quality rule: Content Length Validator",
      location: "Boston, MA",
      timezone: "EST",
      phone: "+1 (555) 901-2345",
      twoFactorEnabled: true,
      apiAccess: false,
      monthlyUsage: "$34.56",
      invitedBy: "Sarah Johnson",
      onboardingCompleted: true,
      tags: ["qa", "quality", "compliance"],
    },
    {
      id: "10",
      name: "Amanda Foster",
      firstName: "Amanda",
      lastName: "Foster",
      email: "amanda.foster@revnix.com",
      role: "Social Media Manager",
      department: "Marketing",
      title: "Social Media Coordinator",
      status: "Active",
      avatar: "https://i.pravatar.cc/32?img=10",
      permissions: [
        "Social Media Publishing",
        "Community Management",
        "Engagement Analytics",
        "Content Scheduling",
        "Hashtag Research",
      ],
      flows: [
        "Social Media Content Pipeline",
        "Twitter Thread Storyteller",
        "TikTok Marketing",
        "Short-form Video Creator",
      ],
      flowsCreated: 21,
      contentGenerated: 1567,
      lastLogin: "2024-01-22 08:30",
      loginCount: 245,
      accountCreated: "2023-12-10 09:00",
      lastActivity: "Published to TikTok: Quick Tips Video #12",
      location: "Chicago, IL",
      timezone: "CST",
      phone: "+1 (555) 012-3456",
      twoFactorEnabled: false,
      apiAccess: false,
      monthlyUsage: "$78.90",
      invitedBy: "Mike Chen",
      onboardingCompleted: true,
      tags: ["social-media", "community", "engagement"],
    },
  ];

  const columns = [
    { key: "name", header: "Name", width: "180px" },
    { key: "email", header: "Email", width: "220px" },
    { key: "role", header: "Role", width: "140px" },
    { key: "department", header: "Department", width: "120px" },
    { key: "status", header: "Status", width: "100px" },
    { key: "flowsCreated", header: "Flows", width: "80px" },
    { key: "lastLogin", header: "Last Login", width: "130px" },
    { key: "accountCreated", header: "Created", width: "120px" },
  ];

  const emptyActions = [
    {
      label: "Add User",
      icon: <UserPlus className="h-4 w-4" />,
      href: "/users/add",
    },
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

  // Row click handler
  const handleRowClick = (row: UserData) => {
    console.log("Viewing user:", row.name);
    // In a real app, you'd navigate to `/users/${row.id}`
  };

  // Custom row actions specific to users
  const rowActions: RowAction<UserData>[] = [
    {
      label: "View Profile",
      icon: <Eye className="h-4 w-4" />,
      onClick: (row: UserData) => console.log("View user:", row.name),
    },
    {
      label: "Edit User",
      icon: <Edit2 className="h-4 w-4" />,
      onClick: (row: UserData) => console.log("Edit user:", row.name),
    },
    {
      label: "View Activity",
      icon: <Calendar className="h-4 w-4" />,
      onClick: (row: UserData) => console.log("View activity:", row.name),
    },
    {
      label: "Permissions",
      icon: <Shield className="h-4 w-4" />,
      onClick: (row: UserData) => console.log("Manage permissions:", row.name),
    },
    {
      label: "Reset Password",
      icon: <Lock className="h-4 w-4" />,
      onClick: (row: UserData) => console.log("Reset password:", row.name),
    },
    {
      label: "Send Message",
      icon: <Mail className="h-4 w-4" />,
      onClick: (row: UserData) => console.log("Send message:", row.name),
    },
    {
      label: "Duplicate User",
      icon: <Copy className="h-4 w-4" />,
      onClick: (row: UserData) => console.log("Duplicate user:", row.name),
    },
    {
      label: "Suspend/Unsuspend",
      icon: <UserMinus className="h-4 w-4" />,
      onClick: (row: UserData) =>
        console.log(
          row.status === "Suspended" ? "Unsuspend" : "Suspend",
          "user:",
          row.name,
        ),
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
        // biome-ignore lint/suspicious/noExplicitAny: Sample data with flexible structure
        data={usersData as any}
        emptyTitle="No users found"
        emptyDescription="Start by adding your first user or inviting team members to join your organization."
        emptyActions={emptyActions}
        emptyIcon={<Users className="h-8 w-8 text-muted-foreground" />}
        searchPlaceholder="Search users by name, email, role, department..."
        actions={tableActions}
        onRowClick={handleRowClick}
        rowActions={rowActions}
        pageSize={10}
        searchFields={["name", "email", "role", "department", "status", "tags"]}
      />
    </PageLayout>
  );
}
