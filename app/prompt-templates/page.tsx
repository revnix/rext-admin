"use client";

import {
  Copy,
  Edit3,
  Eye,
  MessageSquare,
  Play,
  Plus,
  Settings,
  Trash2,
} from "lucide-react";

import Link from "next/link";
import { DataTable } from "@/components/data-table";
import { PageLayout } from "@/components/page-layout";
import { Button } from "@/components/ui/button";
import type { PromptTemplateData, RowAction } from "@/types/data-table";

export default function PromptTemplatesPage() {
  const breadcrumbs = [
    { label: "Configuration", href: "#" },
    { label: "AI & Prompts", href: "/ai-prompts" },
    { label: "Prompt Templates" },
  ];

  // Prompt templates data matching PromptTemplateData interface
  const promptTemplatesData: PromptTemplateData[] = [
    {
      id: "1",
      name: "Blog Post Generator",
      category: "Content Creation",
      description:
        "Creates engaging blog posts from topic and target audience inputs",
      variables: ["topic", "audience", "tone", "length"],
      usage: 247,
      lastUsed: "2024-01-22 15:30",
      created: "2024-01-01 09:00",
      author: "Sarah Johnson",
      version: "v2.1",
      content:
        "Write a comprehensive blog post about {topic} for {audience}. Use a {tone} tone and aim for approximately {length} words. Include relevant examples and actionable insights.",
    },
    {
      id: "2",
      name: "Social Media Post Creator",
      category: "Social Media",
      description:
        "Generates platform-specific social media posts with hashtags",
      variables: ["platform", "topic", "audience", "cta"],
      usage: 156,
      lastUsed: "2024-01-22 12:45",
      created: "2024-01-05 14:20",
      author: "Mike Chen",
      version: "v1.3",
      content:
        "Create an engaging {platform} post about {topic} for {audience}. Include relevant hashtags and end with a strong {cta}. Keep it concise and engaging.",
    },
    {
      id: "3",
      name: "Email Subject Line Generator",
      category: "Email Marketing",
      description:
        "Creates compelling email subject lines to improve open rates",
      variables: ["product", "benefit", "urgency", "personalization"],
      usage: 89,
      lastUsed: "2024-01-21 16:20",
      created: "2024-01-10 11:30",
      author: "Emma Davis",
      version: "v1.1",
      content:
        "Generate 5 compelling email subject lines for {product} that highlight {benefit}. Use {urgency} level urgency and {personalization} personalization approach.",
    },
    {
      id: "4",
      name: "Product Description Writer",
      category: "E-commerce",
      description:
        "Writes detailed product descriptions that convert visitors to customers",
      variables: ["product_name", "features", "benefits", "target_audience"],
      usage: 67,
      lastUsed: "2024-01-20 10:15",
      created: "2024-01-12 16:45",
      author: "David Park",
      version: "v1.0",
      content:
        "Write a compelling product description for {product_name}. Focus on these key features: {features}. Emphasize these benefits: {benefits}. Target audience: {target_audience}.",
    },
    {
      id: "5",
      name: "Code Documentation Generator",
      category: "Development",
      description:
        "Creates comprehensive documentation for code functions and APIs",
      variables: ["function_name", "parameters", "return_type", "purpose"],
      usage: 43,
      lastUsed: "2024-01-19 14:30",
      created: "2024-01-15 09:20",
      author: "Carlos Mendez",
      version: "v1.2",
      content:
        "Generate detailed documentation for the function {function_name}. Parameters: {parameters}. Returns: {return_type}. Purpose: {purpose}. Include usage examples and edge cases.",
    },
    {
      id: "6",
      name: "Meeting Summary Template",
      category: "Business",
      description:
        "Summarizes meeting notes into actionable items and key decisions",
      variables: ["meeting_type", "attendees", "duration", "agenda_items"],
      usage: 34,
      lastUsed: "2024-01-18 11:45",
      created: "2024-01-08 13:15",
      author: "Lisa Wong",
      version: "v1.0",
      content:
        "Summarize this {meeting_type} meeting with {attendees} that lasted {duration}. Cover these agenda items: {agenda_items}. Extract key decisions, action items, and next steps.",
    },
  ];

  const columns = [
    { key: "name", header: "Template Name", width: "250px" },
    { key: "category", header: "Category", width: "150px" },
    { key: "author", header: "Author", width: "120px" },
    { key: "version", header: "Version", width: "80px" },
    { key: "usage", header: "Usage", width: "80px" },
    { key: "lastUsed", header: "Last Used", width: "130px" },
    { key: "created", header: "Created", width: "130px" },
  ];

  const emptyActions = [
    {
      label: "Create Template",
      icon: <Plus className="h-4 w-4" />,
      href: "/prompt-templates/create",
    },
  ];

  const tableActions = (
    <div className="flex items-center gap-2">
      <Button asChild variant="default">
        <Link href="/prompt-templates/create">
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </Link>
      </Button>
      <Button asChild variant="outline">
        <Link href="/prompt-templates/settings">
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Link>
      </Button>
    </div>
  );

  const handleRowClick = (row: PromptTemplateData) => {
    console.log("Clicked template:", row);
  };

  const rowActions: RowAction<PromptTemplateData>[] = [
    {
      label: "View Template",
      icon: <Eye className="h-4 w-4" />,
      onClick: (row: PromptTemplateData) =>
        console.log("View template:", row.name),
    },
    {
      label: "Edit Template",
      icon: <Edit3 className="h-4 w-4" />,
      onClick: (row: PromptTemplateData) =>
        console.log("Edit template:", row.name),
    },
    {
      label: "Use Template",
      icon: <Play className="h-4 w-4" />,
      onClick: (row: PromptTemplateData) =>
        console.log("Use template:", row.name),
    },
    {
      label: "Duplicate",
      icon: <Copy className="h-4 w-4" />,
      onClick: (row: PromptTemplateData) =>
        console.log("Duplicate template:", row.name),
    },
    {
      label: "Delete",
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (row: PromptTemplateData) =>
        console.log("Delete template:", row.name),
      variant: "destructive" as const,
    },
  ];

  return (
    <PageLayout
      title="Prompt Templates"
      description="Create, manage, and organize reusable prompt templates to improve AI interaction consistency and effectiveness."
      breadcrumbs={breadcrumbs}
    >
      <DataTable<PromptTemplateData>
        columns={columns}
        data={promptTemplatesData}
        emptyTitle="No prompt templates created"
        emptyDescription="Build your first prompt template to improve AI interaction consistency and effectiveness."
        emptyActions={emptyActions}
        emptyIcon={<MessageSquare className="h-8 w-8 text-muted-foreground" />}
        searchPlaceholder="Search templates by name, category, creator..."
        actions={tableActions}
        onRowClick={handleRowClick}
        rowActions={rowActions}
        pageSize={10}
        searchFields={["name", "category", "author", "variables"]}
      />
    </PageLayout>
  );
}
