"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { RotateCcw, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import {
  BasicRadioGroup,
  BasicRadioGroupItem,
} from "@/components/ui/basic-radio-group";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { log } from "@/lib/logger";
import { useWorkspaceStore } from "@/stores/workspace-store";
import type { Workspace } from "@/types/workspace";
import { DEFAULT_WORKSPACE_SETTINGS } from "@/types/workspace";

// Validation schema for workspace settings
const workspaceSettingsSchema = z.object({
  defaultView: z.enum(["overview", "search", "knowledge"]),
  showAnalytics: z.boolean(),
  showBrandVoice: z.boolean(),
  autoExtractBrandVoice: z.boolean(),
  duplicateDetection: z.boolean(),
  contentIndexing: z.boolean(),
  processingNotifications: z.boolean(),
  errorNotifications: z.boolean(),
  weeklyReports: z.boolean(),
  workspaceVisibility: z.enum(["private", "team", "public"]),
  allowDuplication: z.boolean(),
  requireApprovalForChanges: z.boolean(),
});

type WorkspaceSettingsFormData = z.infer<typeof workspaceSettingsSchema>;

interface WorkspaceSettingsPanelProps {
  workspace: Workspace;
}

export function WorkspaceSettingsPanel({
  workspace,
}: WorkspaceSettingsPanelProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const getWorkspaceSettings = useWorkspaceStore(
    (state) => state.getWorkspaceSettings,
  );
  const updateWorkspaceSettings = useWorkspaceStore(
    (state) => state.updateWorkspaceSettings,
  );
  const resetWorkspaceSettings = useWorkspaceStore(
    (state) => state.resetWorkspaceSettings,
  );

  const currentSettings = getWorkspaceSettings(workspace.id);

  const form = useForm<WorkspaceSettingsFormData>({
    resolver: zodResolver(workspaceSettingsSchema),
    defaultValues: currentSettings,
  });

  const { watch, reset, handleSubmit } = form;
  const watchedValues = watch();

  // Track changes
  useEffect(() => {
    const hasChangesNow =
      JSON.stringify(watchedValues) !== JSON.stringify(currentSettings);
    setHasChanges(hasChangesNow);
  }, [watchedValues, currentSettings]);

  const onSubmit = async (data: WorkspaceSettingsFormData) => {
    setIsSubmitting(true);
    try {
      updateWorkspaceSettings(workspace.id, data);
      toast.success("Workspace settings updated successfully");
      setHasChanges(false);
    } catch (error) {
      log.error("Failed to update workspace settings:", error);
      toast.error("Failed to update workspace settings. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    resetWorkspaceSettings(workspace.id);
    reset(DEFAULT_WORKSPACE_SETTINGS);
    toast.success("Settings reset to defaults");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Workspace Settings</h2>
          <p className="text-muted-foreground">
            Configure preferences and behavior for {workspace.title}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleReset} size="sm">
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            disabled={!hasChanges || isSubmitting}
            size="sm"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Display Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Display Preferences</CardTitle>
              <CardDescription>
                Customize how your workspace appears and behaves
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="defaultView"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Default View</FormLabel>
                    <FormDescription>
                      Choose which tab opens by default when accessing this
                      workspace
                    </FormDescription>
                    <FormControl>
                      <BasicRadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <div className="flex items-center space-x-2">
                          <BasicRadioGroupItem value="overview" id="overview" />
                          <label htmlFor="overview">Overview</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <BasicRadioGroupItem value="search" id="search" />
                          <label htmlFor="search">Search</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <BasicRadioGroupItem
                            value="knowledge"
                            id="knowledge"
                          />
                          <label htmlFor="knowledge">Knowledge</label>
                        </div>
                      </BasicRadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />

              <FormField
                control={form.control}
                name="showAnalytics"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Show Analytics
                      </FormLabel>
                      <FormDescription>
                        Display knowledge analytics and charts in the overview
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="showBrandVoice"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Show Brand Voice
                      </FormLabel>
                      <FormDescription>
                        Display AI-extracted brand voice information in overview
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Content Management */}
          <Card>
            <CardHeader>
              <CardTitle>Content Management</CardTitle>
              <CardDescription>
                Configure how content is processed and managed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="autoExtractBrandVoice"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Auto-Extract Brand Voice
                      </FormLabel>
                      <FormDescription>
                        Automatically analyze content to extract brand voice
                        characteristics
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="duplicateDetection"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Duplicate Detection
                      </FormLabel>
                      <FormDescription>
                        Warn when adding content that appears to be duplicate
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contentIndexing"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Content Indexing
                      </FormLabel>
                      <FormDescription>
                        Index content for faster search and better AI analysis
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>
                Configure when and how you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="processingNotifications"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Processing Notifications
                      </FormLabel>
                      <FormDescription>
                        Get notified when content processing completes
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="errorNotifications"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Error Notifications
                      </FormLabel>
                      <FormDescription>
                        Get notified when processing errors occur
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="weeklyReports"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Weekly Reports
                      </FormLabel>
                      <FormDescription>
                        Receive weekly summaries of workspace activity
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Privacy & Access */}
          <Card>
            <CardHeader>
              <CardTitle>Privacy & Access</CardTitle>
              <CardDescription>
                Control workspace visibility and access permissions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="workspaceVisibility"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Workspace Visibility</FormLabel>
                    <FormDescription>
                      Control who can see and access this workspace
                    </FormDescription>
                    <FormControl>
                      <BasicRadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <div className="flex items-center space-x-2">
                          <BasicRadioGroupItem value="private" id="private" />
                          <label htmlFor="private">
                            Private - Only you can access
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <BasicRadioGroupItem value="team" id="team" />
                          <label htmlFor="team">
                            Team - Team members can access
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <BasicRadioGroupItem value="public" id="public" />
                          <label htmlFor="public">
                            Public - Anyone can view
                          </label>
                        </div>
                      </BasicRadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />

              <FormField
                control={form.control}
                name="allowDuplication"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Allow Duplication
                      </FormLabel>
                      <FormDescription>
                        Allow other users to duplicate this workspace
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="requireApprovalForChanges"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Require Approval for Changes
                      </FormLabel>
                      <FormDescription>
                        Require admin approval before content changes take
                        effect
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  );
}
