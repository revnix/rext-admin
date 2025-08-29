"use client";

import {
  Bot,
  CheckCircle,
  Copy,
  Edit2,
  Eye,
  Pause,
  Play,
  Plus,
  Settings,
  TrendingUp,
  Trash2,
  Zap,
} from "lucide-react";
import { PageLayout } from "@/components/page-layout";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ModelsPage() {
  const breadcrumbs = [
    { label: "Configuration", href: "#" },
    { label: "AI & Prompts", href: "/ai-prompts" },
    { label: "Models" },
  ];

  // Comprehensive AI models data
  const modelsData = [
    {
      id: "1",
      name: "GPT-4 Turbo",
      displayName: "gpt-4-1106-preview",
      provider: "OpenAI",
      type: "Chat",
      status: "Active",
      apiKey: "sk-...ABC123",
      maxTokens: 128000,
      contextWindow: "128K tokens",
      temperature: 0.7,
      topP: 1.0,
      frequencyPenalty: 0,
      presencePenalty: 0,
      usage: "2.3M tokens",
      monthlyCost: "$156.78",
      costPerToken: "$0.01/1K",
      requestsToday: 1247,
      avgLatency: "1.2s",
      successRate: "98.5%",
      capabilities: ["Text Generation", "Code", "Analysis", "Reasoning"],
      description:
        "Most capable model for complex tasks requiring advanced reasoning",
      configuredBy: "Sarah Johnson",
      lastUsed: "2024-01-22 16:45",
      updated: "2024-01-20 10:30",
      created: "2024-01-01 09:00",
    },
    {
      id: "2",
      name: "Claude 3 Sonnet",
      displayName: "claude-3-sonnet-20240229",
      provider: "Anthropic",
      type: "Chat",
      status: "Active",
      apiKey: "sk-ant-...XYZ789",
      maxTokens: 200000,
      contextWindow: "200K tokens",
      temperature: 0.7,
      topP: 0.9,
      frequencyPenalty: 0,
      presencePenalty: 0,
      usage: "1.8M tokens",
      monthlyCost: "$124.45",
      costPerToken: "$0.003/1K",
      requestsToday: 892,
      avgLatency: "0.9s",
      successRate: "99.2%",
      capabilities: ["Text Generation", "Analysis", "Writing", "Coding"],
      description:
        "Balanced model for high-quality content generation and analysis",
      configuredBy: "Mike Chen",
      lastUsed: "2024-01-22 16:30",
      updated: "2024-01-18 14:20",
      created: "2023-12-15 11:15",
    },
    {
      id: "3",
      name: "GPT-3.5 Turbo",
      displayName: "gpt-3.5-turbo-0125",
      provider: "OpenAI",
      type: "Chat",
      status: "Active",
      apiKey: "sk-...DEF456",
      maxTokens: 16385,
      contextWindow: "16K tokens",
      temperature: 0.8,
      topP: 1.0,
      frequencyPenalty: 0.1,
      presencePenalty: 0,
      usage: "5.7M tokens",
      monthlyCost: "$45.23",
      costPerToken: "$0.0005/1K",
      requestsToday: 3421,
      avgLatency: "0.7s",
      successRate: "97.8%",
      capabilities: ["Text Generation", "Conversation", "Basic Coding"],
      description:
        "Fast and cost-effective model for everyday content generation",
      configuredBy: "Alex Rivera",
      lastUsed: "2024-01-22 16:50",
      updated: "2024-01-15 09:45",
      created: "2023-11-10 08:30",
    },
    {
      id: "4",
      name: "Claude 3 Haiku",
      displayName: "claude-3-haiku-20240307",
      provider: "Anthropic",
      type: "Chat",
      status: "Active",
      apiKey: "sk-ant-...PQR321",
      maxTokens: 200000,
      contextWindow: "200K tokens",
      temperature: 0.6,
      topP: 0.9,
      frequencyPenalty: 0,
      presencePenalty: 0,
      usage: "4.2M tokens",
      monthlyCost: "$31.67",
      costPerToken: "$0.00025/1K",
      requestsToday: 2156,
      avgLatency: "0.4s",
      successRate: "99.1%",
      capabilities: ["Fast Generation", "Summarization", "Simple Tasks"],
      description: "Fastest model optimized for speed and efficiency",
      configuredBy: "Emma Davis",
      lastUsed: "2024-01-22 16:55",
      updated: "2024-01-22 12:00",
      created: "2024-01-05 14:20",
    },
    {
      id: "5",
      name: "DALL-E 3",
      displayName: "dall-e-3",
      provider: "OpenAI",
      type: "Image",
      status: "Active",
      apiKey: "sk-...GHI789",
      maxTokens: null,
      contextWindow: "N/A",
      temperature: null,
      topP: null,
      frequencyPenalty: null,
      presencePenalty: null,
      usage: "342 images",
      monthlyCost: "$68.40",
      costPerToken: "$0.04/image",
      requestsToday: 23,
      avgLatency: "8.5s",
      successRate: "96.7%",
      capabilities: ["Image Generation", "Visual Content", "Creative Design"],
      description: "Advanced image generation for visual content creation",
      configuredBy: "David Park",
      lastUsed: "2024-01-22 15:20",
      updated: "2024-01-10 16:30",
      created: "2023-12-20 10:45",
    },
    {
      id: "6",
      name: "GPT-4 Vision",
      displayName: "gpt-4-vision-preview",
      provider: "OpenAI",
      type: "Multimodal",
      status: "Paused",
      apiKey: "sk-...JKL012",
      maxTokens: 4096,
      contextWindow: "128K tokens",
      temperature: 0.7,
      topP: 1.0,
      frequencyPenalty: 0,
      presencePenalty: 0,
      usage: "456K tokens",
      monthlyCost: "$67.89",
      costPerToken: "$0.01/1K",
      requestsToday: 0,
      avgLatency: "2.1s",
      successRate: "94.3%",
      capabilities: ["Vision Analysis", "Image Description", "Visual QA"],
      description: "Multimodal model for image understanding and analysis",
      configuredBy: "Lisa Wong",
      lastUsed: "2024-01-20 11:30",
      updated: "2024-01-19 08:15",
      created: "2024-01-08 13:45",
    },
    {
      id: "7",
      name: "Gemini Pro",
      displayName: "gemini-pro",
      provider: "Google",
      type: "Chat",
      status: "Testing",
      apiKey: "AIza...MNO345",
      maxTokens: 30720,
      contextWindow: "30K tokens",
      temperature: 0.9,
      topP: 0.8,
      frequencyPenalty: null,
      presencePenalty: null,
      usage: "127K tokens",
      monthlyCost: "$12.45",
      costPerToken: "$0.0005/1K",
      requestsToday: 45,
      avgLatency: "1.1s",
      successRate: "92.1%",
      capabilities: ["Text Generation", "Code", "Multimodal"],
      description: "Google's multimodal AI model for diverse content tasks",
      configuredBy: "Carlos Mendez",
      lastUsed: "2024-01-22 14:10",
      updated: "2024-01-22 09:30",
      created: "2024-01-18 15:00",
    },
    {
      id: "8",
      name: "Mistral Large",
      displayName: "mistral-large-latest",
      provider: "Mistral AI",
      type: "Chat",
      status: "Inactive",
      apiKey: "mk-...STU678",
      maxTokens: 32000,
      contextWindow: "32K tokens",
      temperature: 0.7,
      topP: 1.0,
      frequencyPenalty: 0,
      presencePenalty: 0,
      usage: "0 tokens",
      monthlyCost: "$0.00",
      costPerToken: "$0.008/1K",
      requestsToday: 0,
      avgLatency: "N/A",
      successRate: "N/A",
      capabilities: ["Text Generation", "Code", "Reasoning", "Multilingual"],
      description: "High-performance European AI model for advanced tasks",
      configuredBy: "Jennifer Taylor",
      lastUsed: "Never",
      updated: "2024-01-21 16:45",
      created: "2024-01-21 16:45",
    },
  ];

  const columns = [
    { key: "name", header: "Model Name", width: "200px" },
    { key: "provider", header: "Provider", width: "120px" },
    { key: "type", header: "Type", width: "100px" },
    { key: "status", header: "Status", width: "100px" },
    { key: "usage", header: "Monthly Usage", width: "130px" },
    { key: "monthlyCost", header: "Cost", width: "100px" },
    { key: "successRate", header: "Success Rate", width: "110px" },
    { key: "updated", header: "Updated", width: "120px" },
  ];

  const emptyActions = [
    {
      label: "Add Model",
      icon: <Plus className="h-4 w-4" />,
      href: "/models/add",
    },
  ];

  const tableActions = (
    <Button asChild>
      <Link href="/models/add">
        <Plus className="h-4 w-4 mr-2" />
        Add Model
      </Link>
    </Button>
  );

  // Row click handler
  const handleRowClick = (row: Record<string, any>) => {
    console.log("Viewing model:", row.name);
    // In a real app, you'd navigate to `/models/${row.id}`
  };

  // Custom row actions specific to AI models
  const rowActions = [
    {
      label: "View Details",
      icon: <Eye className="h-4 w-4" />,
      onClick: (row: Record<string, any>) =>
        console.log("View model:", row.name),
    },
    {
      label: "Configure",
      icon: <Settings className="h-4 w-4" />,
      onClick: (row: Record<string, any>) =>
        console.log("Configure model:", row.name),
    },
    {
      label: "Test Model",
      icon: <Zap className="h-4 w-4" />,
      onClick: (row: Record<string, any>) =>
        console.log("Test model:", row.name),
    },
    {
      label: "View Analytics",
      icon: <TrendingUp className="h-4 w-4" />,
      onClick: (row: Record<string, any>) =>
        console.log("View analytics:", row.name),
    },
    {
      label: "Duplicate Config",
      icon: <Copy className="h-4 w-4" />,
      onClick: (row: Record<string, any>) =>
        console.log("Duplicate model:", row.name),
    },
    {
      label: "Edit Model",
      icon: <Edit2 className="h-4 w-4" />,
      onClick: (row: Record<string, any>) =>
        console.log("Edit model:", row.name),
    },
    {
      label: "Pause/Resume",
      icon: <Pause className="h-4 w-4" />,
      onClick: (row: Record<string, any>) =>
        console.log(
          row.status === "Paused" ? "Resume" : "Pause",
          "model:",
          row.name,
        ),
    },
    {
      label: "Remove Model",
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (row: Record<string, any>) =>
        console.log("Remove model:", row.name),
      variant: "destructive" as const,
    },
  ];

  return (
    <PageLayout
      title="AI Models"
      description="Configure and manage AI models, monitor performance, and optimize usage for your applications."
      breadcrumbs={breadcrumbs}
    >
      <DataTable
        columns={columns}
        data={modelsData}
        emptyTitle="No models configured"
        emptyDescription="Start by adding your first AI model or importing an existing configuration."
        emptyActions={emptyActions}
        emptyIcon={<Bot className="h-8 w-8 text-muted-foreground" />}
        searchPlaceholder="Search models by name, provider, type, status..."
        actions={tableActions}
        onRowClick={handleRowClick}
        rowActions={rowActions}
        pageSize={10}
        searchFields={["name", "provider", "type", "status", "configuredBy"]}
      />
    </PageLayout>
  );
}
