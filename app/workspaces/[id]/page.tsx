"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Brain,
  FileText,
  Globe,
  Link,
  MoreHorizontal,
  Settings,
  Upload,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import { AllKnowledgeList } from "@/components/knowledge/all-knowledge-list";
import { FileKnowledgeList } from "@/components/knowledge/file-knowledge-list";
import { GlobalKnowledgeSearch } from "@/components/knowledge/global-knowledge-search";
import { KnowledgeAnalytics } from "@/components/knowledge/knowledge-analytics";
import { TextKnowledgeList } from "@/components/knowledge/text-knowledge-list";
import { WebKnowledgeList } from "@/components/knowledge/web-knowledge-list";
import { PageLayout } from "@/components/page-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePageTitle } from "@/hooks/use-page-title";
import { workspaceApiService } from "@/services";
import {
  useKnowledgeFilterStore,
  useUnifiedKnowledgeStore,
} from "@/stores/knowledge-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import type { Workspace } from "@/types/workspace";

// Knowledge Summary Card Component
function KnowledgeSummaryCard({ workspace }: { workspace: Workspace }) {
  const webCount = workspace.websites?.length || 0;
  const fileCount = workspace.knowledge_files?.length || 0;
  const textCount = workspace.text_knowledge?.length || 0;
  const totalCount = webCount + fileCount + textCount;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Knowledge Base</CardTitle>
        <CardDescription>
          Content and information stored in this workspace
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-3 border rounded-lg">
            <Globe className="h-8 w-8 text-blue-500" />
            <div>
              <div className="text-2xl font-bold">{webCount}</div>
              <div className="text-sm text-muted-foreground">Web URLs</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 border rounded-lg">
            <Upload className="h-8 w-8 text-green-500" />
            <div>
              <div className="text-2xl font-bold">{fileCount}</div>
              <div className="text-sm text-muted-foreground">Files</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 border rounded-lg">
            <FileText className="h-8 w-8 text-purple-500" />
            <div>
              <div className="text-2xl font-bold">{textCount}</div>
              <div className="text-sm text-muted-foreground">Text Notes</div>
            </div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Total Knowledge Items
            </span>
            <span className="text-lg font-semibold">{totalCount}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Brand Voice Card Component
function BrandVoiceCard({ workspace }: { workspace: Workspace }) {
  const brandVoice = workspace.brand_voice;

  if (!brandVoice) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Brain className="h-8 w-8 text-muted-foreground mb-2" />
          <h3 className="font-medium mb-1">No Brand Voice Extracted</h3>
          <p className="text-sm text-muted-foreground text-center">
            Brand voice will be automatically extracted when you add content to
            this workspace.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Brand Voice
        </CardTitle>
        <CardDescription>
          AI-extracted brand characteristics and positioning
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {brandVoice.about && (
          <div>
            <h4 className="font-medium mb-2">About</h4>
            <p className="text-sm text-muted-foreground">{brandVoice.about}</p>
          </div>
        )}

        {brandVoice.selling_position && (
          <div>
            <h4 className="font-medium mb-2">Selling Position</h4>
            <p className="text-sm text-muted-foreground">
              {brandVoice.selling_position}
            </p>
          </div>
        )}

        {brandVoice.target_audience &&
          brandVoice.target_audience.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Target Audience</h4>
              <div className="flex flex-wrap gap-2">
                {brandVoice.target_audience.map((audience, index) => (
                  <Badge
                    key={`audience-${index}-${audience}`}
                    variant="secondary"
                  >
                    {audience}
                  </Badge>
                ))}
              </div>
            </div>
          )}

        {brandVoice.brand_voice && brandVoice.brand_voice.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Voice Characteristics</h4>
            <div className="flex flex-wrap gap-2">
              {brandVoice.brand_voice.map((voice, index) => (
                <Badge key={`voice-${index}-${voice}`} variant="outline">
                  {voice}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {brandVoice.competitors && brandVoice.competitors.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Competitors</h4>
            <div className="text-sm text-muted-foreground">
              {brandVoice.competitors.join(", ")}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Workspace Details Card Component
function WorkspaceDetailsCard({ workspace }: { workspace: Workspace }) {
  const openWorkspaceForm = useWorkspaceStore(
    (state) => state.openWorkspaceForm,
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{workspace.title}</CardTitle>
            {workspace.description && (
              <CardDescription className="mt-1">
                {workspace.description}
              </CardDescription>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => openWorkspaceForm("edit", workspace)}
              >
                <Settings className="h-4 w-4 mr-2" />
                Edit Workspace
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                Delete Workspace
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <a
              href={workspace.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              {workspace.url}
            </a>
          </div>
          <div className="text-xs text-muted-foreground">
            Created {new Date(workspace.created_at).toLocaleDateString()}
            {workspace.updated_at && (
              <span>
                {" "}
                • Updated {new Date(workspace.updated_at).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Loading Skeleton Component
function WorkspaceDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-full" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-32" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {Array.from({ length: 3 }, (_, _i) => (
                <div
                  key={`skeleton-stat-${crypto.randomUUID()}`}
                  className="p-3 border rounded-lg"
                >
                  <Skeleton className="h-8 w-8 mb-2" />
                  <Skeleton className="h-6 w-8 mb-1" />
                  <Skeleton className="h-3 w-16" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-18" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function WorkspaceDetailPage() {
  const params = useParams();
  const workspaceId = params.id as string;

  const setCurrentWorkspace = useWorkspaceStore(
    (state) => state.setCurrentWorkspace,
  );
  const setCurrentWorkspaceId = useUnifiedKnowledgeStore(
    (state) => state.setCurrentWorkspace,
  );
  const resetKnowledgeFilters = useKnowledgeFilterStore(
    (state) => state.resetFilters,
  );

  // Query workspace data
  const {
    data: workspaceResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["workspace", workspaceId],
    queryFn: () => workspaceApiService.getWorkspace(workspaceId),
    enabled: !!workspaceId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const workspace = workspaceResponse?.workspace;

  // Update stores when workspace data changes
  useEffect(() => {
    if (workspace) {
      setCurrentWorkspace(workspace);
      setCurrentWorkspaceId(workspaceId);
      resetKnowledgeFilters();
    }
  }, [
    workspace,
    workspaceId,
    setCurrentWorkspace,
    setCurrentWorkspaceId,
    resetKnowledgeFilters,
  ]);

  // Update page title
  usePageTitle(
    workspace ? `${workspace.title} - Workspace` : "Workspace",
    workspace
      ? `Manage knowledge, content, and brand voice for ${workspace.title}`
      : "Loading workspace details...",
  );

  const breadcrumbs = [
    { label: "Workspaces", href: "/workspaces" },
    { label: workspace?.title || "Loading..." },
  ];

  if (error) {
    return (
      <PageLayout
        title="Workspace Not Found"
        description="The requested workspace could not be found"
        breadcrumbs={breadcrumbs}
      >
        <Card className="border-destructive">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-destructive mb-4">Failed to load workspace</p>
            <Button variant="outline" onClick={() => refetch()}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title={workspace?.title || "Loading..."}
      description={
        workspace?.description ||
        "Manage knowledge, content, and brand voice for this workspace"
      }
      breadcrumbs={breadcrumbs}
      actions={
        workspace && (
          <>
            <Button variant="outline" onClick={() => refetch()}>
              Refresh
            </Button>
            <Button>
              <Link className="h-4 w-4 mr-2" />
              Add Content
            </Button>
          </>
        )
      }
    >
      <div className="space-y-6">
        {isLoading ? (
          <WorkspaceDetailSkeleton />
        ) : workspace ? (
          <>
            {/* Overview Tab */}
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="search">Search</TabsTrigger>
                <TabsTrigger value="knowledge">Knowledge</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* Workspace Details & Knowledge Summary */}
                <div className="grid gap-6 md:grid-cols-2">
                  <WorkspaceDetailsCard workspace={workspace} />
                  <KnowledgeSummaryCard workspace={workspace} />
                </div>

                <KnowledgeAnalytics
                  workspaceId={workspaceId}
                  workspace={workspace}
                />

                {/* Brand Voice */}
                <BrandVoiceCard workspace={workspace} />
              </TabsContent>

              <TabsContent value="search" className="space-y-6">
                <GlobalKnowledgeSearch workspaceId={workspaceId} />
              </TabsContent>

              <TabsContent value="knowledge" className="space-y-6">
                <Tabs defaultValue="all" className="space-y-6">
                  <TabsList>
                    <TabsTrigger value="all">All Knowledge</TabsTrigger>
                    <TabsTrigger value="web">Web Knowledge</TabsTrigger>
                    <TabsTrigger value="files">Files</TabsTrigger>
                    <TabsTrigger value="text">Text Notes</TabsTrigger>
                  </TabsList>

                  <TabsContent value="all">
                    <AllKnowledgeList
                      workspaceId={workspaceId}
                      workspace={workspace}
                    />
                  </TabsContent>

                  <TabsContent value="web">
                    <WebKnowledgeList
                      workspaceId={workspaceId}
                      workspace={workspace}
                    />
                  </TabsContent>

                  <TabsContent value="files">
                    <FileKnowledgeList
                      workspaceId={workspaceId}
                      workspace={workspace}
                    />
                  </TabsContent>

                  <TabsContent value="text">
                    <TextKnowledgeList
                      workspaceId={workspaceId}
                      workspace={workspace}
                    />
                  </TabsContent>
                </Tabs>
              </TabsContent>

              <TabsContent value="settings" className="space-y-6">
                <div className="text-center py-12">
                  <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    Workspace Settings
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Advanced workspace configuration options
                  </p>
                  <Button variant="outline">Coming Soon</Button>
                </div>
              </TabsContent>
            </Tabs>
          </>
        ) : null}
      </div>
    </PageLayout>
  );
}
