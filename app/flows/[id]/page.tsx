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
import { DetailPageWrapper } from "@/components/detail-page-wrapper";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DetailCard } from "@/components/ui/detail-card";
import {
  DetailGrid,
  DetailGridItem,
  TwoColumnGrid,
} from "@/components/ui/detail-grid";
import { SectionHeader } from "@/components/ui/section-header";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { usePageTitle } from "@/hooks/use-page-title";
import type { FlowData } from "@/types/data-table";
import type { MetadataItem, SidebarConfig } from "@/types/detail-page";

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

  // Update page title and description dynamically
  usePageTitle(
    flow?.name || "Flow Detail",
    flow
      ? `${flow.category} automation flow: ${flow.name}. ${flow.totalRuns} total runs with ${flow.successRate} success rate.`
      : "Automation flow details and management",
  );

  if (!flow) {
    return (
      <DetailPageWrapper
        title="Flow Not Found"
        breadcrumbs={[
          { label: "Automation", href: "#" },
          { label: "Flows", href: "/flows" },
          { label: "Flow Detail" },
        ]}
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
  // Build header actions for page header
  const headerActions = (
    <div className="flex items-center gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={handleRunFlow}
            disabled={flow.status === "Paused" || isRunning}
            className="gap-2"
          >
            {isRunning ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {isRunning ? "Running..." : "Run Flow"}
          </Button>
        </TooltipTrigger>
        <TooltipContent>Execute this flow immediately</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={handleToggleStatus}
            disabled={isToggling}
            variant={flow.status === "Active" ? "outline" : "default"}
            className="gap-2"
          >
            {isToggling ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : flow.status === "Active" ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {isToggling
              ? "Updating..."
              : flow.status === "Active"
                ? "Pause"
                : "Activate"}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {flow.status === "Active" ? "Pause this flow" : "Activate this flow"}
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button onClick={handleEditFlow} variant="outline" className="gap-2">
            <Edit3 className="h-4 w-4" />
            Edit
          </Button>
        </TooltipTrigger>
        <TooltipContent>Edit flow configuration</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button onClick={handleCopyFlow} variant="outline" size="sm">
            <Copy className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Copy flow</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button onClick={handleShareFlow} variant="outline" size="sm">
            <Share2 className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Share flow</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={handleDeleteFlow}
            disabled={isDeleting}
            variant="destructive"
            size="sm"
          >
            {isDeleting ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>Delete this flow</TooltipContent>
      </Tooltip>
    </div>
  );

  // Parse success rate for progress bar
  const successRateValue = parseFloat(flow.successRate.replace("%", ""));

  // Build new flexible sidebar configuration
  const sidebarConfig: SidebarConfig = {
    cards: [
      // Success Rate Card (using score type)
      {
        type: "score",
        config: {
          score: successRateValue,
          title: "Success Rate",
          description: "Flow Performance Metric",
          variant:
            successRateValue >= 95
              ? "success"
              : successRateValue >= 80
                ? "default"
                : "warning",
        },
      },
      // Performance Stats (using stats type)
      {
        type: "stats",
        config: {
          title: "Performance Overview",
          items: [
            {
              label: "Total Executions",
              value: flow.totalRuns.toLocaleString(),
              icon: <Activity className="h-4 w-4" />,
              highlight: true,
            },
            {
              label: "Avg Runtime",
              value: flow.avgRunTime,
            },
            {
              label: "Last Execution",
              value: new Date(flow.lastRun).toLocaleDateString(),
            },
          ],
        },
      },
      // Configuration Details (using stats type)
      {
        type: "stats",
        config: {
          title: "Configuration",
          items: [
            {
              label: "Status",
              value: (
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
              ),
              highlight: true,
            },
            {
              label: "Trigger",
              value: <Badge variant="outline">{flow.trigger}</Badge>,
            },
            ...(flow.configuration.schedule
              ? [
                  {
                    label: "Schedule",
                    value: flow.configuration.schedule,
                  },
                ]
              : []),
            {
              label: "Retry Attempts",
              value: flow.configuration.retryAttempts.toString(),
            },
            {
              label: "Timeout",
              value: flow.configuration.timeout,
            },
          ],
        },
      },
    ],
    order: ["cards", "metadata", "quickActions"],
  };

  // Quick actions for the sidebar
  const flowQuickActions = [
    {
      label: "Configure Flow",
      icon: <Settings className="h-4 w-4" />,
      onClick: () => console.log("Configure Flow"),
      variant: "outline" as const,
    },
    {
      label: "View Logs",
      icon: <Activity className="h-4 w-4" />,
      onClick: () => console.log("View Logs"),
      variant: "outline" as const,
    },
    {
      label: "Analytics",
      icon: <TrendingUp className="h-4 w-4" />,
      onClick: () => console.log("Analytics"),
      variant: "outline" as const,
    },
  ];

  return (
    <DetailPageWrapper
      title={flow.name}
      breadcrumbs={breadcrumbs}
      status={flow.status}
      statusVariant={
        flow.status === "Active"
          ? "default"
          : flow.status === "Paused"
            ? "secondary"
            : "outline"
      }
      metadata={metadata}
      headerActions={headerActions}
      sidebarConfig={sidebarConfig}
      quickActions={flowQuickActions}
    >
      {/* Main Content */}
      <div className="space-y-8">
        {/* Flow Description */}
        <DetailCard variant="default" gradient>
          <SectionHeader
            title="Flow Overview"
            icon={<Workflow className="w-5 h-5" />}
            variant="default"
            className="mb-4"
          />
          <p className="text-base leading-relaxed text-muted-foreground">
            {flow.description}
          </p>
        </DetailCard>

        {/* Flow Steps and Recent Runs - Two Column Layout */}
        <TwoColumnGrid gap="lg">
          {/* Flow Steps */}
          <DetailCard variant="success">
            <SectionHeader
              title="Flow Steps"
              icon={<Settings className="w-5 h-5" />}
              variant="default"
              className="mb-4"
            />
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
                      variant={
                        step.status === "Active" ? "default" : "secondary"
                      }
                      className="text-xs"
                    >
                      {step.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </DetailCard>

          {/* Recent Runs */}
          <DetailCard variant="warning">
            <SectionHeader
              title="Recent Executions"
              icon={<Activity className="w-5 h-5" />}
              variant="default"
              className="mb-4"
            />
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
                        Duration: {run.duration} • Processed:{" "}
                        {run.itemsProcessed} items
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
          </DetailCard>
        </TwoColumnGrid>

        {/* Configuration Details with Custom Grid */}
        <DetailCard variant="info">
          <SectionHeader
            title="Configuration Details"
            icon={<Settings className="w-5 h-5" />}
            variant="default"
            className="mb-6"
          />
          <DetailGrid columns={4} gap="md" responsive={{ sm: 1, md: 2, lg: 4 }}>
            {/* Input Sources */}
            <DetailGridItem span={2}>
              <div className="space-y-3">
                <h4 className="font-medium text-base">Input Sources</h4>
                <div className="space-y-2">
                  {flow.configuration.inputSources.map((source) => (
                    <div key={source} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <span className="text-sm">{source}</span>
                    </div>
                  ))}
                </div>
              </div>
            </DetailGridItem>

            {/* Output Destinations */}
            <DetailGridItem span={2}>
              <div className="space-y-3">
                <h4 className="font-medium text-base">Output Destinations</h4>
                <div className="space-y-2">
                  {flow.configuration.outputDestinations.map((destination) => (
                    <div key={destination} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span className="text-sm">{destination}</span>
                    </div>
                  ))}
                </div>
              </div>
            </DetailGridItem>

            {/* Additional Configuration - Single column items */}
            <DetailGridItem span={1}>
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Retry Attempts</h4>
                <div className="text-2xl font-bold text-purple-600">
                  {flow.configuration.retryAttempts}
                </div>
                <div className="text-xs text-muted-foreground">attempts</div>
              </div>
            </DetailGridItem>

            <DetailGridItem span={1}>
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Timeout</h4>
                <div className="text-2xl font-bold text-orange-600">
                  {flow.configuration.timeout}
                </div>
                <div className="text-xs text-muted-foreground">
                  max duration
                </div>
              </div>
            </DetailGridItem>

            {/* Schedule - Full width if exists */}
            {flow.configuration.schedule && (
              <DetailGridItem span={4}>
                <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200/50 dark:border-purple-800/50">
                  <h4 className="font-medium mb-2">Schedule Configuration</h4>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-purple-600" />
                    <span className="text-sm">
                      {flow.configuration.schedule}
                    </span>
                  </div>
                </div>
              </DetailGridItem>
            )}
          </DetailGrid>
        </DetailCard>
      </div>
    </DetailPageWrapper>
  );
}
