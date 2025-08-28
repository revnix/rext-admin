import {
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  FolderOpen,
  Plus,
  Upload,
} from "lucide-react";
import { PageLayout } from "@/components/page-layout";
import { PlaceholderPage } from "@/components/placeholder-page";
import { Button } from "@/components/ui/button";

export default function ContentPage() {
  const breadcrumbs = [{ label: "Library", href: "#" }, { label: "Content" }];

  const stats = [
    { title: "Total Content", value: "156", icon: FileText },
    { title: "Published", value: "142", icon: CheckCircle },
    { title: "Draft", value: "11", icon: Clock },
    { title: "Archived", value: "3", icon: AlertCircle },
  ];

  const columns = [
    { key: "title", header: "Title", width: "300px" },
    { key: "type", header: "Type", width: "120px" },
    { key: "status", header: "Status", width: "100px" },
    { key: "author", header: "Author", width: "150px" },
    { key: "lastModified", header: "Last Modified", width: "150px" },
    { key: "created", header: "Created", width: "120px" },
  ];

  const emptyActions = [
    { label: "Create Content", icon: <Plus className="h-4 w-4" /> },
    {
      label: "Upload Media",
      variant: "outline" as const,
      icon: <Upload className="h-4 w-4" />,
    },
    {
      label: "Browse Library",
      variant: "outline" as const,
      icon: <FolderOpen className="h-4 w-4" />,
    },
  ];

  const tableActions = (
    <>
      <Button variant="outline">
        <Upload className="h-4 w-4 mr-2" />
        Upload
      </Button>
      <Button>
        <Plus className="h-4 w-4 mr-2" />
        Create Content
      </Button>
    </>
  );

  return (
    <PageLayout
      title="Content"
      description="Create, manage, and organize all your content assets in one centralized location."
      breadcrumbs={breadcrumbs}
    >
      <PlaceholderPage
        stats={stats}
        columns={columns}
        emptyTitle="No content created yet"
        emptyDescription="Start building your content library by creating your first piece of content or uploading media assets."
        emptyActions={emptyActions}
        searchPlaceholder="Search content..."
        tableActions={tableActions}
      />
    </PageLayout>
  );
}
