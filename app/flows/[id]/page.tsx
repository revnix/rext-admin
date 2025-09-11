"use client";

import {
  Activity,
  Calendar,
  Clock,
  Copy,
  Edit3,
  Pause,
  Play,
  Settings,
  Share2,
  Trash2,
  TrendingUp,
  Workflow,
  Zap,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import type {
  ActionButton,
  MetadataItem,
} from "@/components/detail-page-wrapper";
import { DetailPageWrapper } from "@/components/detail-page-wrapper";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { FlowData } from "@/types/data-table";

// Mock flow data - in real app this would come from API
const flowsData: FlowData[] = [
  {
    id: "1",
    name: "AI Blog Post Generator",
    description:
      "Generates comprehensive blog posts from topics using GPT-4 and Claude",
    status: "Active",
    trigger: "Manual",
    lastRun: "2024-01-22 15:30",
    totalRuns: 247,
    successRate: "98.8%",
    avgRunTime: "2.3 minutes",
    category: "Content Creation",
    created: "2024-01-01 09:00",
    lastModified: "2024-01-20 14:30",
  },
  {
    id: "2",
    name: "Social Media Content Pipeline",
    description:
      "Creates and schedules social media content across LinkedIn, Twitter, and Facebook",
    status: "Active",
    trigger: "Scheduled",
    lastRun: "2024-01-22 12:00",
    totalRuns: 156,
    successRate: "96.2%",
    avgRunTime: "1.8 minutes",
    category: "Social Media",
    created: "2023-12-15 10:30",
    lastModified: "2024-01-18 11:45",
  },
  {
    id: "3",
    name: "Customer Feedback Analyzer",
    description:
      "Analyzes customer feedback and extracts actionable insights using sentiment analysis",
    status: "Active",
    trigger: "Webhook",
    lastRun: "2024-01-22 16:45",
    totalRuns: 89,
    successRate: "100%",
    avgRunTime: "45 seconds",
    category: "Analytics",
    created: "2024-01-10 13:20",
    lastModified: "2024-01-22 09:15",
  },
  {
    id: "4",
    name: "Email Newsletter Generator",
    description:
      "Compiles weekly newsletter from trending topics and company updates",
    status: "Paused",
    trigger: "Scheduled",
    lastRun: "2024-01-15 10:00",
    totalRuns: 12,
    successRate: "91.7%",
    avgRunTime: "3.1 minutes",
    category: "Email Marketing",
    created: "2024-01-08 16:00",
    lastModified: "2024-01-15 10:30",
  },
];

// Extended flow data for detail view
interface FlowDetailData extends FlowData {
  steps: Array<{
    id: string;
    name: string;
    type: string;
    description: string;
    status: string;
  }>;
  recentRuns: Array<{
    id: string;
    startTime: string;
    endTime: string;
    status: string;
    duration: string;
    itemsProcessed: number;
  }>;
  configuration: {
    inputSources: string[];
    outputDestinations: string[];
    schedule?: string;
    retryAttempts: number;
    timeout: string;
  };
}

const getFlowDetail = (flowId: string): FlowDetailData | null => {
  const baseFlow = flowsData.find((f) => f.id === flowId);
  if (!baseFlow) return null;

  return {
    ...baseFlow,
    steps: [
      {
        id: "step1",
        name: "Input Validation",
        type: "Validation",
        description: "Validates incoming data and parameters",
        status: "Active",
      },
      {
        id: "step2",
        name: "AI Content Generation",
        type: "AI Processing",
        description: "Generates content using configured AI models",
        status: "Active",
      },
      {
        id: "step3",
        name: "Quality Review",
        type: "Review",
        description: "Automated quality checks and scoring",
        status: "Active",
      },
      {
        id: "step4",
        name: "Output Processing",
        type: "Processing",
        description: "Formats and prepares content for delivery",
        status: "Active",
      },
    ],
    recentRuns: [
      {
        id: "run1",
        startTime: "2024-01-22 15:30",
        endTime: "2024-01-22 15:32",
        status: "Success",
        duration: "2m 15s",
        itemsProcessed: 3,
      },
      {
        id: "run2",
        startTime: "2024-01-22 12:45",
        endTime: "2024-01-22 12:47",
        status: "Success",
        duration: "2m 02s",
        itemsProcessed: 2,
      },
      {
        id: "run3",
        startTime: "2024-01-22 09:15",
        endTime: "2024-01-22 09:17",
        status: "Success",
        duration: "2m 28s",
        itemsProcessed: 4,
      },
    ],
    configuration: {
      inputSources: ["Manual Input", "API Webhook", "Scheduled Trigger"],
      outputDestinations: ["Content Library", "WordPress", "Slack"],
      schedule:
        baseFlow.trigger === "Scheduled" ? "Daily at 9:00 AM" : undefined,
      retryAttempts: 3,
      timeout: "10 minutes",
    },
  };
};

export default function FlowDetailPage() {
  const params = useParams();
  const router = useRouter();
  const flowId = params.id as string;

  const [isRunning, setIsRunning] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  // Find the current flow
  const flow = getFlowDetail(flowId);

  if (!flow) {
    return (
      <DetailPageWrapper
        title="Flow Not Found"
        description="The requested flow could not be found"
        breadcrumbs={[
          { label: "Automation", href: "#" },
          { label: "Flows", href: "/flows" },
          { label: "Flow Detail" },
        ]}
        backUrl="/flows"
        backLabel="Back to Flows"
        error="Flow not found"
      >
        <div />
      </DetailPageWrapper>
    );
  }

  // Handle flow actions
  const handleRunFlow = async () => {
    setIsRunning(true);
    try {
      console.log("Running flow:", flow.name);
      // TODO: Implement run logic
    } catch (error) {
      console.error("Failed to run flow:", error);
    } finally {
      setIsRunning(false);
    }
  };

  const handleToggleStatus = async () => {
    setIsToggling(true);
    try {
      const newStatus = flow.status === "Active" ? "Paused" : "Active";
      console.log(
        `${newStatus === "Active" ? "Activating" : "Pausing"} flow:`,
        flow.name,
      );
      // TODO: Implement toggle logic
    } catch (error) {
      console.error("Failed to toggle flow status:", error);
    } finally {
      setIsToggling(false);
    }
  };

  const handleEditFlow = () => {
    console.log("Editing flow:", flow.name);
    // TODO: Navigate to edit page
  };

  const handleCopyFlow = () => {
    console.log("Copying flow:", flow.name);
    // TODO: Implement copy logic
  };

  const handleShareFlow = async () => {
    try {
      await navigator.share({
        title: flow.name,
        text: flow.description,
        url: window.location.href,
      });
    } catch (_error) {
      // Fallback to copy URL
      await navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleDeleteFlow = async () => {
    setIsDeleting(true);
    try {
      console.log("Deleting flow:", flow.name);
      router.push("/flows");
    } catch (error) {
      console.error("Failed to delete flow:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Build breadcrumbs
  const breadcrumbs = [
    { label: "Automation", href: "#" },
    { label: "Flows", href: "/flows" },
    { label: flow.name },
  ];

  // Build metadata for the wrapper
  const metadata: MetadataItem[] = [
    {
      label: "Category",
      value: <Badge variant="secondary">{flow.category}</Badge>,
      icon: <Workflow className="h-4 w-4" />,
    },
    {
      label: "Trigger Type",
      value: <Badge variant="outline">{flow.trigger}</Badge>,
      icon: <Zap className="h-4 w-4" />,
    },
    {
      label: "Total Runs",
      value: flow.totalRuns.toLocaleString(),
      icon: <Activity className="h-4 w-4" />,
    },
    {
      label: "Success Rate",
      value: flow.successRate,
      icon: <TrendingUp className="h-4 w-4" />,
    },
    {
      label: "Avg Runtime",
      value: flow.avgRunTime,
      icon: <Clock className="h-4 w-4" />,
    },
    {
      label: "Last Run",
      value: new Date(flow.lastRun).toLocaleDateString(),
      icon: <Calendar className="h-4 w-4" />,
    },
  ];

  // Build quick actions for sidebar - Flow specific actions
  const quickActions: ActionButton[] = [
    {
      label: isRunning ? "Running..." : "Run Flow",
      icon: isRunning ? undefined : <Play className="h-4 w-4" />,
      onClick: handleRunFlow,
      variant: "default",
      disabled: flow.status === "Paused" || isRunning,
      loading: isRunning,
      tooltip: flow.status === "Paused" ? "Flow is paused" : "Execute flow now",
    },
    {
      label: isToggling
        ? "Updating..."
        : flow.status === "Active"
          ? "Pause Flow"
          : "Activate Flow",
      icon: isToggling ? undefined : flow.status === "Active" ? (
        <Pause className="h-4 w-4" />
      ) : (
        <Play className="h-4 w-4" />
      ),
      onClick: handleToggleStatus,
      variant: flow.status === "Active" ? "outline" : "default",
      disabled: isToggling,
      loading: isToggling,
      tooltip:
        flow.status === "Active" ? "Pause this flow" : "Activate this flow",
    },
    {
      label: "Edit Flow",
      icon: <Edit3 className="h-4 w-4" />,
      onClick: handleEditFlow,
      variant: "outline",
      tooltip: "Edit flow configuration",
    },
    {
      label: "Copy Flow",
      icon: <Copy className="h-4 w-4" />,
      onClick: handleCopyFlow,
      variant: "outline",
      tooltip: "Duplicate this flow",
    },
    {
      label: "Share Flow",
      icon: <Share2 className="h-4 w-4" />,
      onClick: handleShareFlow,
      variant: "outline",
      tooltip: "Share this flow",
    },
    {
      label: isDeleting ? "Deleting..." : "Delete Flow",
      icon: isDeleting ? undefined : <Trash2 className="h-4 w-4" />,
      onClick: handleDeleteFlow,
      variant: "destructive",
      disabled: isDeleting,
      loading: isDeleting,
      tooltip: "Permanently delete this flow",
    },
  ];

  // Parse success rate for progress bar
  const successRateValue = parseFloat(flow.successRate.replace("%", ""));

  // Build sidebar content
  const sidebarContent = (
    <>
      {/* Flow Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Performance Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                Success Rate
              </span>
              <span className="text-sm font-medium">{flow.successRate}</span>
            </div>
            <Progress value={successRateValue} className="h-2" />
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              Total Executions
            </span>
            <span className="text-sm font-medium">
              {flow.totalRuns.toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Avg Runtime</span>
            <span className="text-sm font-medium">{flow.avgRunTime}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              Last Execution
            </span>
            <span className="text-sm font-medium">
              {new Date(flow.lastRun).toLocaleDateString()}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Configuration Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Status</span>
            <Badge
              variant={
                flow.status === "Active"
                  ? "default"
                  : flow.status === "Paused"
                    ? "secondary"
                    : "outline"
              }
            >
              {flow.status}
            </Badge>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Trigger</span>
            <Badge variant="outline">{flow.trigger}</Badge>
          </div>

          {flow.configuration.schedule && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Schedule</span>
              <span className="text-sm font-medium">
                {flow.configuration.schedule}
              </span>
            </div>
          )}

          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              Retry Attempts
            </span>
            <span className="text-sm font-medium">
              {flow.configuration.retryAttempts}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Timeout</span>
            <span className="text-sm font-medium">
              {flow.configuration.timeout}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Quick Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              className="flex items-center gap-2 text-sm p-2 rounded hover:bg-muted transition-colors"
            >
              <Settings className="h-4 w-4" />
              Configure Flow
            </button>
            <button
              type="button"
              className="flex items-center gap-2 text-sm p-2 rounded hover:bg-muted transition-colors"
            >
              <Activity className="h-4 w-4" />
              View Logs
            </button>
            <button
              type="button"
              className="flex items-center gap-2 text-sm p-2 rounded hover:bg-muted transition-colors"
            >
              <TrendingUp className="h-4 w-4" />
              Analytics
            </button>
          </div>
        </CardContent>
      </Card>
    </>
  );

  return (
    <DetailPageWrapper
      title={flow.name}
      subtitle={`${flow.category} • ${flow.trigger} Trigger`}
      description="Monitor, configure, and manage this automated workflow."
      breadcrumbs={breadcrumbs}
      backUrl="/flows"
      backLabel="Back to Flows"
      status={flow.status}
      statusVariant={
        flow.status === "Active"
          ? "default"
          : flow.status === "Paused"
            ? "secondary"
            : "outline"
      }
      metadata={metadata}
      quickActions={quickActions}
      sidebar={sidebarContent}
    >
      {/* Main Content */}
      <div className="space-y-8">
        {/* Flow Description */}
        <div className="bg-gradient-to-br from-blue-50/60 via-indigo-50/40 to-purple-50/60 dark:from-blue-950/30 dark:via-indigo-950/20 dark:to-purple-950/30 rounded-xl p-6 border border-blue-200/60 dark:border-blue-800/60">
          <h3 className="text-xl font-semibold text-foreground flex items-center gap-3 mb-4">
            <Workflow className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Flow Overview
          </h3>
          <p className="text-base leading-relaxed text-muted-foreground">
            {flow.description}
          </p>
        </div>

        {/* Flow Steps */}
        <div className="bg-green-50/50 dark:bg-green-950/20 rounded-xl p-6 border border-green-200/50 dark:border-green-800/50">
          <h3 className="text-xl font-semibold mb-4 text-foreground flex items-center gap-3">
            <Settings className="w-5 h-5 text-green-600 dark:text-green-400" />
            Flow Steps
          </h3>
          <div className="space-y-4">
            {flow.steps.map((step, index) => (
              <div
                key={step.id}
                className="flex items-center gap-4 p-4 bg-white dark:bg-background rounded-lg border"
              >
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">
                    {index + 1}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">{step.name}</h4>
                    <Badge variant="outline" className="text-xs">
                      {step.type}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {step.description}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <Badge
                    variant={step.status === "Active" ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {step.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Runs */}
        <div className="bg-amber-50/40 dark:bg-amber-950/20 rounded-xl p-6 border border-amber-200/60 dark:border-amber-800/60">
          <h3 className="text-xl font-semibold mb-4 text-foreground flex items-center gap-3">
            <Activity className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            Recent Executions
          </h3>
          <div className="space-y-3">
            {flow.recentRuns.map((run) => (
              <div
                key={run.id}
                className="flex items-center justify-between p-4 bg-white dark:bg-background rounded-lg border"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      run.status === "Success"
                        ? "bg-green-500"
                        : run.status === "Failed"
                          ? "bg-red-500"
                          : "bg-yellow-500"
                    }`}
                  ></div>
                  <div>
                    <div className="font-medium text-sm">
                      {new Date(run.startTime).toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Duration: {run.duration} • Processed: {run.itemsProcessed}{" "}
                      items
                    </div>
                  </div>
                </div>
                <Badge
                  variant={
                    run.status === "Success"
                      ? "default"
                      : run.status === "Failed"
                        ? "destructive"
                        : "secondary"
                  }
                  className="text-xs"
                >
                  {run.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Configuration Details */}
        <div className="bg-purple-50/30 dark:bg-purple-950/20 rounded-xl p-6 border border-purple-200/50 dark:border-purple-800/50">
          <h3 className="text-xl font-semibold mb-4 text-foreground flex items-center gap-3">
            <Settings className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            Configuration Details
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Input Sources</h4>
              <div className="space-y-2">
                {flow.configuration.inputSources.map((source) => (
                  <div key={source} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                    <span className="text-sm">{source}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-3">Output Destinations</h4>
              <div className="space-y-2">
                {flow.configuration.outputDestinations.map((destination) => (
                  <div key={destination} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                    <span className="text-sm">{destination}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DetailPageWrapper>
  );
}
