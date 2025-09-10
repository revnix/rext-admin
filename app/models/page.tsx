"use client";

import { Bot, Eye, Play, Plus, Settings, Trash2 } from "lucide-react";

import Link from "next/link";
import { DataTable } from "@/components/data-table";
import { PageLayout } from "@/components/page-layout";
import { Button } from "@/components/ui/button";
import type { ModelData, RowAction } from "@/types/data-table";

export default function ModelsPage() {
  const breadcrumbs = [
    { label: "Configuration", href: "#" },
    { label: "AI & Prompts", href: "/ai-prompts" },
    { label: "Models" },
  ];

  // Comprehensive AI models data
  const modelsData: ModelData[] = [
    {
      id: "1",
      name: "GPT-4 Turbo",
      provider: "OpenAI",
      type: "Chat",
      status: "Active",
      version: "gpt-4-1106-preview",
      lastUsed: "2024-01-22 16:45",
      totalUsage: 2300000,
      avgResponseTime: "1.2s",
      costPerUse: "$0.01/1K",
      capabilities: ["Text Generation", "Code", "Analysis", "Reasoning"],
      description:
        "Most capable model for complex tasks requiring advanced reasoning",
    },
    {
      id: "2",
      name: "Claude 3 Sonnet",
      provider: "Anthropic",
      type: "Chat",
      status: "Active",
      version: "claude-3-sonnet-20240229",
      lastUsed: "2024-01-22 14:20",
      totalUsage: 1800000,
      avgResponseTime: "0.9s",
      costPerUse: "$0.03/1K",
      capabilities: ["Text Generation", "Analysis", "Creative Writing"],
      description: "Balanced model for creative and analytical tasks",
    },
    {
      id: "3",
      name: "GPT-3.5 Turbo",
      provider: "OpenAI",
      type: "Chat",
      status: "Active",
      version: "gpt-3.5-turbo-0125",
      lastUsed: "2024-01-22 15:30",
      totalUsage: 5600000,
      avgResponseTime: "0.8s",
      costPerUse: "$0.002/1K",
      capabilities: ["Text Generation", "Conversation"],
      description: "Fast and efficient model for general conversations",
    },
    {
      id: "4",
      name: "DALL-E 3",
      provider: "OpenAI",
      type: "Image",
      status: "Active",
      version: "dall-e-3",
      lastUsed: "2024-01-22 11:15",
      totalUsage: 450,
      avgResponseTime: "8.5s",
      costPerUse: "$0.04/image",
      capabilities: ["Image Generation", "Art Creation"],
      description: "Advanced image generation model for creative content",
    },
    {
      id: "5",
      name: "Whisper",
      provider: "OpenAI",
      type: "Audio",
      status: "Inactive",
      version: "whisper-1",
      lastUsed: "2024-01-20 09:45",
      totalUsage: 120,
      avgResponseTime: "3.2s",
      costPerUse: "$0.006/minute",
      capabilities: ["Speech Recognition", "Audio Transcription"],
      description: "Speech-to-text model for audio processing",
    },
    {
      id: "6",
      name: "Gemini Pro",
      provider: "Google",
      type: "Chat",
      status: "Active",
      version: "gemini-pro",
      lastUsed: "2024-01-22 12:00",
      totalUsage: 890000,
      avgResponseTime: "1.1s",
      costPerUse: "$0.0005/1K",
      capabilities: ["Text Generation", "Reasoning", "Code"],
      description:
        "Google's advanced language model with strong reasoning capabilities",
    },
    {
      id: "7",
      name: "Claude 3 Haiku",
      provider: "Anthropic",
      type: "Chat",
      status: "Active",
      version: "claude-3-haiku-20240307",
      lastUsed: "2024-01-22 13:45",
      totalUsage: 3200000,
      avgResponseTime: "0.6s",
      costPerUse: "$0.00025/1K",
      capabilities: ["Text Generation", "Fast Processing"],
      description: "Fast and efficient model for quick tasks",
    },
    {
      id: "8",
      name: "Mistral Large",
      provider: "Mistral AI",
      type: "Chat",
      status: "Testing",
      version: "mistral-large-latest",
      lastUsed: "2024-01-21 16:30",
      totalUsage: 150000,
      avgResponseTime: "1.0s",
      costPerUse: "$0.008/1K",
      capabilities: ["Text Generation", "Multilingual", "Code"],
      description:
        "European language model with strong multilingual capabilities",
    },
  ];

  const columns = [
    { key: "name", header: "Model Name", width: "200px" },
    { key: "provider", header: "Provider", width: "120px" },
    { key: "type", header: "Type", width: "100px" },
    { key: "status", header: "Status", width: "100px" },
    { key: "version", header: "Version", width: "180px" },
    { key: "lastUsed", header: "Last Used", width: "130px" },
    { key: "totalUsage", header: "Total Usage", width: "120px" },
    { key: "avgResponseTime", header: "Avg Response", width: "120px" },
    { key: "costPerUse", header: "Cost Per Use", width: "120px" },
  ];

  const emptyActions = [
    {
      label: "Add Model",
      icon: <Plus className="h-4 w-4" />,
      href: "/models/add",
    },
  ];

  const tableActions = (
    <div className="flex items-center gap-2">
      <Button asChild variant="default">
        <Link href="/models/add">
          <Plus className="h-4 w-4 mr-2" />
          Add Model
        </Link>
      </Button>
      <Button asChild variant="outline">
        <Link href="/models/settings">
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Link>
      </Button>
    </div>
  );

  const handleRowClick = (row: ModelData) => {
    console.log("Clicked model:", row);
  };

  const rowActions: RowAction<ModelData>[] = [
    {
      label: "View Details",
      icon: <Eye className="h-4 w-4" />,
      onClick: (row: ModelData) => console.log("View model:", row.name),
    },
    {
      label: "Configure",
      icon: <Settings className="h-4 w-4" />,
      onClick: (row: ModelData) => console.log("Configure model:", row.name),
    },
    {
      label: "Toggle Status",
      icon: <Play className="h-4 w-4" />,
      onClick: (row: ModelData) =>
        console.log(
          row.status === "Active" ? "Pause" : "Activate",
          "model:",
          row.name,
        ),
    },
    {
      label: "Delete",
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (row: ModelData) => console.log("Delete model:", row.name),
      variant: "destructive" as const,
    },
  ];

  return (
    <PageLayout
      title="AI Models"
      description="Configure and manage your AI models for content generation, analysis, and automation."
      breadcrumbs={breadcrumbs}
    >
      <DataTable<ModelData>
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
        searchFields={["name", "provider", "type", "status"]}
      />
    </PageLayout>
  );
}
