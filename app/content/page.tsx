"use client";

import {
  Calendar,
  Copy,
  Edit3,
  Eye,
  FileText,
  Plus,
  Settings,
  Trash2,
} from "lucide-react";

import Link from "next/link";
import { DataTable } from "@/components/data-table";
import { PageLayout } from "@/components/page-layout";
import { Button } from "@/components/ui/button";
import { usePageTitle } from "@/hooks/use-page-title";
import type { ContentData, RowAction } from "@/types/data-table";

export default function ContentPage() {
  const breadcrumbs = [
    { label: "Content", href: "#" },
    { label: "Generated Content" },
  ];

  // Update page title and description
  usePageTitle(
    "Content Library",
    "Manage your published and scheduled content. View performance metrics, edit content, and organize your content pipeline.",
  );

  // Content data matching ContentData interface
  const contentData: ContentData[] = [
    {
      id: "1",
      title: "The Future of AI in Content Marketing: 2024 Trends",
      type: "Blog Post",
      contentType: "Article",
      status: "Published",
      publishedTo: "Company Blog",
      publishDate: "2024-01-22 10:00",
      scheduledDate: null,
      flowName: "AI Blog Post Generator",
      flowId: "flow_001",
      wordCount: 2847,
      readTime: "12 min read",
      engagement: {
        views: 3247,
        likes: 156,
        shares: 43,
      },
      seoScore: 89,
      author: "AI Assistant",
      humanReviewer: "Sarah Johnson",
      keywords: ["AI", "content marketing", "2024 trends", "automation"],
      platforms: ["Website", "LinkedIn"],
      lastModified: "2024-01-22 09:45",
      created: "2024-01-22 08:30",
      content:
        "The landscape of content marketing is rapidly evolving with AI at the forefront...",
    },
    {
      id: "2",
      title: "Customer Success Story: Revnix Solutions",
      type: "Case Study",
      contentType: "Case Study",
      status: "Scheduled",
      publishedTo: "",
      publishDate: null,
      scheduledDate: "2024-01-25 14:00",
      flowName: "Case Study Generator",
      flowId: "flow_003",
      wordCount: 1923,
      readTime: "8 min read",
      engagement: {
        views: 0,
        likes: 0,
        shares: 0,
      },
      seoScore: 76,
      author: "AI Assistant",
      humanReviewer: "Mike Chen",
      keywords: ["customer success", "case study", "ROI", "implementation"],
      platforms: ["Website", "Sales Materials"],
      lastModified: "2024-01-21 16:30",
      created: "2024-01-21 15:00",
      content:
        "Discover how Revnix Solutions transformed their content workflow...",
    },
    {
      id: "3",
      title: "5 LinkedIn Post Topicsfor Tech Companies",
      type: "Social Media",
      contentType: "Social Post",
      status: "Published",
      publishedTo: "LinkedIn",
      publishDate: "2024-01-21 09:00",
      scheduledDate: null,
      flowName: "LinkedIn Content Creator",
      flowId: "flow_002",
      wordCount: 456,
      readTime: "2 min read",
      engagement: {
        views: 1834,
        likes: 89,
        shares: 23,
      },
      seoScore: 65,
      author: "AI Assistant",
      humanReviewer: "David Park",
      keywords: ["LinkedIn", "B2B", "social media", "engagement"],
      platforms: ["LinkedIn"],
      lastModified: "2024-01-21 08:45",
      created: "2024-01-21 08:00",
      content:
        "Here are 5 proven LinkedIn post topics that drive engagement for tech companies...",
    },
    {
      id: "4",
      title: "Email Newsletter: Weekly AI Roundup",
      type: "Email",
      contentType: "Newsletter",
      status: "Draft",
      publishedTo: "",
      publishDate: null,
      scheduledDate: "2024-01-24 10:00",
      flowName: "Newsletter Generator",
      flowId: "flow_004",
      wordCount: 892,
      readTime: "4 min read",
      engagement: {
        views: 0,
        likes: 0,
        shares: 0,
      },
      seoScore: 0,
      author: "AI Assistant",
      humanReviewer: "Emma Davis",
      keywords: ["AI news", "newsletter", "weekly roundup", "technology"],
      platforms: ["Email"],
      lastModified: "2024-01-23 14:20",
      created: "2024-01-23 13:30",
      content: "This week's AI developments that matter to your business...",
    },
    {
      id: "5",
      title: "Product Launch Announcement",
      type: "Press Release",
      contentType: "Press Release",
      status: "Review",
      publishedTo: "",
      publishDate: null,
      scheduledDate: "2024-01-26 09:00",
      flowName: "Press Release Writer",
      flowId: "flow_005",
      wordCount: 1456,
      readTime: "6 min read",
      engagement: {
        views: 0,
        likes: 0,
        shares: 0,
      },
      seoScore: 82,
      author: "AI Assistant",
      humanReviewer: "Lisa Wong",
      keywords: ["product launch", "press release", "innovation", "technology"],
      platforms: ["Press", "Website"],
      lastModified: "2024-01-23 11:15",
      created: "2024-01-23 10:00",
      content:
        "Revolutionary AI-powered platform launches to transform content creation...",
    },
  ];

  const columns = [
    { key: "title", header: "Title", width: "300px" },
    { key: "type", header: "Type", width: "120px" },
    { key: "status", header: "Status", width: "100px" },
    { key: "publishedTo", header: "Published To", width: "120px" },
    { key: "wordCount", header: "Words", width: "80px" },
    { key: "seoScore", header: "SEO Score", width: "90px" },
    { key: "humanReviewer", header: "Reviewer", width: "120px" },
    { key: "publishDate", header: "Published", width: "130px" },
    { key: "created", header: "Created", width: "130px" },
  ];

  const emptyActions = [
    {
      label: "Create Content",
      icon: <Plus className="h-4 w-4" />,
      href: "/content/create",
    },
  ];

  const tableActions = (
    <div className="flex items-center gap-2">
      <Button asChild variant="default">
        <Link href="/content/create">
          <Plus className="h-4 w-4 mr-2" />
          Create Content
        </Link>
      </Button>
      <Button asChild variant="outline">
        <Link href="/content/settings">
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Link>
      </Button>
    </div>
  );

  const handleRowClick = (row: ContentData) => {
    console.log("Clicked content:", row);
    // Navigate to content detail page
    window.location.href = `/content/${row.id}`;
  };

  const rowActions: RowAction<ContentData>[] = [
    {
      label: "View",
      icon: <Eye className="h-4 w-4" />,
      onClick: (row: ContentData) => {
        console.log("View content:", row.title);
        window.location.href = `/content/${row.id}`;
      },
      tooltip: "View content details",
    },
    {
      label: "Edit",
      icon: <Edit3 className="h-4 w-4" />,
      onClick: (row: ContentData) => console.log("Edit content:", row.title),
      tooltip: "Edit this content",
    },
    {
      label: "Copy",
      icon: <Copy className="h-4 w-4" />,
      onClick: (row: ContentData) => console.log("Copy content:", row.title),
      tooltip: "Duplicate this content",
    },
    {
      label: "Schedule",
      icon: <Calendar className="h-4 w-4" />,
      onClick: (row: ContentData) =>
        console.log("Schedule content:", row.title),
      tooltip: "Schedule for publication",
    },
    {
      label: "Delete",
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (row: ContentData) => console.log("Delete content:", row.title),
      variant: "destructive" as const,
      requiresConfirmation: true,
      confirmationTitle: "Delete Content",
      confirmationDescription:
        "Are you sure you want to delete this content? This action cannot be undone.",
    },
  ];

  return (
    <PageLayout
      title="Generated Content"
      description="View, edit, and manage all AI-generated content across your flows and platforms."
      breadcrumbs={breadcrumbs}
    >
      <DataTable<ContentData>
        columns={columns}
        data={contentData}
        emptyTitle="No content available"
        emptyDescription="Content will be automatically generated and managed through your configured flows."
        emptyActions={emptyActions}
        emptyIcon={<FileText className="h-8 w-8 text-muted-foreground" />}
        searchPlaceholder="Search content by title, type, status, platform..."
        actions={tableActions}
        onRowClick={handleRowClick}
        rowActions={rowActions}
        pageSize={10}
        searchFields={[
          "title",
          "type",
          "status",
          "publishedTo",
          "humanReviewer",
          "keywords",
        ]}
      />
    </PageLayout>
  );
}
