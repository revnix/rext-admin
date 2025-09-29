"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Copy,
  FileText,
  Globe,
  Grid3X3,
  Link,
  List,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  Upload,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageLayout } from "@/components/page-layout";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { usePageTitle } from "@/hooks/use-page-title";
import { workspaceApiService } from "@/services";
import {
  useWorkspaceList,
  useWorkspaceStore,
  useWorkspaceUIPreferences,
} from "@/stores/workspace-store";
import type { Workspace, WorkspaceViewMode } from "@/types/workspace";

// Workspace card component for grid view
function WorkspaceCard({ workspace }: { workspace: Workspace }) {
  const router = useRouter();
  const setCurrentWorkspace = useWorkspaceStore(
    (state) => state.setCurrentWorkspace,
  );
  const openWorkspaceForm = useWorkspaceStore(
    (state) => state.openWorkspaceForm,
  );
  const duplicateWorkspace = useWorkspaceStore(
    (state) => state.duplicateWorkspace,
  );
  const loadingStates = useWorkspaceStore((state) => state.loadingStates);

  const handleSelectWorkspace = () => {
    setCurrentWorkspace(workspace);
    router.push(`/workspaces/${workspace.id}`);
  };

  const handleEditWorkspace = (e: React.MouseEvent) => {
    e.stopPropagation();
    openWorkspaceForm("edit", workspace);
  };

  const handleDuplicateWorkspace = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const duplicatedWorkspace = await duplicateWorkspace(workspace.id);
      toast.success(
        `Workspace "${duplicatedWorkspace.title}" created successfully`,
      );

      // Navigate to the duplicated workspace
      router.push(`/workspaces/${duplicatedWorkspace.id}`);
    } catch (error) {
      console.error("Failed to duplicate workspace:", error);
      toast.error("Failed to duplicate workspace. Please try again.");
    }
  };

  const knowledgeCount =
    (workspace.websites?.length || 0) +
    (workspace.knowledge_files?.length || 0) +
    (workspace.text_knowledge?.length || 0);

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={handleSelectWorkspace}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg truncate">
              {workspace.title}
            </CardTitle>
            {workspace.description && (
              <CardDescription className="line-clamp-2 mt-1">
                {workspace.description}
              </CardDescription>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleEditWorkspace}>
                <Settings className="h-4 w-4 mr-2" />
                Edit Workspace
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDuplicateWorkspace}
                disabled={loadingStates.duplicating}
              >
                <Copy className="h-4 w-4 mr-2" />
                {loadingStates.duplicating
                  ? "Duplicating..."
                  : "Duplicate Workspace"}
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
        <div className="space-y-4">
          {/* URL */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Globe className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{workspace.url}</span>
          </div>

          {/* Knowledge stats */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              <span>{knowledgeCount} items</span>
            </div>
            {workspace.brand_voice && (
              <Badge variant="secondary" className="text-xs">
                Brand Voice
              </Badge>
            )}
          </div>

          {/* Timestamps */}
          <div className="text-xs text-muted-foreground">
            Created {new Date(workspace.created_at).toLocaleDateString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Workspace list item for list view
function WorkspaceListItem({ workspace }: { workspace: Workspace }) {
  const router = useRouter();
  const setCurrentWorkspace = useWorkspaceStore(
    (state) => state.setCurrentWorkspace,
  );
  const openWorkspaceForm = useWorkspaceStore(
    (state) => state.openWorkspaceForm,
  );
  const duplicateWorkspace = useWorkspaceStore(
    (state) => state.duplicateWorkspace,
  );
  const loadingStates = useWorkspaceStore((state) => state.loadingStates);

  const handleSelectWorkspace = () => {
    setCurrentWorkspace(workspace);
    router.push(`/workspaces/${workspace.id}`);
  };

  const handleEditWorkspace = (e: React.MouseEvent) => {
    e.stopPropagation();
    openWorkspaceForm("edit", workspace);
  };

  const handleDuplicateWorkspace = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const duplicatedWorkspace = await duplicateWorkspace(workspace.id);
      toast.success(
        `Workspace "${duplicatedWorkspace.title}" created successfully`,
      );

      // Navigate to the duplicated workspace
      router.push(`/workspaces/${duplicatedWorkspace.id}`);
    } catch (error) {
      console.error("Failed to duplicate workspace:", error);
      toast.error("Failed to duplicate workspace. Please try again.");
    }
  };

  const knowledgeCount =
    (workspace.websites?.length || 0) +
    (workspace.knowledge_files?.length || 0) +
    (workspace.text_knowledge?.length || 0);

  return (
    <button
      type="button"
      className="flex items-center gap-4 p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors text-left w-full"
      onClick={handleSelectWorkspace}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-medium truncate">{workspace.title}</h3>
          {workspace.brand_voice && (
            <Badge variant="secondary" className="text-xs">
              Brand Voice
            </Badge>
          )}
        </div>
        {workspace.description && (
          <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
            {workspace.description}
          </p>
        )}
        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Globe className="h-3 w-3" />
            <span className="truncate max-w-[200px]">{workspace.url}</span>
          </div>
          <div className="flex items-center gap-1">
            <FileText className="h-3 w-3" />
            <span>{knowledgeCount} items</span>
          </div>
          <span>
            Created {new Date(workspace.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleEditWorkspace}>
            <Settings className="h-4 w-4 mr-2" />
            Edit Workspace
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleDuplicateWorkspace}
            disabled={loadingStates.duplicating}
          >
            <Copy className="h-4 w-4 mr-2" />
            {loadingStates.duplicating
              ? "Duplicating..."
              : "Duplicate Workspace"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive">
            Delete Workspace
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </button>
  );
}

// Empty state component
function EmptyWorkspaceState() {
  const openWorkspaceForm = useWorkspaceStore(
    (state) => state.openWorkspaceForm,
  );

  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Users className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-2">No workspaces yet</h3>
        <p className="text-muted-foreground text-center mb-6 max-w-md">
          Create your first workspace to start organizing your knowledge,
          content, and brand voice.
        </p>
        <Button onClick={() => openWorkspaceForm("create")}>
          <Plus className="h-4 w-4 mr-2" />
          Create Workspace
        </Button>
      </CardContent>
    </Card>
  );
}

// Loading skeleton for workspace list
function WorkspaceListSkeleton({ viewMode }: { viewMode: WorkspaceViewMode }) {
  if (viewMode === "grid") {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, () => (
          <Card key={crypto.randomUUID()}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {Array.from({ length: 6 }, () => (
        <div
          key={crypto.randomUUID()}
          className="flex items-center gap-4 p-4 border rounded-lg"
        >
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-8 w-8" />
        </div>
      ))}
    </div>
  );
}

export default function WorkspacePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const { viewMode, filters } = useWorkspaceUIPreferences();
  const { setViewMode, updateFilters, openWorkspaceForm } = useWorkspaceStore();
  const workspaceList = useWorkspaceList();

  // Update page title
  usePageTitle(
    "Workspaces",
    "Manage your workspaces, organize knowledge, and configure brand voice settings for AI-powered content creation.",
  );

  // Query workspaces from API
  const {
    data: workspacesResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["workspaces"],
    queryFn: () => workspaceApiService.listWorkspaces(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Update local store when API data changes
  const setWorkspaceList = useWorkspaceStore((state) => state.setWorkspaceList);
  useEffect(() => {
    if (workspacesResponse?.workspaces) {
      setWorkspaceList(workspacesResponse.workspaces);
    }
  }, [workspacesResponse, setWorkspaceList]);

  // Filter workspaces based on search and filters
  const filteredWorkspaces = workspaceList.filter((workspace) => {
    if (
      searchQuery &&
      !workspace.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !workspace.description
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) &&
      !workspace.url.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  // Sort workspaces
  const sortedWorkspaces = [...filteredWorkspaces].sort((a, b) => {
    const { sortBy, sortOrder } = filters;
    if (!sortBy) return 0;

    let comparison = 0;
    switch (sortBy) {
      case "title":
        comparison = a.title.localeCompare(b.title);
        break;
      case "created_at":
        comparison =
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        break;
      case "updated_at":
        comparison =
          new Date(a.updated_at || a.created_at).getTime() -
          new Date(b.updated_at || b.created_at).getTime();
        break;
      default:
        return 0;
    }

    return sortOrder === "desc" ? -comparison : comparison;
  });

  const breadcrumbs = [{ label: "Workspaces" }];

  return (
    <PageLayout
      title="Workspaces"
      description="Manage your workspaces and organize your knowledge base"
      breadcrumbs={breadcrumbs}
      actions={
        <>
          <Button variant="outline" onClick={() => refetch()}>
            Refresh
          </Button>
          <Button onClick={() => openWorkspaceForm("create")}>
            <Plus className="h-4 w-4 mr-2" />
            New Workspace
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* Search and Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search workspaces..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="border rounded-md p-1">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="px-2"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="px-2"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>

            {/* Sort Options */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Sort
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() =>
                    updateFilters({ sortBy: "title", sortOrder: "asc" })
                  }
                >
                  Name A-Z
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    updateFilters({ sortBy: "title", sortOrder: "desc" })
                  }
                >
                  Name Z-A
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() =>
                    updateFilters({ sortBy: "created_at", sortOrder: "desc" })
                  }
                >
                  Newest First
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    updateFilters({ sortBy: "created_at", sortOrder: "asc" })
                  }
                >
                  Oldest First
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() =>
                    updateFilters({ sortBy: "updated_at", sortOrder: "desc" })
                  }
                >
                  Recently Updated
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Workspace List */}
        {isLoading ? (
          <WorkspaceListSkeleton viewMode={viewMode} />
        ) : error ? (
          <Card className="border-destructive">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-destructive mb-4">Failed to load workspaces</p>
              <Button variant="outline" onClick={() => refetch()}>
                Try Again
              </Button>
            </CardContent>
          </Card>
        ) : sortedWorkspaces.length === 0 ? (
          searchQuery ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Search className="h-8 w-8 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  No workspaces found
                </h3>
                <p className="text-muted-foreground text-center mb-4">
                  No workspaces match your search "{searchQuery}"
                </p>
                <Button variant="outline" onClick={() => setSearchQuery("")}>
                  Clear Search
                </Button>
              </CardContent>
            </Card>
          ) : (
            <EmptyWorkspaceState />
          )
        ) : (
          <div
            className={
              viewMode === "grid"
                ? "grid gap-4 md:grid-cols-2 lg:grid-cols-3"
                : "space-y-2"
            }
          >
            {sortedWorkspaces.map((workspace) =>
              viewMode === "grid" ? (
                <WorkspaceCard key={workspace.id} workspace={workspace} />
              ) : (
                <WorkspaceListItem key={workspace.id} workspace={workspace} />
              ),
            )}
          </div>
        )}

        {/* Quick Actions Section */}
        {sortedWorkspaces.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common workspace management tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <Button variant="outline" className="justify-start">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Workspace
                </Button>
                <Button variant="outline" className="justify-start">
                  <Upload className="h-4 w-4 mr-2" />
                  Import Knowledge
                </Button>
                <Button variant="outline" className="justify-start">
                  <Link className="h-4 w-4 mr-2" />
                  Add Website
                </Button>
                <Button variant="outline" className="justify-start">
                  <Settings className="h-4 w-4 mr-2" />
                  Workspace Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PageLayout>
  );
}
