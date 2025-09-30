"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Globe,
  Loader2,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ProgressBar } from "@/components/ui/typeform/progress-bar";
import { QuestionCard } from "@/components/ui/typeform/question-card";
import {
  type WorkspaceFormData,
  workspaceFormSchema,
} from "@/schemas/workspace-schemas";
import { useWorkspaceStore } from "@/stores/workspace-store";

/**
 * Workspace Creation Wizard
 *
 * Multi-step guided workspace creation with:
 * 1. Basic Information - Title, URL, Description
 * 2. URL Analysis - Fetch and preview website content
 * 3. Brand Voice Processing - Extract brand characteristics
 * 4. Review & Create - Final confirmation and workspace creation
 *
 * Features:
 * - TypeForm-style progressive disclosure
 * - Real-time validation and feedback
 * - Animated progress indicators
 * - Professional guided experience
 */

type WizardStep = "basic" | "analysis" | "brand-voice" | "review";

interface WizardData extends WorkspaceFormData {
  // Additional data collected during the wizard
  urlPreview?: {
    title?: string;
    description?: string;
    favicon?: string;
    screenshot?: string;
  };
  brandVoice?: {
    about?: string;
    target_audience?: string[];
    brand_voice?: string[];
    selling_position?: string;
    competitors?: string[];
  };
}

const STEPS: Array<{
  id: WizardStep;
  title: string;
  description: string;
  progress: number;
}> = [
  {
    id: "basic",
    title: "Basic Information",
    description: "Tell us about your workspace",
    progress: 25,
  },
  {
    id: "analysis",
    title: "Website Analysis",
    description: "We'll analyze your website content",
    progress: 50,
  },
  {
    id: "brand-voice",
    title: "Brand Voice",
    description: "Extract your brand characteristics",
    progress: 75,
  },
  {
    id: "review",
    title: "Review & Create",
    description: "Confirm and create your workspace",
    progress: 100,
  },
];

export function WorkspaceCreateWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<WizardStep>("basic");
  const [wizardData, setWizardData] = useState<WizardData>({
    title: "",
    url: "",
    description: "",
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const createWorkspace = useWorkspaceStore((state) => state.createWorkspace);

  // Form for basic information step
  const form = useForm<WorkspaceFormData>({
    resolver: zodResolver(workspaceFormSchema),
    defaultValues: wizardData,
    mode: "onChange",
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = form;

  // Watch description for character count
  const watchedDescription = watch("description") || "";

  // Get current step info
  const currentStepInfo =
    STEPS.find((step) => step.id === currentStep) ?? STEPS[0];
  const currentStepIndex = STEPS.findIndex((step) => step.id === currentStep);
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === STEPS.length - 1;

  // Handle step navigation
  const goToNextStep = () => {
    if (!isLastStep) {
      setCurrentStep(STEPS[currentStepIndex + 1].id);
    }
  };

  const goToPreviousStep = () => {
    if (!isFirstStep) {
      setCurrentStep(STEPS[currentStepIndex - 1].id);
    }
  };

  // Handle basic information form submission
  const onBasicInfoSubmit = async (data: WorkspaceFormData) => {
    // Update wizard data
    setWizardData((prev) => ({ ...prev, ...data }));

    // Move to next step
    goToNextStep();

    // Start URL analysis
    await analyzeUrl(data.url);
  };

  // Simulate URL analysis (in real implementation, this would call an API)
  const analyzeUrl = async (url: string) => {
    setIsProcessing(true);

    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Mock URL analysis results
      const urlPreview = {
        title: `Website Title from ${new URL(url).hostname}`,
        description:
          "This is a sample description extracted from the website content.",
        favicon: "/placeholder-favicon.ico",
        screenshot: "/placeholder-screenshot.jpg",
      };

      setWizardData((prev) => ({ ...prev, urlPreview }));
      toast.success("Website analyzed successfully!");
    } catch (error) {
      console.error("URL analysis failed:", error);
      toast.error(
        "Failed to analyze website. You can still continue with manual setup.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Simulate brand voice extraction
  const extractBrandVoice = async () => {
    setIsProcessing(true);

    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Mock brand voice results
      const brandVoice = {
        about: "A modern technology company focused on innovative solutions",
        target_audience: [
          "Technology Professionals",
          "Business Leaders",
          "Developers",
        ],
        brand_voice: [
          "Professional",
          "Innovative",
          "Trustworthy",
          "Forward-thinking",
        ],
        selling_position:
          "Leading the future of technology with reliable, cutting-edge solutions",
        competitors: ["Company A", "Company B", "Company C"],
      };

      setWizardData((prev) => ({ ...prev, brandVoice }));
      toast.success("Brand voice extracted successfully!");
    } catch (error) {
      console.error("Brand voice extraction failed:", error);
      toast.error(
        "Failed to extract brand voice. You can edit these details later.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle final workspace creation
  const createFinalWorkspace = async () => {
    setIsCreating(true);

    try {
      const workspace = await createWorkspace({
        title: wizardData.title,
        url: wizardData.url,
        description: wizardData.description || "",
      });

      toast.success(`Workspace "${workspace.title}" created successfully!`);

      // Navigate to the new workspace
      router.push(`/workspaces/${workspace.id}`);
    } catch (error) {
      console.error("Failed to create workspace:", error);
      toast.error("Failed to create workspace. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  // Handle step progression based on current step
  const handleStepAction = async () => {
    switch (currentStep) {
      case "analysis":
        goToNextStep();
        await extractBrandVoice();
        break;
      case "brand-voice":
        goToNextStep();
        break;
      case "review":
        await createFinalWorkspace();
        break;
    }
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case "basic":
        return (
          <QuestionCard
            title="Let's start with the basics"
            description="Tell us about your workspace and website"
            required
          >
            <form
              onSubmit={handleSubmit(onBasicInfoSubmit)}
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

              {/* Description Field */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-base font-medium">
                  Description (Optional)
                </Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of your workspace or company"
                  {...register("description")}
                  className={`resize-none ${errors.description ? "border-destructive" : ""}`}
                  rows={3}
                />
                {errors.description && (
                  <p className="text-sm text-destructive">
                    {errors.description.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {watchedDescription.length}/1000 characters
                </p>
              </div>

              <Button
                type="submit"
                size="lg"
                disabled={!isValid}
                className="w-full"
              >
                Continue
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </form>
          </QuestionCard>
        );

      case "analysis":
        return (
          <QuestionCard
            title="Analyzing your website"
            description="We're extracting key information from your website"
          >
            <div className="space-y-6">
              {isProcessing ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                  <h3 className="text-lg font-medium mb-2">
                    Analyzing website...
                  </h3>
                  <p className="text-muted-foreground">
                    We're fetching content, analyzing structure, and preparing
                    for brand voice extraction
                  </p>
                </div>
              ) : wizardData.urlPreview ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-green-600 mb-4">
                    <Check className="h-5 w-5" />
                    <span className="font-medium">
                      Website analyzed successfully!
                    </span>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Globe className="h-5 w-5" />
                        Website Preview
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">
                          Title:
                        </span>
                        <p className="text-lg">{wizardData.urlPreview.title}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">
                          Description:
                        </span>
                        <p className="text-sm">
                          {wizardData.urlPreview.description}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">
                          URL:
                        </span>
                        <p className="text-sm text-blue-600">
                          {wizardData.url}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <Globe className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Ready to analyze</h3>
                  <p className="text-muted-foreground mb-6">
                    Click continue to start analyzing your website
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={goToPreviousStep} size="lg">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={handleStepAction}
                  size="lg"
                  className="flex-1"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </QuestionCard>
        );

      case "brand-voice":
        return (
          <QuestionCard
            title="Extracting your brand voice"
            description="We're analyzing your content to understand your brand characteristics"
          >
            <div className="space-y-6">
              {isProcessing ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                  <h3 className="text-lg font-medium mb-2">
                    Extracting brand voice...
                  </h3>
                  <p className="text-muted-foreground">
                    Analyzing content, tone, and messaging to understand your
                    brand
                  </p>
                </div>
              ) : wizardData.brandVoice ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-green-600 mb-4">
                    <Check className="h-5 w-5" />
                    <span className="font-medium">
                      Brand voice extracted successfully!
                    </span>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5" />
                        Brand Voice Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">
                          About:
                        </span>
                        <p className="text-sm">{wizardData.brandVoice.about}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">
                          Voice Characteristics:
                        </span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {wizardData.brandVoice.brand_voice?.map((voice) => (
                            <span
                              key={voice}
                              className="px-2 py-1 bg-primary/10 text-primary rounded-md text-xs"
                            >
                              {voice}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">
                          Target Audience:
                        </span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {wizardData.brandVoice.target_audience?.map(
                            (audience) => (
                              <span
                                key={audience}
                                className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-xs"
                              >
                                {audience}
                              </span>
                            ),
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">
                    Ready to extract brand voice
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    We'll analyze your website content to understand your brand
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={goToPreviousStep} size="lg">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={handleStepAction}
                  size="lg"
                  className="flex-1"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </QuestionCard>
        );

      case "review":
        return (
          <QuestionCard
            title="Review and create workspace"
            description="Everything looks good! Ready to create your workspace?"
          >
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Workspace Summary</CardTitle>
                  <CardDescription>
                    Review the information below and create your workspace
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">
                        Title:
                      </span>
                      <p className="font-medium">{wizardData.title}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">
                        URL:
                      </span>
                      <p className="text-sm text-blue-600">{wizardData.url}</p>
                    </div>
                  </div>
                  {wizardData.description && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">
                        Description:
                      </span>
                      <p className="text-sm">{wizardData.description}</p>
                    </div>
                  )}
                  {wizardData.urlPreview && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">
                        Website Analysis:
                      </span>
                      <p className="text-sm text-green-600">
                        ✓ Completed successfully
                      </p>
                    </div>
                  )}
                  {wizardData.brandVoice && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">
                        Brand Voice:
                      </span>
                      <p className="text-sm text-green-600">
                        ✓ Extracted successfully
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex gap-3">
                <Button variant="outline" onClick={goToPreviousStep} size="lg">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={handleStepAction}
                  size="lg"
                  className="flex-1"
                  disabled={isCreating}
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating Workspace...
                    </>
                  ) : (
                    <>
                      Create Workspace
                      <Check className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </QuestionCard>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      {/* Progress Bar */}
      <ProgressBar
        progress={currentStepInfo.progress}
        currentStep={currentStepIndex + 1}
        totalSteps={STEPS.length}
        showStepCounter
        animated
        onMilestone={(milestone) => {
          if (milestone === 100) {
            toast.success("Wizard completed! 🎉");
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
