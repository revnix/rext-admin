"use client";

import {
  AlertTriangle,
  Copy,
  Edit2,
  Eye,
  Play,
  Plus,
  Settings,
  Trash2,
  Zap,
} from "lucide-react";
import { DataTable, type RowAction } from "@/components/data-table";
import { PageLayout } from "@/components/page-layout";
import { Button } from "@/components/ui/button";
import type { RuleData } from "@/types/data-table";

export default function RulesPage() {
  const breadcrumbs = [
    { label: "Configuration", href: "#" },
    { label: "Knowledge", href: "/knowledge" },
    { label: "Rules" },
  ];

  // Comprehensive rules data - content generation policies and automation
  const rulesData = [
    {
      id: "1",
      name: "Content Quality Gate",
      description:
        "Ensures all generated content meets minimum quality standards before publishing",
      category: "Quality Control",
      type: "Validation Rule",
      status: "Active",
      priority: "Critical",
      trigger: "Before Content Publish",
      conditions: [
        "Word count >= 300 words",
        "Readability score >= 60",
        "No grammar errors detected",
        "SEO score >= 70",
      ],
      actions: [
        "Block publishing if criteria not met",
        "Send notification to reviewer",
        "Log quality metrics",
      ],
      executions: 1247,
      successRate: "94%",
      lastRun: "2024-01-22 16:45",
      lastResult: "Passed",
      createdBy: "Sarah Johnson",
      created: "2024-01-01 10:00",
      lastModified: "2024-01-20 14:30",
      flows: ["AI Blog Post Generator", "Newsletter Content Creator"],
      tags: ["quality", "validation", "publishing"],
    },
    {
      id: "2",
      name: "Brand Voice Compliance",
      description:
        "Validates content adheres to established brand voice and tone guidelines",
      category: "Brand Compliance",
      type: "Content Rule",
      status: "Active",
      priority: "High",
      trigger: "After Content Generation",
      conditions: [
        "Tone analysis matches brand voice (85%+ match)",
        "Forbidden words not used: ['synergy', 'leverage', 'disrupt']",
        "Professional but approachable tone maintained",
        "Technical jargon explained within 20 words",
      ],
      actions: [
        "Flag content for human review",
        "Suggest tone adjustments",
        "Update brand voice memory",
      ],
      executions: 892,
      successRate: "91%",
      lastRun: "2024-01-22 15:30",
      lastResult: "Passed",
      createdBy: "Mike Chen",
      created: "2024-01-05 09:15",
      lastModified: "2024-01-22 11:20",
      flows: ["Social Media Content Pipeline", "Product Description Generator"],
      tags: ["brand voice", "compliance", "tone"],
    },
    {
      id: "3",
      name: "SEO Optimization Enforcer",
      description:
        "Ensures all content meets SEO requirements and optimization standards",
      category: "SEO Compliance",
      type: "Optimization Rule",
      status: "Active",
      priority: "High",
      trigger: "During Content Creation",
      conditions: [
        "Primary keyword used 5-8 times",
        "Meta description 120-160 characters",
        "Headers properly structured (H1, H2, H3)",
        "Alt text for images provided",
        "Internal links >= 2 per 1000 words",
      ],
      actions: [
        "Auto-optimize content structure",
        "Generate SEO suggestions",
        "Update SEO performance metrics",
      ],
      executions: 634,
      successRate: "87%",
      lastRun: "2024-01-22 14:20",
      lastResult: "Optimized",
      createdBy: "Alex Rivera",
      created: "2024-01-08 11:30",
      lastModified: "2024-01-19 16:45",
      flows: ["AI Blog Post Generator", "SEO Content Optimizer"],
      tags: ["seo", "optimization", "keywords"],
    },
    {
      id: "4",
      name: "Customer Data Privacy Guard",
      description:
        "Prevents exposure of sensitive customer information in generated content",
      category: "Privacy & Security",
      type: "Security Rule",
      status: "Active",
      priority: "Critical",
      trigger: "Before Content Processing",
      conditions: [
        "No email addresses exposed",
        "No phone numbers revealed",
        "No customer names without consent",
        "No internal company data leaked",
        "GDPR compliance maintained",
      ],
      actions: [
        "Redact sensitive information",
        "Block content generation",
        "Alert security team",
        "Log privacy violation attempt",
      ],
      executions: 2341,
      successRate: "99.7%",
      lastRun: "2024-01-22 16:50",
      lastResult: "Passed",
      createdBy: "Jennifer Taylor",
      created: "2023-12-01 08:00",
      lastModified: "2024-01-15 13:25",
      flows: ["Customer Support Automation", "Email Marketing Campaigns"],
      tags: ["security", "privacy", "gdpr", "data protection"],
    },
    {
      id: "5",
      name: "Social Media Character Limits",
      description:
        "Enforces platform-specific character and content limits for social media posts",
      category: "Platform Compliance",
      type: "Format Rule",
      status: "Active",
      priority: "Medium",
      trigger: "Before Social Media Publish",
      conditions: [
        "Twitter: <= 280 characters per tweet",
        "LinkedIn: <= 3000 characters for posts",
        "Instagram: <= 2200 characters for captions",
        "Facebook: <= 63,206 characters (practical limit: 500)",
        "Thread count <= 15 for Twitter threads",
      ],
      actions: [
        "Auto-trim content to fit limits",
        "Split long content into multiple posts",
        "Suggest content restructuring",
        "Warn about character overflow",
      ],
      executions: 445,
      successRate: "96%",
      lastRun: "2024-01-22 13:45",
      lastResult: "Formatted",
      createdBy: "David Park",
      created: "2024-01-10 14:20",
      lastModified: "2024-01-22 09:30",
      flows: ["Social Media Content Pipeline", "Twitter Thread Storyteller"],
      tags: ["social media", "formatting", "character limits"],
    },
    {
      id: "6",
      name: "Email Deliverability Optimizer",
      description:
        "Prevents email content from triggering spam filters and improves deliverability",
      category: "Email Compliance",
      type: "Deliverability Rule",
      status: "Active",
      priority: "High",
      trigger: "Before Email Send",
      conditions: [
        "Spam score < 5.0",
        "Subject line avoids spam triggers",
        "Text-to-image ratio balanced",
        "Unsubscribe link present",
        "Authentication headers valid",
      ],
      actions: [
        "Rewrite spammy content",
        "Adjust subject line",
        "Add missing compliance elements",
        "Test deliverability score",
      ],
      executions: 312,
      successRate: "89%",
      lastRun: "2024-01-22 08:00",
      lastResult: "Optimized",
      createdBy: "Lisa Wong",
      created: "2024-01-12 16:40",
      lastModified: "2024-01-21 10:15",
      flows: ["Email Marketing Campaigns", "Newsletter Content Creator"],
      tags: ["email", "deliverability", "spam prevention"],
    },
    {
      id: "7",
      name: "Competitor Content Similarity Check",
      description:
        "Detects potential copyright issues and ensures content originality",
      category: "Legal Compliance",
      type: "Plagiarism Rule",
      status: "Active",
      priority: "High",
      trigger: "After Content Generation",
      conditions: [
        "Similarity to competitor content < 30%",
        "No direct quotes without attribution",
        "Original research and insights included",
        "Unique value proposition clear",
        "Copyright-free images only",
      ],
      actions: [
        "Flag high similarity content",
        "Suggest rewrites for originality",
        "Check image licensing",
        "Generate uniqueness report",
      ],
      executions: 178,
      successRate: "82%",
      lastRun: "2024-01-21 17:20",
      lastResult: "Original",
      createdBy: "Carlos Mendez",
      created: "2024-01-15 13:45",
      lastModified: "2024-01-21 17:20",
      flows: ["Competitive Content Analysis", "AI Blog Post Generator"],
      tags: ["plagiarism", "originality", "legal compliance"],
    },
    {
      id: "8",
      name: "Customer Sentiment Monitor",
      description:
        "Analyzes and responds to customer sentiment in support interactions",
      category: "Customer Experience",
      type: "Sentiment Rule",
      status: "Active",
      priority: "Medium",
      trigger: "During Support Response",
      conditions: [
        "Negative sentiment detected (< -0.3 score)",
        "Frustration keywords identified",
        "Escalation triggers present",
        "Response time > 24 hours",
        "Previous interaction context available",
      ],
      actions: [
        "Escalate to human agent",
        "Apply empathetic response template",
        "Offer additional compensation",
        "Flag for manager review",
      ],
      executions: 567,
      successRate: "93%",
      lastRun: "2024-01-22 16:45",
      lastResult: "De-escalated",
      createdBy: "Emma Davis",
      created: "2023-11-20 12:30",
      lastModified: "2024-01-18 14:50",
      flows: ["Customer Support Automation", "Service Desk"],
      tags: ["sentiment analysis", "customer experience", "escalation"],
    },
    {
      id: "9",
      name: "Seasonal Content Scheduler",
      description:
        "Automatically schedules content based on seasonal trends and optimal timing",
      category: "Content Strategy",
      type: "Scheduling Rule",
      status: "Paused",
      priority: "Low",
      trigger: "Content Publishing Queue",
      conditions: [
        "Holiday/seasonal content scheduled appropriately",
        "Peak engagement times considered",
        "Competitor posting patterns analyzed",
        "Audience timezone preferences factored",
        "Content calendar conflicts avoided",
      ],
      actions: [
        "Optimize posting schedule",
        "Delay inappropriate seasonal content",
        "Suggest timing improvements",
        "Update content calendar",
      ],
      executions: 89,
      successRate: "76%",
      lastRun: "2024-01-15 09:30",
      lastResult: "Scheduled",
      createdBy: "Amanda Foster",
      created: "2024-01-01 15:00",
      lastModified: "2024-01-15 09:30",
      flows: ["Seasonal Marketing Analysis", "Content Calendar"],
      tags: ["scheduling", "seasonal", "timing optimization"],
    },
    {
      id: "10",
      name: "Budget Threshold Monitor",
      description:
        "Monitors and controls AI model usage costs to stay within budget limits",
      category: "Cost Control",
      type: "Budget Rule",
      status: "Active",
      priority: "Critical",
      trigger: "Before Model API Call",
      conditions: [
        "Monthly budget utilization < 90%",
        "Daily spending < $500",
        "Cost per content piece < $5",
        "High-cost model usage justified",
        "Budget approval for overages",
      ],
      actions: [
        "Block expensive model usage",
        "Switch to cheaper alternatives",
        "Alert budget managers",
        "Generate cost reports",
      ],
      executions: 3456,
      successRate: "97%",
      lastRun: "2024-01-22 16:55",
      lastResult: "Within Budget",
      createdBy: "Marcus Johnson",
      created: "2023-12-15 10:20",
      lastModified: "2024-01-20 08:45",
      flows: ["All Content Flows", "Model Management"],
      tags: ["budget", "cost control", "spending limits"],
    },
  ];

  const columns = [
    { key: "name", header: "Rule Name", width: "250px" },
    { key: "category", header: "Category", width: "180px" },
    { key: "trigger", header: "Trigger", width: "200px" },
    { key: "status", header: "Status", width: "100px" },
    { key: "priority", header: "Priority", width: "100px" },
    { key: "successRate", header: "Success Rate", width: "110px" },
    { key: "executions", header: "Executions", width: "100px" },
    { key: "created", header: "Created", width: "120px" },
  ];

  const emptyActions = [
    {
      label: "Create Rule",
      icon: <Plus className="h-4 w-4" />,
      href: "/rules/create",
    },
  ];

  const tableActions = (
    <Button>
      <Plus className="h-4 w-4 mr-2" />
      Create Rule
    </Button>
  );

  // Row click handler
  const handleRowClick = (row: RuleData) => {
    console.log("Viewing rule:", row.name);
    // In a real app, you'd navigate to `/rules/${row.id}`
  };

  // Custom row actions specific to rules
  const rowActions: RowAction<RuleData>[] = [
    {
      label: "View Rule",
      icon: <Eye className="h-4 w-4" />,
      onClick: (row: RuleData) => console.log("View rule:", row.name),
    },
    {
      label: "Test Rule",
      icon: <Zap className="h-4 w-4" />,
      onClick: (row: RuleData) => console.log("Test rule:", row.name),
    },
    {
      label: "Edit Rule",
      icon: <Edit2 className="h-4 w-4" />,
      onClick: (row: RuleData) => console.log("Edit rule:", row.name),
    },
    {
      label: "Duplicate Rule",
      icon: <Copy className="h-4 w-4" />,
      onClick: (row: RuleData) => console.log("Duplicate rule:", row.name),
    },
    {
      label: "Configure Rule",
      icon: <Settings className="h-4 w-4" />,
      onClick: (row: RuleData) => console.log("Configure rule:", row.name),
    },
    {
      label: "Pause/Resume",
      icon: <Play className="h-4 w-4" />,
      onClick: (row: RuleData) =>
        console.log(
          row.status === "Paused" ? "Resume" : "Pause",
          "rule:",
          row.name,
        ),
    },
    {
      label: "View Logs",
      icon: <AlertTriangle className="h-4 w-4" />,
      onClick: (row: RuleData) => console.log("View logs:", row.name),
    },
    {
      label: "Delete Rule",
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (row: RuleData) => console.log("Delete rule:", row.name),
      variant: "destructive" as const,
    },
  ];

  return (
    <PageLayout
      title="Rules"
      description="Define and manage business rules, automation triggers, and conditional logic for your workflows."
      breadcrumbs={breadcrumbs}
    >
      <DataTable<RuleData>
        columns={columns}
        data={rulesData as any}
        emptyTitle="No rules created yet"
        emptyDescription="Start by creating your first business rule to automate workflows and processes."
        emptyActions={emptyActions}
        emptyIcon={<Zap className="h-8 w-8 text-muted-foreground" />}
        searchPlaceholder="Search rules by name, category, trigger, status..."
        actions={tableActions}
        onRowClick={handleRowClick}
        rowActions={rowActions}
        pageSize={10}
        searchFields={[
          "name",
          "category",
          "trigger",
          "status",
          "priority",
          "tags",
        ]}
      />
    </PageLayout>
  );
}
