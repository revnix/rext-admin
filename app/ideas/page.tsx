import {
  AlertCircle,
  CheckCircle,
  Clock,
  Lightbulb,
  Plus,
} from "lucide-react";
import { PageLayout } from "@/components/page-layout";
import { PlaceholderPage } from "@/components/placeholder-page";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function IdeasPage() {
  const breadcrumbs = [{ label: "Library", href: "#" }, { label: "Ideas" }];

  const stats = [
    { title: "Total Ideas", value: "--", icon: Lightbulb },
    { title: "In Progress", value: "--", icon: Clock },
    { title: "Completed", value: "--", icon: CheckCircle },
    { title: "On Hold", value: "--", icon: AlertCircle },
  ];

  const columns = [
    { key: "name", header: "Idea Name", width: "250px" },
    { key: "category", header: "Category", width: "150px" },
    { key: "status", header: "Status", width: "120px" },
    { key: "priority", header: "Priority", width: "100px" },
    { key: "created", header: "Created", width: "120px" },
    { key: "updated", header: "Updated", width: "120px" },
  ];

  const emptyActions = [
    { 
      label: "Create Idea", 
      icon: <Plus className="h-4 w-4" />,
      href: "/ideas/create"
    },
  ];

  const tableActions = (
    <Button asChild>
      <Link href="/ideas/create">
        <Plus className="h-4 w-4 mr-2" />
        Create Idea
      </Link>
    </Button>
  );

  return (
    <PageLayout
      title="Ideas"
      description="Browse, organize, and manage your collection of ideas. Transform concepts into actionable plans."
      breadcrumbs={breadcrumbs}
    >
      <PlaceholderPage
        stats={stats}
        columns={columns}
        data={[]}
        emptyTitle="No ideas yet"
        emptyDescription="Start building your idea collection. Add your first idea or import existing concepts."
        emptyActions={emptyActions}
        emptyIcon={<Lightbulb className="h-8 w-8 text-muted-foreground" />}
        searchPlaceholder="Search ideas..."
        tableActions={tableActions}
      />
    </PageLayout>
  );
}
