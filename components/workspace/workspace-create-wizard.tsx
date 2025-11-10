"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useCheckLimit } from "@/components/subscription/limit-check-wrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProgressBar } from "@/components/ui/typeform/progress-bar";
import { QuestionCard } from "@/components/ui/typeform/question-card";
import { WorkspaceBrandVoiceForm } from "@/components/workspace/workspace-brand-voice-form";
import { WorkspaceCongratulations } from "@/components/workspace/workspace-congratulations";
import { WorkspaceProgressTimeline } from "@/components/workspace/workspace-progress-timeline";
import { useSSEChannel } from "@/hooks/use-sse-channel";
import { apiClient } from "@/lib/api-client";
import { log } from "@/lib/logger";
import { useSSE } from "@/providers/sse-provider";
import {
  type WorkspaceFormData,
  workspaceFormSchema,
} from "@/schemas/workspace-schemas";
import { useWorkspaceCrudStore, useWorkspaceStore } from "@/stores/workspace";
import type { BrandVoice } from "@/types/workspace";

/**
 * Workspace Creation Wizard
 *
 * Three-step guided workspace creation with real-time SSE updates:
 * 1. Details Form - Title, URL, Description (creates workspace immediately)
 * 2. Live Progress - Real-time SSE progress tracking
 * 3. Review & Edit - Edit AI-extracted brand voice data
 *
 * Features:
 * - Immediate workspace creation with background processing
 * - Real-time progress updates via SSE
 * - AI-powered brand voice extraction
 * - Editable brand voice review
 * - TypeForm-style progressive disclosure
 * - Professional guided experience
 */

type WizardStep = "details" | "progress" | "review" | "congratulations";

const STEPS: Array<{
  id: WizardStep;
  title: string;
  description: string;
  progress: number;
}> = [
  {
    id: "details",
    title: "Workspace Details",
    description: "Tell us about your workspace",
    progress: 25,
  },
  {
    id: "progress",
    title: "Analysis",
    description: "We're analyzing your website",
    progress: 50,
  },
  {
    id: "review",
    title: "Review & Save",
    description: "Review and edit brand information",
    progress: 75,
  },
  {
    id: "congratulations",
    title: "Success",
    description: "Your workspace is ready",
    progress: 100,
  },
];

export function WorkspaceCreateWizard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { clearCompletedOperation } = useSSE();
  const [currentStep, setCurrentStep] = useState<WizardStep>("details");

  // Check workspace limit
  const { checkLimit, warnIfApproaching } = useCheckLimit("workspaces");

  // SSE-related state
  const [operationId, setOperationId] = useState<string | null>(null);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [workspaceSlug, setWorkspaceSlug] = useState<string | null>(null);
  const [extractedBrandVoice, setExtractedBrandVoice] =
    useState<Partial<BrandVoice> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const createWorkspace = useWorkspaceStore((state) => state.createWorkspace);

  // Warn if approaching limit when wizard opens
  useEffect(() => {
    warnIfApproaching(80);
  }, [warnIfApproaching]);

  // Form for details step
  const form = useForm<WorkspaceFormData>({
    resolver: zodResolver(workspaceFormSchema),
    defaultValues: {
      title: "",
      url: "",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    mode: "onChange",
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = form;

  // Memoize SSE callbacks to prevent infinite re-renders
  const handleSSEComplete = useCallback((payload: unknown) => {
    log.info("[Wizard] Pipeline completed", payload);

    // Extract brand voice from payload
    if (payload && typeof payload === "object" && "brand_voice" in payload) {
      setExtractedBrandVoice(payload.brand_voice as Partial<BrandVoice>);
    }

    // Add delay before transitioning to review
    // This gives time for finalization step to display (1-2 seconds)
    setTimeout(() => {
      setCurrentStep("review");
      toast.success("Workspace analysis complete!");
    }, 2000); // 2 second delay
  }, []);

  const handleSSEError = useCallback((error: string) => {
    log.error("[Wizard] Pipeline failed", error);
    toast.error(`Analysis failed: ${error}`);

    // Could navigate back to details or show retry option
    // For now, still allow user to proceed to review with partial data
    setCurrentStep("review");
  }, []);

  // SSE Connection for progress tracking
  const { events, latestEvent, isConnected, disconnect } = useSSEChannel(
    operationId,
    {
      onComplete: handleSSEComplete,
      onError: handleSSEError,
      autoConnect: true,
    },
  );

  // Get current step info
  const currentStepInfo =
    STEPS.find((step) => step.id === currentStep) ?? STEPS[0];
  const currentStepIndex = STEPS.findIndex((step) => step.id === currentStep);

  // Step 1: Handle details form submission (creates workspace immediately)
  const handleDetailsSubmit = async (data: WorkspaceFormData) => {
    // Check workspace limit before creating
    if (!checkLimit("create a workspace")) {
      return;
    }

    try {
      log.info("[Wizard] Creating workspace", data);

      // Real API call - returns workspace (operation_id is stored in currentOperation)
      const workspace = await createWorkspace({
        title: data.title,
        url: data.url,
        timezone: data.timezone,
      });

      log.info("[Wizard] Workspace created", workspace);

      // Store workspace IDs
      setWorkspaceId(workspace.id);
      setWorkspaceSlug(workspace.slug);

      // Get operation_id from store (set by createWorkspace)
      const operation = useWorkspaceCrudStore.getState().currentOperation;
      if (operation?.operationId) {
        log.info("[Wizard] Setting operation ID", {
          operationId: operation.operationId,
        });
        setOperationId(operation.operationId); // Triggers SSE connection via useSSEChannel
      }

      // Move to progress screen
      setCurrentStep("progress");

      toast.success("Workspace created! Analyzing your website...");
    } catch (error) {
      log.error("[Wizard] Failed to create workspace", error);
      toast.error((error as Error).message);
    }
  };

  // Step 3: Handle brand voice save
  const handleReviewSave = async (editedData: Partial<BrandVoice>) => {
    if (!workspaceId) {
      toast.error("Workspace ID not found");
      return;
    }

    try {
      setIsSaving(true);
      log.info("[Wizard] Saving brand voice edits", editedData);

      // Update brand voice via API
      await apiClient.workspaces.updateBrandVoice(workspaceId, editedData);

      // Invalidate workspace queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      queryClient.invalidateQueries({ queryKey: ["workspace", workspaceId] });

      // Move to congratulations step instead of navigating immediately
      setCurrentStep("congratulations");

      // Don't show toast here, congratulations screen is the feedback
    } catch (error) {
      log.error("[Wizard] Failed to save brand voice", error);
      toast.error("Failed to save changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Step 3: Handle skip (navigate without saving edits)
  const handleSkipReview = () => {
    log.info("[Wizard] Skipping brand voice review");

    // Invalidate workspace queries
    queryClient.invalidateQueries({ queryKey: ["workspaces"] });

    // Move to congratulations step instead of navigating immediately
    setCurrentStep("congratulations");

    // Don't show toast here, congratulations screen is the feedback
  };

  // Disconnect SSE when moving to review step
  useEffect(() => {
    if (currentStep === "review" && isConnected) {
      log.info("[Wizard] Disconnecting SSE after reaching review step");
      disconnect();
    }
  }, [currentStep, isConnected, disconnect]);

  // Cleanup SSE connection and clear completed operations on unmount
  useEffect(() => {
    return () => {
      if (operationId) {
        log.info("[Wizard] Cleaning up SSE connection on unmount", {
          operationId,
        });
        disconnect();
        clearCompletedOperation(operationId);
      }
    };
  }, [operationId, disconnect, clearCompletedOperation]);

  // Calculate overall progress from SSE events
  const overallProgress = latestEvent?.progress || 0;

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case "details":
        return (
          <QuestionCard
            title="Let's start with the basics"
            description="Tell us about your workspace and website"
            required
          >
            <form
              onSubmit={handleSubmit(handleDetailsSubmit)}
              className="space-y-6"
            >
              {/* Title Field */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-base font-medium">
                  Workspace Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  type="text"
                  placeholder="e.g., My Company Workspace"
                  {...register("title")}
                  className={`text-lg h-12 ${errors.title ? "border-destructive" : ""}`}
                  autoFocus
                />
                {errors.title && (
                  <p className="text-sm text-destructive">
                    {errors.title.message}
                  </p>
                )}
              </div>

              {/* URL Field */}
              <div className="space-y-2">
                <Label htmlFor="url" className="text-base font-medium">
                  Website URL <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://your-company.com"
                  {...register("url")}
                  className={`text-lg h-12 ${errors.url ? "border-destructive" : ""}`}
                />
                {errors.url && (
                  <p className="text-sm text-destructive">
                    {errors.url.message}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">
                  We'll analyze this website to understand your brand and
                  content
                </p>
              </div>

              {/* Timezone Field */}
              <div className="space-y-2">
                <Label htmlFor="timezone" className="text-base font-medium">
                  Timezone{" "}
                  <span className="text-muted-foreground">(Optional)</span>
                </Label>
                <Select
                  value={form.watch("timezone") || ""}
                  onValueChange={(value) =>
                    form.setValue("timezone", value, { shouldValidate: true })
                  }
                >
                  <SelectTrigger className="text-lg h-12">
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>North America</SelectLabel>
                      <SelectItem value="America/New_York">
                        Eastern Time (ET)
                      </SelectItem>
                      <SelectItem value="America/Chicago">
                        Central Time (CT)
                      </SelectItem>
                      <SelectItem value="America/Denver">
                        Mountain Time (MT)
                      </SelectItem>
                      <SelectItem value="America/Los_Angeles">
                        Pacific Time (PT)
                      </SelectItem>
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel>Europe</SelectLabel>
                      <SelectItem value="Europe/London">
                        London (GMT)
                      </SelectItem>
                      <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                      <SelectItem value="Europe/Berlin">
                        Berlin (CET)
                      </SelectItem>
                      <SelectItem value="Europe/Istanbul">
                        Istanbul (TRT)
                      </SelectItem>
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel>Asia</SelectLabel>
                      <SelectItem value="Asia/Dubai">Dubai (GST)</SelectItem>
                      <SelectItem value="Asia/Karachi">
                        Karachi (PKT)
                      </SelectItem>
                      <SelectItem value="Asia/Kolkata">India (IST)</SelectItem>
                      <SelectItem value="Asia/Singapore">
                        Singapore (SGT)
                      </SelectItem>
                      <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel>Australia & Pacific</SelectLabel>
                      <SelectItem value="Australia/Sydney">
                        Sydney (AEDT)
                      </SelectItem>
                      <SelectItem value="Pacific/Auckland">
                        Auckland (NZDT)
                      </SelectItem>
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel>Other</SelectLabel>
                      <SelectItem value="UTC">UTC</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {errors.timezone && (
                  <p className="text-sm text-destructive">
                    {errors.timezone.message}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">
                  Detected: {Intl.DateTimeFormat().resolvedOptions().timeZone}
                </p>
              </div>

              <Button
                type="submit"
                size="lg"
                disabled={!isValid || form.formState.isSubmitting}
                className="w-full"
              >
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating Workspace...
                  </>
                ) : (
                  <>
                    Create Workspace
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </form>
          </QuestionCard>
        );

      case "progress":
        return (
          <QuestionCard
            title="Creating Your Workspace"
            description="Please wait while we analyze your website and extract brand information"
          >
            <div className="space-y-4">
              <WorkspaceProgressTimeline
                events={events}
                progress={overallProgress}
              />

              {/* Connection status indicator */}
              {isConnected && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <span>Connected to server</span>
                </div>
              )}

              {/* Note: No back button - workspace is already created */}
              <p className="text-xs text-center text-muted-foreground">
                This may take 1-2 minutes. You can't go back, but you can close
                this tab and return later.
              </p>
            </div>
          </QuestionCard>
        );

      case "review":
        return (
          <QuestionCard
            title="Review Brand Voice"
            description="Review and edit the AI-extracted brand information"
          >
            {extractedBrandVoice ? (
              <WorkspaceBrandVoiceForm
                data={extractedBrandVoice}
                onSave={handleReviewSave}
                isLoading={isSaving}
              />
            ) : (
              <div className="space-y-6">
                <div className="text-center py-8">
                  <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">
                    No brand voice data available
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    The analysis didn't complete successfully, but you can still
                    proceed to your workspace and add brand information later.
                  </p>
                </div>

                <Button onClick={handleSkipReview} size="lg" className="w-full">
                  Continue to Workspace
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}
          </QuestionCard>
        );

      case "congratulations":
        return (
          <WorkspaceCongratulations
            workspaceName={form.getValues("title")}
            onContinue={() => {
              if (workspaceSlug) {
                router.push(`/w/${workspaceSlug}/topics`);
              }
            }}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      {/* Progress Bar */}
      <ProgressBar
        progress={
          currentStep === "details"
            ? currentStepInfo.progress
            : currentStep === "progress"
              ? 33 + (overallProgress / 100) * 33
              : currentStepInfo.progress
        }
        currentStep={currentStepIndex + 1}
        totalSteps={STEPS.length}
        showStepCounter
        animated
        onMilestone={(milestone) => {
          if (milestone === 100) {
            log.info("[Wizard] Wizard completed! 🎉");
          }
        }}
      />

      {/* Step Content */}
      <motion.div
        key={currentStep}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        {renderStepContent()}
      </motion.div>
    </div>
  );
}
