"use client";

import { ArrowRight, Building2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiClient } from "@/lib/api-client";

interface OnboardingWorkspaceProps {
  onNext: () => void;
  onBack: () => void;
  isLoading: boolean;
  currentStep: number;
}

export function OnboardingWorkspace({
  onNext,
  onBack,
  isLoading,
}: OnboardingWorkspaceProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Please enter a workspace name");
      return;
    }

    setCreating(true);
    try {
      const response = await apiClient.workspaces.create({
        title: name,
        url: "", // Optional URL, can be added later
      });
      toast.success("Workspace created successfully!");

      // Navigate to the new workspace
      router.push(`/w/${response.workspace.slug}/overview`);

      // Complete this step
      await onNext();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to create workspace";
      toast.error(message);
    } finally {
      setCreating(false);
    }
  };

  const handleSkipForNow = async () => {
    await onNext();
  };

  return (
    <div className="space-y-8 py-4">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="rounded-full bg-primary/10 p-4">
            <Building2 className="h-10 w-10 text-primary" />
          </div>
        </div>
        <h2 className="text-2xl font-bold">Create Your First Workspace</h2>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Workspaces help you organize your content, team members, and knowledge
          bases. You can create more later.
        </p>
      </div>

      {/* Form */}
      <div className="max-w-md mx-auto space-y-6">
        <div className="space-y-2">
          <Label htmlFor="workspace-name">Workspace Name *</Label>
          <Input
            id="workspace-name"
            placeholder="e.g., Acme Marketing, Personal Blog"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && name.trim()) {
                handleCreate();
              }
            }}
            disabled={creating}
            autoFocus
          />
          <p className="text-xs text-muted-foreground">
            Choose a name that describes your project or organization
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-3">
          <Button
            size="lg"
            onClick={handleCreate}
            disabled={!name.trim() || creating}
            className="w-full"
          >
            {creating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Workspace...
              </>
            ) : (
              <>
                Create Workspace
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>

          <Button
            variant="outline"
            onClick={handleSkipForNow}
            disabled={creating || isLoading}
            className="w-full"
          >
            I'll do this later
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-center pt-4">
        <Button
          variant="ghost"
          onClick={onBack}
          disabled={creating || isLoading}
        >
          Back
        </Button>
      </div>
    </div>
  );
}
