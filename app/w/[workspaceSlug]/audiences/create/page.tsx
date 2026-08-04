"use client";

import { PageLayout } from "@/components/page-layout";
import { useWorkspace } from "@/providers/workspace-provider";
import { workspaceRoutes } from "@/lib/routes";
import { PermissionGuard } from "@/components/permission/permission-guard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CONTENT_PERMISSIONS } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, X, Plus } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWorkspacePermission } from "@/hooks/use-permission";
import { toast } from "sonner";
import { useCreateAudience } from "@/hooks/use-audiences";
import type { Route } from "next";

export default function CreateAudiencePage() {
  const { workspace, workspaceSlug, workspaceId } = useWorkspace();
  const router = useRouter();
  const createAudience = useCreateAudience(workspace?.id || "");
  const { isLoading: isPermLoading } = useWorkspacePermission(
    CONTENT_PERMISSIONS.CREATE,
    workspaceId,
  );

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ name: "", description: "" });

  const [painPointInput, setPainPointInput] = useState("");
  const [painPoints, setPainPoints] = useState<string[]>([]);
  const [goalInput, setGoalInput] = useState("");
  const [goals, setGoals] = useState<string[]>([]);

  const handleCreate = async () => {
    if (!workspace?.id) return;
    if (!formData.name) {
      toast.error("Please give this audience segment a name");
      return;
    }

    try {
      setIsLoading(true);
      await createAudience.mutateAsync({
        name: formData.name,
        description: formData.description,
        pain_points: painPoints,
        goals,
      });

      router.push(workspaceRoutes.audiences(workspaceSlug) as Route);
    } catch {
      // Error toast is handled by the hook
    } finally {
      setIsLoading(false);
    }
  };

  if (!workspace?.id || isPermLoading) {
    return (
      <PageLayout title="Loading Permissions...">
        <div className="space-y-4 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Create New Audience"
      description="Define a reader/buyer segment your content should speak to"
      fullWidth
    >
      <PermissionGuard
        permission={CONTENT_PERMISSIONS.CREATE}
        showLoading={false}
        fallback={
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Access Denied</CardTitle>
              <CardDescription>
                You don't have permission to create audiences in this
                workspace.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Required permission:{" "}
                <code className="text-xs bg-muted px-1 rounded">
                  content:create
                </code>
              </p>
            </CardContent>
          </Card>
        }
      >
        <div className="max-w-3xl space-y-8 pb-12">
          <Card className="shadow-sm border border-border bg-card rounded-2xl overflow-hidden">
            <CardContent className="p-4 sm:p-8 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Segment Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Enterprise IT Buyer"
                  className="bg-background rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Who is this segment, in a sentence or two?"
                  className="bg-background min-h-[100px] rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label>Goals</Label>
                <div className="flex gap-2">
                  <Input
                    value={goalInput}
                    onChange={(e) => setGoalInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (goalInput.trim()) {
                          setGoals([...goals, goalInput.trim()]);
                          setGoalInput("");
                        }
                      }
                    }}
                    placeholder="e.g., Ship faster without sacrificing quality"
                    className="bg-background rounded-xl"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (goalInput.trim()) {
                        setGoals([...goals, goalInput.trim()]);
                        setGoalInput("");
                      }
                    }}
                    className="bg-background rounded-xl border-border shrink-0 px-3 sm:px-4"
                  >
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {goals.map((goal) => (
                    <Badge key={goal} variant="secondary" className="gap-1 pr-1">
                      {goal}
                      <button
                        type="button"
                        onClick={() => setGoals(goals.filter((g) => g !== goal))}
                        className="hover:bg-muted-foreground/20 rounded-full p-0.5"
                      >
                        <X size={12} />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Pain Points</Label>
                <div className="flex gap-2">
                  <Input
                    value={painPointInput}
                    onChange={(e) => setPainPointInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (painPointInput.trim()) {
                          setPainPoints([...painPoints, painPointInput.trim()]);
                          setPainPointInput("");
                        }
                      }
                    }}
                    placeholder="e.g., Too many disconnected tools"
                    className="bg-background rounded-xl"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (painPointInput.trim()) {
                        setPainPoints([...painPoints, painPointInput.trim()]);
                        setPainPointInput("");
                      }
                    }}
                    className="bg-background rounded-xl border-border shrink-0 px-3 sm:px-4"
                  >
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {painPoints.map((point) => (
                    <Badge key={point} variant="secondary" className="gap-1 pr-1">
                      {point}
                      <button
                        type="button"
                        onClick={() =>
                          setPainPoints(painPoints.filter((p) => p !== point))
                        }
                        className="hover:bg-muted-foreground/20 rounded-full p-0.5"
                      >
                        <X size={12} />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50/50 border border-blue-100/60 dark:bg-blue-900/10 dark:border-blue-800/30 rounded-xl p-5 flex gap-3 text-blue-900/80 dark:text-blue-400 text-sm">
                <Users
                  className="shrink-0 mt-0.5 text-blue-500"
                  size={18}
                />
                <div>
                  <span className="font-bold text-blue-900 dark:text-blue-300 text-base">
                    Who this is for
                  </span>
                  <p className="mt-1 leading-relaxed text-blue-800 dark:text-blue-400">
                    Audiences describe who your content is written for —
                    demographics, psychographics, objections. You can add
                    demographics, behaviors, and more detail after creating
                    this segment.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-border">
                <Button
                  variant="outline"
                  onClick={() => router.back()}
                  className="bg-background rounded-2xl border-border px-6"
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={isLoading}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl px-6"
                >
                  {isLoading ? (
                    "Creating..."
                  ) : (
                    <>
                      <Plus size={16} className="mr-2" />
                      Create Audience
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </PermissionGuard>
    </PageLayout>
  );
}
