"use client";

import {
  AlertCircle,
  Edit2,
  Eye,
  Lightbulb,
  Plus,
  RefreshCw,
  Trash2,
  WifiOff,
} from "lucide-react";
import Link from "next/link";
import { DataTable } from "@/components/data-table";
import { PageLayout } from "@/components/page-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import {
  CategoryDisplay,
  ContentTypeBadge,
  DateDisplay,
  PriorityBadge,
  RankingDisplay,
  ScoreDisplay,
  StatusBadge,
  TitleDisplay,
} from "@/components/ui/topic-cell-formatters";
import { useTopics } from "@/hooks/use-topics";
import type { Column, RowAction, TopicData } from "@/types/data-table";

export default function TopicsPage() {
  const breadcrumbs = [{ label: "Library", href: "#" }, { label: "Topics" }];

  // Fetch topics data using TanStack Query with enhanced states
  const {
    data: topics = [],
    status,
    error,
    refetch,
    isInitialLoading,
    isBackgroundRefetching,
  } = useTopics();

  // Log successful data loads for debugging
  if (status === "success" && topics.length > 0) {
    console.log(`Topics page: Loaded ${topics.length} topics successfully`);
  }

  // Handle retry with proper TanStack Query refetch
  const handleRetry = async () => {
    console.log("Retrying topics fetch...");
    await refetch();
  };

  const columns: Column<TopicData>[] = [
    {
      key: "name",
      header: "Topic Title",
      width: "280px",
      cell: (value, row) => <TitleDisplay value={value} row={row} />,
      searchable: true,
    },
    {
      key: "category",
      header: "Category",
      width: "120px",
      cell: (value) => <CategoryDisplay value={value} />,
      searchable: true,
    },
    {
      key: "contentType",
      header: "Content Type",
      width: "140px",
      cell: (value) => <ContentTypeBadge value={value} />,
      searchable: true,
    },
    {
      key: "status",
      header: "Status",
      width: "100px",
      cell: (value) => <StatusBadge value={value} />,
      searchable: true,
    },
    {
      key: "score",
      header: "Score",
      width: "70px",
      cell: (value) => <ScoreDisplay value={value} />,
      searchable: false,
    },
    {
      key: "priority",
      header: "Priority",
      width: "90px",
      cell: (value) => <PriorityBadge value={value} />,
      searchable: true,
    },
    {
      key: "ranking",
      header: "Rank",
      width: "60px",
      cell: (value) => <RankingDisplay value={value} />,
      searchable: false,
    },
    {
      key: "updated",
      header: "Generated",
      width: "100px",
      cell: (value) => <DateDisplay value={value} />,
      searchable: false,
    },
  ];

  const emptyActions = [
    {
      label: "Generate Topics",
      icon: <Plus className="h-4 w-4" />,
      href: "/topics/create",
    },
  ];

  const tableActions = (
    <Button asChild>
      <Link href="/topics/create">
        <Plus className="h-4 w-4 mr-2" />
        Generate Topics
      </Link>
    </Button>
  );

  // Row click handler for topics
  const handleRowClick = (row: TopicData) => {
    console.log("Viewing topic details:", row.name);
    console.log("Topic data:", {
      id: row.id,
      title: row.name,
      description: row.description,
      category: row.category,
      contentType: row.contentType,
      score: row.score,
      priority: row.priority,
      status: row.status,
      tags: row.tags,
    });
    // TODO: Navigate to topic detail page when implemented
  };

  // Row actions specific to topics
  const rowActions: RowAction<TopicData>[] = [
    {
      label: "View Details",
      icon: <Eye className="h-4 w-4" />,
      onClick: (row: TopicData) => {
        console.log("View topic details:", row);
        // TODO: Open topic details modal or page
      },
      tooltip: "View topic details",
    },
    {
      label: "Use Topic",
      icon: <Edit2 className="h-4 w-4" />,
      onClick: (row: TopicData) => {
        console.log("Using topic for content creation:", row.name);
        // TODO: Navigate to content creation with topic prefilled
      },
      tooltip: "Use this topic to create content",
    },
    {
      label: "Archive Topic",
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (row: TopicData) => {
        console.log("Archive topic:", row.name);
        // TODO: Implement archive/delete functionality
      },
      variant: "destructive" as const,
      requiresConfirmation: true,
      confirmationTitle: "Archive Topic",
      confirmationDescription:
        "Are you sure you want to archive this topic? It will be removed from the active list.",
      tooltip: "Archive this topic",
    },
  ];

  return (
    <PageLayout
      title="Topic Library"
      description="Browse AI-generated topics and transform them into compelling content. Generate new topics or explore your saved collection."
      breadcrumbs={breadcrumbs}
    >
      {/* Loading State - Enhanced with skeleton */}
      {isInitialLoading && (
        <div>
          <TableSkeleton rows={8} />
        </div>
      )}

      {/* Background refetching indicator */}
      {isBackgroundRefetching && (
        <div className="mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Refreshing topics...</span>
          </div>
        </div>
      )}

      {/* Error State - Enhanced with better context */}
      {status === "error" && (
        <Card>
          <CardContent className="flex items-center justify-center p-8">
            <div className="flex flex-col items-center gap-4 max-w-md">
              {/* Different icons based on error type */}
              {error?.message?.includes("network") ||
              error?.message?.includes("fetch") ? (
                <WifiOff className="h-8 w-8 text-destructive" />
              ) : (
                <AlertCircle className="h-8 w-8 text-destructive" />
              )}

              <div className="text-center">
                <p className="font-medium text-sm mb-2">
                  Unable to load your topics
                </p>
                <p className="text-sm text-muted-foreground mb-3">
                  {error?.message?.includes("network")
                    ? "Please check your internet connection and try again."
                    : error?.message?.includes("401") ||
                        error?.message?.includes("403")
                      ? "Authentication failed. Please refresh the page and sign in again."
                      : error?.message ||
                        "Something went wrong while loading your topics. Please try again."}
                </p>

                {/* Technical details for debugging */}
                {process.env.NODE_ENV === "development" && error?.message && (
                  <details className="text-xs text-muted-foreground mt-2">
                    <summary className="cursor-pointer hover:text-foreground">
                      Technical details
                    </summary>
                    <code className="block mt-1 p-2 bg-muted rounded text-left">
                      {error.message}
                    </code>
                  </details>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleRetry}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </Button>
                <Button
                  onClick={() => window.location.reload()}
                  variant="ghost"
                  size="sm"
                >
                  Refresh Page
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Table - only show when data is successfully loaded */}
      {status === "success" && (
        <DataTable<TopicData>
          columns={columns}
          data={topics}
          emptyTitle="No topics yet"
          emptyDescription="Generate your first collection of AI-powered topics. Use the topic builder to create engaging content topics tailored to your audience."
          emptyActions={emptyActions}
          emptyIcon={<Lightbulb className="h-8 w-8 text-muted-foreground" />}
          searchPlaceholder="Search topics by title, category, content type..."
          actions={tableActions}
          onRowClick={handleRowClick}
          rowActions={rowActions}
          pageSize={15}
          searchFields={columns
            .filter((col) => col.searchable)
            .map((col) => col.key)}
        />
      )}
    </PageLayout>
  );
}
