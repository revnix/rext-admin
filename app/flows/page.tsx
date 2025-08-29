"use client";

import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Edit2,
  Eye,
  Play,
  Plus,
  Pause,
  RotateCcw,
  Trash2,
  User,
  Workflow,
  Zap,
} from "lucide-react";
import { PageLayout } from "@/components/page-layout";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function FlowsPage() {
  const breadcrumbs = [{ label: "Create", href: "#" }, { label: "Flows" }];

  // Comprehensive flows data with realistic scenarios
  const flowsData = [
    {
      id: "1",
      name: "AI Blog Post Generator",
      description:
        "Automated content creation for tech blog posts with SEO optimization",
      status: "Active",
      topic: "Technology & AI",
      aiModel: "GPT-4",
      contentPillar: "Thought Leadership",
      instructions:
        "Create engaging 1500-word blog posts about emerging AI technologies, include practical examples, and optimize for SEO",
      keywords: [
        "artificial intelligence",
        "machine learning",
        "automation",
        "tech trends",
      ],
      humanInLoop: true,
      triggers: "Weekly Schedule",
      lastRun: "2024-01-22 14:30",
      lastRunStatus: "Success",
      successRate: "95%",
      totalRuns: 47,
      created: "2024-01-01",
      author: "Sarah Johnson",
      tags: ["AI", "Blog", "SEO", "Weekly"],
    },
    {
      id: "2",
      name: "Social Media Content Pipeline",
      description:
        "Multi-platform social media content generation with brand consistency",
      status: "Running",
      topic: "Social Media Marketing",
      aiModel: "Claude-3",
      contentPillar: "Brand Awareness",
      instructions:
        "Generate daily social media posts for LinkedIn, Twitter, and Instagram with consistent brand voice and trending hashtags",
      keywords: ["social media", "branding", "engagement", "marketing"],
      humanInLoop: true,
      triggers: "Daily 9:00 AM",
      lastRun: "2024-01-22 09:00",
      lastRunStatus: "Success",
      successRate: "88%",
      totalRuns: 156,
      created: "2023-12-15",
      author: "Mike Chen",
      tags: ["Social", "Daily", "Multi-platform"],
    },
    {
      id: "3",
      name: "Newsletter Content Creator",
      description:
        "Weekly newsletter generation with curated industry news and insights",
      status: "Failed",
      topic: "Industry News",
      aiModel: "GPT-3.5-turbo",
      contentPillar: "Industry Updates",
      instructions:
        "Compile and summarize top 10 industry news stories, add expert commentary, format for email newsletter",
      keywords: [
        "newsletter",
        "industry news",
        "weekly digest",
        "expert analysis",
      ],
      humanInLoop: true,
      triggers: "Weekly Friday",
      lastRun: "2024-01-19 08:00",
      lastRunStatus: "Failed",
      successRate: "82%",
      totalRuns: 32,
      created: "2023-11-20",
      author: "Alex Rivera",
      tags: ["Newsletter", "Weekly", "Curated"],
    },
    {
      id: "4",
      name: "Product Description Generator",
      description:
        "E-commerce product descriptions with persuasive copywriting",
      status: "Active",
      topic: "E-commerce",
      aiModel: "GPT-4",
      contentPillar: "Product Marketing",
      instructions:
        "Create compelling product descriptions highlighting features, benefits, and emotional appeal for online store items",
      keywords: ["e-commerce", "product descriptions", "copywriting", "sales"],
      humanInLoop: false,
      triggers: "On Product Upload",
      lastRun: "2024-01-22 11:45",
      lastRunStatus: "Success",
      successRate: "92%",
      totalRuns: 284,
      created: "2023-10-10",
      author: "Emma Davis",
      tags: ["E-commerce", "Automated", "Sales"],
    },
    {
      id: "5",
      name: "YouTube Script Writer",
      description: "Video script creation for educational YouTube content",
      status: "Paused",
      topic: "Educational Content",
      aiModel: "Claude-3",
      contentPillar: "Education",
      instructions:
        "Write engaging 10-minute video scripts for educational content with hooks, clear structure, and call-to-actions",
      keywords: ["youtube", "video scripts", "education", "engagement"],
      humanInLoop: true,
      triggers: "Bi-weekly Tuesday",
      lastRun: "2024-01-16 15:20",
      lastRunStatus: "Pending Review",
      successRate: "76%",
      totalRuns: 18,
      created: "2023-12-01",
      author: "David Park",
      tags: ["YouTube", "Video", "Educational"],
    },
    {
      id: "6",
      name: "Press Release Automation",
      description:
        "Automated press release generation for company announcements",
      status: "Active",
      topic: "Corporate Communications",
      aiModel: "GPT-4",
      contentPillar: "Corporate News",
      instructions:
        "Generate professional press releases following AP style guidelines, include quotes and company boilerplate",
      keywords: ["press release", "corporate", "announcements", "media"],
      humanInLoop: true,
      triggers: "Manual Trigger",
      lastRun: "2024-01-20 16:00",
      lastRunStatus: "Success",
      successRate: "89%",
      totalRuns: 12,
      created: "2024-01-05",
      author: "Lisa Wong",
      tags: ["PR", "Corporate", "Manual"],
    },
    {
      id: "7",
      name: "Email Marketing Campaigns",
      description: "Personalized email campaigns with A/B testing optimization",
      status: "Running",
      topic: "Email Marketing",
      aiModel: "GPT-3.5-turbo",
      contentPillar: "Customer Engagement",
      instructions:
        "Create personalized email campaigns with subject line variations, segment-specific content, and clear CTAs",
      keywords: [
        "email marketing",
        "personalization",
        "campaigns",
        "conversion",
      ],
      humanInLoop: false,
      triggers: "Customer Action",
      lastRun: "2024-01-22 13:15",
      lastRunStatus: "Success",
      successRate: "84%",
      totalRuns: 567,
      created: "2023-09-15",
      author: "Carlos Mendez",
      tags: ["Email", "Automated", "Personalized"],
    },
    {
      id: "8",
      name: "SEO Content Optimizer",
      description:
        "Content optimization for search engine rankings and readability",
      status: "Active",
      topic: "SEO Optimization",
      aiModel: "Claude-3",
      contentPillar: "SEO Strategy",
      instructions:
        "Analyze and optimize content for target keywords, improve readability scores, and enhance meta descriptions",
      keywords: [
        "SEO",
        "content optimization",
        "search rankings",
        "readability",
      ],
      humanInLoop: true,
      triggers: "Content Publish",
      lastRun: "2024-01-22 10:30",
      lastRunStatus: "Success",
      successRate: "91%",
      totalRuns: 203,
      created: "2023-08-20",
      author: "Jennifer Taylor",
      tags: ["SEO", "Optimization", "Automated"],
    },
    {
      id: "9",
      name: "Customer Support Responses",
      description:
        "AI-powered customer support response generation with tone matching",
      status: "Failed",
      topic: "Customer Support",
      aiModel: "GPT-4",
      contentPillar: "Customer Service",
      instructions:
        "Generate empathetic and helpful customer support responses matching company tone, include relevant solutions",
      keywords: ["customer support", "responses", "empathy", "solutions"],
      humanInLoop: true,
      triggers: "Support Ticket",
      lastRun: "2024-01-22 07:45",
      lastRunStatus: "Failed",
      successRate: "73%",
      totalRuns: 432,
      created: "2023-07-10",
      author: "Zoe Martinez",
      tags: ["Support", "Customer Service", "AI"],
    },
    {
      id: "10",
      name: "Podcast Show Notes Generator",
      description:
        "Automated show notes and transcript summaries for podcast episodes",
      status: "Active",
      topic: "Podcast Content",
      aiModel: "GPT-4",
      contentPillar: "Content Repurposing",
      instructions:
        "Create detailed show notes from podcast transcripts, include timestamps, key points, and guest information",
      keywords: ["podcast", "show notes", "transcripts", "summaries"],
      humanInLoop: false,
      triggers: "Episode Upload",
      lastRun: "2024-01-21 20:15",
      lastRunStatus: "Success",
      successRate: "96%",
      totalRuns: 89,
      created: "2023-11-05",
      author: "Robert Kim",
      tags: ["Podcast", "Automated", "Transcription"],
    },
    {
      id: "11",
      name: "Content Translation Pipeline",
      description:
        "Multi-language content translation with cultural adaptation",
      status: "Paused",
      topic: "Localization",
      aiModel: "Claude-3",
      contentPillar: "Global Content",
      instructions:
        "Translate content to Spanish, French, and German while adapting cultural references and maintaining brand voice",
      keywords: [
        "translation",
        "localization",
        "multilingual",
        "cultural adaptation",
      ],
      humanInLoop: true,
      triggers: "Content Approval",
      lastRun: "2024-01-18 14:20",
      lastRunStatus: "Pending Review",
      successRate: "87%",
      totalRuns: 45,
      created: "2023-10-25",
      author: "Amanda Foster",
      tags: ["Translation", "Global", "Multi-language"],
    },
    {
      id: "12",
      name: "Social Proof Content Creator",
      description: "Customer testimonial and case study content generation",
      status: "Active",
      topic: "Social Proof",
      aiModel: "GPT-4",
      contentPillar: "Trust Building",
      instructions:
        "Transform customer feedback into compelling testimonials and detailed case studies with measurable results",
      keywords: [
        "testimonials",
        "case studies",
        "social proof",
        "customer success",
      ],
      humanInLoop: true,
      triggers: "Customer Milestone",
      lastRun: "2024-01-21 11:00",
      lastRunStatus: "Success",
      successRate: "94%",
      totalRuns: 67,
      created: "2023-12-10",
      author: "Marcus Johnson",
      tags: ["Testimonials", "Case Studies", "Success"],
    },
  ];

  const columns = [
    { key: "name", header: "Flow Name", width: "300px" },
    { key: "status", header: "Status", width: "120px" },
    { key: "aiModel", header: "AI Model", width: "120px" },
    { key: "triggers", header: "Triggers", width: "150px" },
    { key: "successRate", header: "Success Rate", width: "120px" },
    { key: "lastRun", header: "Last Run", width: "150px" },
    { key: "author", header: "Author", width: "150px" },
    { key: "created", header: "Created", width: "120px" },
  ];

  const emptyActions = [
    {
      label: "Create Flow",
      icon: <Plus className="h-4 w-4" />,
      href: "/flows/create",
    },
  ];

  const tableActions = (
    <Button asChild>
      <Link href="/flows/create">
        <Plus className="h-4 w-4 mr-2" />
        Create Flow
      </Link>
    </Button>
  );

  // Row click handler
  const handleRowClick = (row: Record<string, any>) => {
    console.log("Navigating to flow:", row.name);
    // In a real app, you'd navigate to `/flows/${row.id}`
  };

  // Custom row actions specific to flows
  const rowActions = [
    {
      label: "View Details",
      icon: <Eye className="h-4 w-4" />,
      onClick: (row: Record<string, any>) =>
        console.log("View flow:", row.name),
    },
    {
      label: "Run Flow",
      icon: <Play className="h-4 w-4" />,
      onClick: (row: Record<string, any>) =>
        console.log("Running flow:", row.name),
    },
    {
      label: "Edit Flow",
      icon: <Edit2 className="h-4 w-4" />,
      onClick: (row: Record<string, any>) =>
        console.log("Edit flow:", row.name),
    },
    {
      label: "Pause/Resume",
      icon: <Pause className="h-4 w-4" />,
      onClick: (row: Record<string, any>) =>
        console.log(
          row.status === "Paused" ? "Resuming" : "Pausing",
          "flow:",
          row.name,
        ),
    },
    {
      label: "Duplicate Flow",
      icon: <RotateCcw className="h-4 w-4" />,
      onClick: (row: Record<string, any>) =>
        console.log("Duplicate flow:", row.name),
    },
    {
      label: "Delete Flow",
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (row: Record<string, any>) =>
        console.log("Delete flow:", row.name),
      variant: "destructive" as const,
    },
  ];

  return (
    <PageLayout
      title="Flows"
      description="Create and manage automated workflows to streamline your processes and boost productivity."
      breadcrumbs={breadcrumbs}
    >
      <DataTable
        columns={columns}
        data={flowsData}
        emptyTitle="No flows created yet"
        emptyDescription="Get started by creating your first automated workflow or importing a template."
        emptyActions={emptyActions}
        emptyIcon={<Workflow className="h-8 w-8 text-muted-foreground" />}
        searchPlaceholder="Search flows by name, AI model, author, status..."
        actions={tableActions}
        onRowClick={handleRowClick}
        rowActions={rowActions}
        pageSize={10}
        searchFields={[
          "name",
          "aiModel",
          "author",
          "status",
          "topic",
          "triggers",
        ]}
      />
    </PageLayout>
  );
}
