"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiClient } from "@/lib/api-client";
import { analytics } from "@/lib/analytics";
import { useWorkspaceContextStore } from "@/stores/workspace";
import type { Route } from "next";

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
  const setCurrentWorkspace = useWorkspaceContextStore(
    (s) => s.setCurrentWorkspace,
  );
  const [workspaceTitle, setWorkspaceTitle] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [timezone, setTimezone] = useState("");
  const [detectedTimezone, setDetectedTimezone] = useState("");
  const [creating, setCreating] = useState(false);

  // Detect user's timezone
  useEffect(() => {
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setDetectedTimezone(detected);
    setTimezone(detected);
  }, []);

  const handleContinue = async () => {
    if (!workspaceTitle.trim()) {
      toast.error("Please enter a workspace title");
      return;
    }

    if (!websiteUrl.trim()) {
      toast.error("Please enter a website URL");
      return;
    }

    // Basic URL validation
    try {
      new URL(
        websiteUrl.startsWith("http") ? websiteUrl : `https://${websiteUrl}`,
      );
    } catch {
      toast.error("Please enter a valid website URL");
      return;
    }

    setCreating(true);
    try {
      const normalizedUrl = websiteUrl.startsWith("http")
        ? websiteUrl
        : `https://${websiteUrl}`;

      const response = await apiClient.workspaces.create({
        name: workspaceTitle,
        url: normalizedUrl,
      });
      toast.success("Workspace created successfully!");
      analytics.track("onboarding_workspace_created", {
        workspace_id: response.workspace.id,
        workspace_slug: response.workspace.slug,
      });

      // Sync the workspace store so WorkspacePermissionProvider resolves the
      // workspace we just created instead of a stale currentWorkspace left
      // over from a previous session/workspace (which 404s permissions/me).
      setCurrentWorkspace(response.workspace);

      // Navigate to the new workspace
      router.push(`/w/${response.workspace.slug}/overview` as Route);

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

  // Common timezones list
  const commonTimezones = [
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "Europe/London",
    "Europe/Paris",
    "Europe/Berlin",
    "Asia/Dubai",
    "Asia/Karachi",
    "Asia/Kolkata",
    "Asia/Shanghai",
    "Asia/Tokyo",
    "Australia/Sydney",
    "Pacific/Auckland",
  ];

  return (
    <div className="space-y-8 py-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">
          Let's start with the basics
          <span className="text-destructive ml-1">*</span>
        </h2>
        <p className="text-muted-foreground">
          Tell us about your workspace and website
        </p>
      </div>

      {/* Form */}
      <div className="space-y-6">
        {/* Workspace Title */}
        <div className="space-y-2">
          <Label htmlFor="workspace-title">
            Workspace Title <span className="text-destructive">*</span>
          </Label>
          <Input
            id="workspace-title"
            placeholder="e.g., My Company Workspace"
            value={workspaceTitle}
            onChange={(e) => setWorkspaceTitle(e.target.value)}
            disabled={creating}
            autoFocus
            className="bg-background"
          />
        </div>

        {/* Website URL */}
        <div className="space-y-2">
          <Label htmlFor="website-url">
            Website URL <span className="text-destructive">*</span>
          </Label>
          <Input
            id="website-url"
            placeholder="https://your-company.com"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            disabled={creating}
            className="bg-background"
          />
          <p className="text-xs text-muted-foreground">
            We'll analyze this website to understand your brand and content
          </p>
        </div>

        {/* Timezone */}
        <div className="space-y-2">
          <Label htmlFor="timezone">Timezone (Optional)</Label>
          <Select
            value={timezone}
            onValueChange={setTimezone}
            disabled={creating}
          >
            <SelectTrigger id="timezone" className="bg-card">
              <SelectValue placeholder="Select timezone" />
            </SelectTrigger>
            <SelectContent>
              {commonTimezones.map((tz) => (
                <SelectItem key={tz} value={tz}>
                  {tz.replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {detectedTimezone && (
            <p className="text-xs text-muted-foreground">
              Detected: {detectedTimezone.replace(/_/g, " ")}
            </p>
          )}
        </div>

        {/* Action Button */}
        <Button
          size="lg"
          onClick={handleContinue}
          disabled={!workspaceTitle.trim() || !websiteUrl.trim() || creating}
          className="w-full"
        >
          {creating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            "Continue"
          )}
        </Button>
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
