import {
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  Plus,
} from "lucide-react";
import { PageLayout } from "@/components/page-layout";
import { PlaceholderPage } from "@/components/placeholder-page";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ContentPage() {
  const breadcrumbs = [{ label: "Library", href: "#" }, { label: "Content" }];

  const stats = [
    { title: "Total Content", value: "--", icon: FileText },
    { title: "Published", value: "--", icon: CheckCircle },
    { title: "Draft", value: "--", icon: Clock },
    { title: "Archived", value: "--", icon: AlertCircle },
  ];

  const columns = [
    { key: "title", header: "Title", width: "300px" },
    { key: "type", header: "Type", width: "120px" },
    { key: "status", header: "Status", width: "100px" },
    { key: "author", header: "Author", width: "150px" },
    { key: "lastModified", header: "Last Modified", width: "150px" },
    { key: "created", header: "Created", width: "120px" },
  ];

  const emptyActions: Array<{
    label: string;
    icon?: React.ReactNode;
    variant?: "default" | "outline" | "secondary";
  }> = [];

  const tableActions = (
    <Button asChild>
      <Link href="/flows/create">
        <Plus className="h-4 w-4 mr-2" />
        Generate Content (via Flow)
      </Link>
    </Button>
  );

  return (
    <PageLayout
      title="Content"
      description="View and manage all content generated through your automated flows and processes."
      breadcrumbs={breadcrumbs}
    >
      <PlaceholderPage
        stats={stats}
        columns={columns}
        emptyTitle="No content available"
        emptyDescription="Content will be automatically generated and managed through your configured flows."
        emptyActions={emptyActions}
        emptyIcon={<FileText className="h-8 w-8 text-muted-foreground" />}
        searchPlaceholder="Search content..."
        tableActions={tableActions}
      />
    </PageLayout>
  );
}
