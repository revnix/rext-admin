"use client";

import {
  Archive,
  Brain,
  Eye,
  Plus,
  Settings,
  Star,
  Trash2,
} from "lucide-react";

import Link from "next/link";
import { DataTable } from "@/components/data-table";
import { PageLayout } from "@/components/page-layout";
import { Button } from "@/components/ui/button";
import type { MemoryData, RowAction } from "@/types/data-table";

export default function MemoriesPage() {
  const breadcrumbs = [
    { label: "Intelligence", href: "#" },
    { label: "AI Memory", href: "/ai-memory" },
    { label: "Memories" },
  ];

  // Comprehensive memories data
  const memoriesData: MemoryData[] = [
    {
      id: "1",
      title: "Brand Voice Guidelines for Tech Content",
      content:
        "The brand voice should be professional yet approachable, using technical terms sparingly and always explaining complex concepts. Avoid jargon like 'leverage', 'synergy', 'disrupt'. Prefer active voice and conversational tone. Use data-driven insights and practical examples.",
      type: "Style Memory",
      source: "AI Blog Post Generator",
      created: "2024-01-15 10:30",
      lastAccessed: "2024-01-22 15:30",
      accessCount: 247,
      tags: ["brand voice", "content style", "writing guidelines"],
      importance: "High",
      category: "Brand Guidelines",
    },
    {
      id: "2",
      title: "LinkedIn Audience Engagement Patterns",
      content:
        "Posts with data visualizations get 3x more engagement. Best posting times are Tuesday-Thursday 9-11am EST. Questions in posts increase comments by 180%. Professional achievements and behind-the-scenes content perform well.",
      type: "Analytics Memory",
      source: "Social Media Analytics Flow",
      created: "2024-01-18 14:20",
      lastAccessed: "2024-01-22 11:45",
      accessCount: 156,
      tags: ["linkedin", "engagement", "analytics", "social media"],
      importance: "High",
      category: "Social Media",
    },
    {
      id: "3",
      title: "Customer Pain Points - SaaS Onboarding",
      content:
        "Common onboarding issues: 1) Complex initial setup (78% of feedback), 2) Unclear navigation (65%), 3) Missing tutorials (52%). Users prefer video tutorials over text. Progressive disclosure works better than feature dumps.",
      type: "Customer Insight",
      source: "Customer Feedback Analyzer",
      created: "2024-01-20 09:15",
      lastAccessed: "2024-01-22 16:20",
      accessCount: 89,
      tags: ["customer feedback", "saas", "onboarding", "ux"],
      importance: "High",
      category: "Product Insights",
    },
    {
      id: "4",
      title: "Competitor Analysis - Pricing Strategies",
      content:
        "Competitor A uses freemium with 14-day premium trial. Competitor B focuses on annual discounts (40% off). Market trend moving toward usage-based pricing. Price anchoring with enterprise tier showing best conversion.",
      type: "Market Intelligence",
      source: "Competitive Research Flow",
      created: "2024-01-21 11:30",
      lastAccessed: "2024-01-22 08:45",
      accessCount: 43,
      tags: ["competitive analysis", "pricing", "market research"],
      importance: "Medium",
      category: "Market Intelligence",
    },
    {
      id: "5",
      title: "Email Campaign Optimization Rules",
      content:
        "Subject lines with numbers increase open rates by 45%. Personalization beyond first name (company, role) improves CTR. Tuesday sends perform 23% better than Monday. Keep preview text under 90 characters for mobile.",
      type: "Campaign Memory",
      source: "Email Marketing Analytics",
      created: "2024-01-19 16:45",
      lastAccessed: "2024-01-21 13:20",
      accessCount: 134,
      tags: ["email marketing", "optimization", "campaigns"],
      importance: "Medium",
      category: "Marketing",
    },
    {
      id: "6",
      title: "Code Review Best Practices",
      content:
        "Focus on logic over style (linting handles formatting). Check for security vulnerabilities first. Suggest alternatives rather than just pointing out problems. Limit review to 400 lines max for optimal attention.",
      type: "Process Memory",
      source: "Development Team Feedback",
      created: "2024-01-17 12:00",
      lastAccessed: "2024-01-20 10:15",
      accessCount: 67,
      tags: ["code review", "development", "best practices"],
      importance: "Medium",
      category: "Development",
    },
    {
      id: "7",
      title: "Content Performance by Format",
      content:
        "How-to guides: 3.2x avg engagement. Case studies: 2.8x. Listicles: 2.1x. Video content gets 5x more shares but requires more resources. Infographics work well for complex data visualization.",
      type: "Performance Memory",
      source: "Content Analytics Dashboard",
      created: "2024-01-16 08:30",
      lastAccessed: "2024-01-19 14:45",
      accessCount: 98,
      tags: ["content performance", "formats", "analytics"],
      importance: "High",
      category: "Content Strategy",
    },
  ];

  const columns = [
    { key: "title", header: "Memory Title", width: "250px" },
    { key: "category", header: "Category", width: "150px" },
    { key: "type", header: "Type", width: "130px" },
    { key: "importance", header: "Importance", width: "110px" },
    { key: "source", header: "Source", width: "180px" },
    { key: "accessCount", header: "Usage", width: "80px" },
    { key: "lastAccessed", header: "Last Used", width: "130px" },
    { key: "created", header: "Created", width: "130px" },
  ];

  const emptyActions = [
    {
      label: "Create Memory",
      icon: <Plus className="h-4 w-4" />,
      href: "/memories/create",
    },
  ];

  const tableActions = (
    <div className="flex items-center gap-2">
      <Button asChild variant="default">
        <Link href="/memories/create">
          <Plus className="h-4 w-4 mr-2" />
          Create Memory
        </Link>
      </Button>
      <Button asChild variant="outline">
        <Link href="/memories/settings">
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Link>
      </Button>
    </div>
  );

  const handleRowClick = (row: MemoryData) => {
    console.log("Clicked memory:", row);
  };

  const rowActions: RowAction<MemoryData>[] = [
    {
      label: "View Details",
      icon: <Eye className="h-4 w-4" />,
      onClick: (row: MemoryData) => console.log("View memory:", row.title),
    },
    {
      label: "Mark Important",
      icon: <Star className="h-4 w-4" />,
      onClick: (row: MemoryData) => console.log("Mark important:", row.title),
    },
    {
      label: "Archive",
      icon: <Archive className="h-4 w-4" />,
      onClick: (row: MemoryData) => console.log("Archive memory:", row.title),
    },
    {
      label: "Delete",
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (row: MemoryData) => console.log("Delete memory:", row.title),
      variant: "destructive" as const,
    },
  ];

  return (
    <PageLayout
      title="Memories"
      description="View and manage auto-generated memories from your flow executions and AI interactions. Approve or reject memories to control AI learning."
      breadcrumbs={breadcrumbs}
    >
      <DataTable<MemoryData>
        columns={columns}
        data={memoriesData}
        emptyTitle="No memories generated yet"
        emptyDescription="Memories will be automatically generated and stored when you run flows that process information and create contextual insights."
        emptyActions={emptyActions}
        emptyIcon={<Brain className="h-8 w-8 text-muted-foreground" />}
        searchPlaceholder="Search memories by title, category, type, tags..."
        actions={tableActions}
        onRowClick={handleRowClick}
        rowActions={rowActions}
        pageSize={10}
        searchFields={["title", "category", "type", "source", "tags"]}
      />
    </PageLayout>
  );
}
