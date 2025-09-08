"use client";

import { Brain, FileText, Sparkles, Target, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTopicBuilder } from "@/hooks/use-topic-builder";

interface AILoadingScreenProps {
  numIdeas?: number;
}

const loadingSteps = [
  {
    id: 1,
    title: "AI is analyzing your requirements...",
    description: "Processing your industry, audience, and content preferences",
    icon: Brain,
    duration: 2000,
  },
  {
    id: 2,
    title: "Generating personalized topics...",
    description:
      "Creating unique, targeted content ideas tailored to your needs",
    icon: Sparkles,
    duration: 4000,
  },
  {
    id: 3,
    title: "Optimizing for relevance and impact...",
    description: "Fine-tuning topics based on your goals and audience",
    icon: Target,
    duration: 2500,
  },
  {
    id: 4,
    title: "Finalizing your topic collection...",
    description: "Adding final touches and organizing your content ideas",
    icon: FileText,
    duration: 1500,
  },
];

export function AILoadingScreen({ numIdeas = 10 }: AILoadingScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [progress, setProgress] = useState(0);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState(0);

  // Access the topic builder hook for cancellation
  const { cancelGeneration } = useTopicBuilder();

  // Handle initial cancel button click - show confirmation
  const handleCancelClick = () => {
    setShowCancelDialog(true);
  };

  // Handle confirmed cancellation
  const handleConfirmCancel = () => {
    console.log("User confirmed cancel on loading screen");
    setShowCancelDialog(false);
    cancelGeneration();
  };

  // Handle dismiss dialog
  const handleDismissCancel = () => {
    setShowCancelDialog(false);
  };

  useEffect(() => {
    let stepTimer: NodeJS.Timeout;
    let progressTimer: NodeJS.Timeout;
    const startTime = Date.now();

    const totalDuration = loadingSteps.reduce(
      (sum, step) => sum + step.duration,
      0,
    );

    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / totalDuration) * 100, 100);
      const remaining = Math.max(totalDuration - elapsed, 0);

      setProgress(newProgress);
      setEstimatedTimeRemaining(Math.ceil(remaining / 1000));
    };

    const runStep = (stepIndex: number) => {
      if (stepIndex >= loadingSteps.length) {
        setIsComplete(true);
        setProgress(100);
        setEstimatedTimeRemaining(0);
        clearInterval(progressTimer);
        return;
      }

      setCurrentStep(stepIndex);
      const step = loadingSteps[stepIndex];

      stepTimer = setTimeout(() => {
        runStep(stepIndex + 1);
      }, step.duration);
    };

    // Start progress updates every 100ms for smooth animation
    progressTimer = setInterval(updateProgress, 100);
    runStep(0);

    return () => {
      clearTimeout(stepTimer);
      clearInterval(progressTimer);
    };
  }, []);

  const currentStepData = loadingSteps[currentStep];
  const CurrentIcon = currentStepData?.icon || Brain;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md">
      {/* Modal Container - Bigger and More Prominent */}
      <div className="relative w-full max-w-4xl mx-4 bg-background rounded-3xl shadow-2xl overflow-hidden border border-primary/20">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-secondary/20" />
          {/* Floating particles */}
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary rounded-full motion-safe:animate-pulse opacity-40" />
          <div className="absolute top-3/4 right-1/4 w-3 h-3 bg-secondary rounded-full motion-safe:animate-pulse opacity-30" />
          <div className="absolute top-1/2 left-3/4 w-1 h-1 bg-primary rounded-full motion-safe:animate-pulse opacity-50" />
          <div className="absolute bottom-1/4 left-1/2 w-2 h-2 bg-secondary rounded-full motion-safe:animate-pulse opacity-35" />
        </div>

        <div className="relative z-10 p-12 text-center">
          {/* Animated Icon */}
          <div className="mb-8">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <CurrentIcon
                  className="w-24 h-24 text-primary motion-safe:animate-pulse"
                  strokeWidth={1.5}
                />
                <div className="absolute inset-0 w-24 h-24">
                  <CurrentIcon
                    className="w-24 h-24 text-primary/20 motion-safe:animate-ping"
                    strokeWidth={1.5}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Main Heading - Big and Bold */}
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
              {isComplete ? "Topics Ready!" : "AI Working"}
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground font-medium">
              {isComplete
                ? `${numIdeas} personalized ideas generated`
                : currentStepData?.title
                    ?.replace("AI is ", "")
                    .replace("...", "")}
            </p>
          </div>

          {/* Step Progress Indicator */}
          <div className="mb-6">
            <div className="flex justify-center items-center space-x-4">
              {loadingSteps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div
                    className={`
                      w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-semibold
                      transition-all duration-500
                      ${
                        index <= currentStep
                          ? "bg-primary text-primary-foreground border-primary shadow-lg"
                          : "border-muted bg-background text-muted-foreground"
                      }
                      ${index === currentStep ? "motion-safe:animate-pulse" : ""}
                    `}
                    role="progressbar"
                    aria-label={`Step ${index + 1}: ${step.title}`}
                  >
                    {index + 1}
                  </div>
                  {index < loadingSteps.length - 1 && (
                    <div
                      className={`
                        w-12 h-0.5 mx-2 transition-colors duration-500
                        ${index < currentStep ? "bg-primary" : "bg-muted"}
                      `}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Enhanced Progress Bar with Real Progress */}
          <div className="mb-8">
            <div className="w-full h-4 bg-muted rounded-full relative overflow-hidden shadow-inner">
              {/* Actual progress fill */}
              <div
                className="h-full bg-gradient-to-r from-primary via-primary to-primary/90 rounded-full transition-all duration-100 ease-out"
                style={{ width: `${progress}%` }}
              />

              {/* Shimmer effect on progress */}
              <div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent motion-safe:animate-shimmer"
                style={{
                  animation: "shimmer 2s ease-in-out infinite",
                  backgroundSize: "200% 100%",
                }}
              />
            </div>

            {/* Progress percentage and time remaining */}
            <div className="flex justify-between items-center mt-2 text-sm text-muted-foreground">
              <span>{Math.round(progress)}% complete</span>
              <span>
                {estimatedTimeRemaining > 0
                  ? `~${estimatedTimeRemaining}s remaining`
                  : "Finalizing..."}
              </span>
            </div>
          </div>

          {/* Status Text */}
          <div className="mb-8">
            <div className="text-center">
              <p className="text-xl md:text-2xl text-muted-foreground font-semibold mb-2">
                {isComplete ? "Complete!" : currentStepData?.description}
              </p>
              <p className="text-base md:text-lg text-muted-foreground">
                <strong>Generating {numIdeas} unique topics</strong>
              </p>
            </div>
          </div>

          {/* Cancel Button */}
          {!isComplete && (
            <div className="text-center">
              <Button
                variant="outline"
                size="default"
                onClick={handleCancelClick}
                className="bg-background/80 backdrop-blur-sm border-primary/20 hover:bg-background/90 hover:border-primary/30 transition-all duration-200 text-foreground/80 hover:text-foreground"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel Generation
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="sm:max-w-md bg-background border border-primary/20 backdrop-blur-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-foreground">
              Cancel Topic Generation?
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              This will stop the current generation process. Your form data will
              be saved, but you'll need to restart generation to get your
              topics.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-row gap-2 sm:gap-3">
            <Button
              variant="outline"
              size="default"
              onClick={handleDismissCancel}
              className="flex-1 bg-background/60 hover:bg-background/80 border-muted/30 hover:border-muted/50 transition-all duration-200"
            >
              Continue Generating
            </Button>
            <Button
              variant="destructive"
              size="default"
              onClick={handleConfirmCancel}
              className="flex-1 bg-destructive/90 hover:bg-destructive text-white transition-all duration-200"
            >
              Yes, Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
