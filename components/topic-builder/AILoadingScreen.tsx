"use client";

import { Brain, Clock, FileText, Sparkles, Target, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

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
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    let stepTimer: NodeJS.Timeout;
    let progressTimer: NodeJS.Timeout;

    const totalDuration = loadingSteps.reduce(
      (sum, step) => sum + step.duration,
      0,
    );
    let accumulatedTime = 0;

    const runStep = (stepIndex: number) => {
      if (stepIndex >= loadingSteps.length) {
        setIsComplete(true);
        setProgress(100);
        return;
      }

      setCurrentStep(stepIndex);
      const step = loadingSteps[stepIndex];

      // Update progress smoothly during this step
      const startProgress = (accumulatedTime / totalDuration) * 100;
      const endProgress =
        ((accumulatedTime + step.duration) / totalDuration) * 100;

      const progressStart = Date.now();

      const updateProgress = () => {
        const elapsed = Date.now() - progressStart;
        const stepProgress = Math.min(elapsed / step.duration, 1);
        const currentProgress =
          startProgress + (endProgress - startProgress) * stepProgress;
        setProgress(currentProgress);

        if (stepProgress < 1) {
          progressTimer = setTimeout(updateProgress, 50);
        }
      };

      updateProgress();

      stepTimer = setTimeout(() => {
        accumulatedTime += step.duration;
        runStep(stepIndex + 1);
      }, step.duration);
    };

    runStep(0);

    return () => {
      clearTimeout(stepTimer);
      clearTimeout(progressTimer);
    };
  }, []);

  const currentStepData = loadingSteps[currentStep];
  const CurrentIcon = currentStepData?.icon || Brain;

  return (
    <div className="fixed inset-0 z-50 bg-background flex items-center justify-center">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-secondary/20" />
        {/* Floating particles */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary rounded-full animate-pulse opacity-40" />
        <div className="absolute top-3/4 right-1/4 w-3 h-3 bg-secondary rounded-full animate-pulse opacity-30" />
        <div className="absolute top-1/2 left-3/4 w-1 h-1 bg-primary rounded-full animate-pulse opacity-50" />
        <div className="absolute bottom-1/4 left-1/2 w-2 h-2 bg-secondary rounded-full animate-pulse opacity-35" />
      </div>

      <div className="relative z-10 w-full max-w-2xl mx-auto p-6">
        {/* Main Loading Card */}
        <Card className="p-8 text-center border-primary/20 bg-gradient-to-b from-background to-background/80 backdrop-blur">
          {/* AI Brain Animation */}
          <div className="mb-8">
            <div className="relative inline-block">
              <div
                className={cn(
                  "w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500",
                  "bg-gradient-to-br from-primary/20 via-primary/10 to-transparent",
                  "border-2 border-primary/30",
                  "animate-pulse",
                  isComplete && "animate-none bg-green-100 border-green-300",
                )}
              >
                <CurrentIcon
                  className={cn(
                    "h-12 w-12 transition-colors duration-500",
                    isComplete ? "text-green-600" : "text-primary",
                  )}
                />
              </div>

              {/* Rotating ring */}
              {!isComplete && (
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary/50 animate-spin" />
              )}

              {/* Pulsing dots around the brain */}
              {!isComplete && (
                <>
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-primary rounded-full animate-ping" />
                  <div className="absolute top-1/2 -right-2 transform -translate-y-1/2 w-1.5 h-1.5 bg-primary rounded-full animate-ping animation-delay-300" />
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-primary rounded-full animate-ping animation-delay-700" />
                  <div className="absolute top-1/2 -left-2 transform -translate-y-1/2 w-1.5 h-1.5 bg-primary rounded-full animate-ping animation-delay-1000" />
                </>
              )}
            </div>
          </div>

          {/* Status Message */}
          <div className="mb-6">
            <h2 className="text-2xl font-semibold mb-2 transition-all duration-500">
              {isComplete ? "Your Topics Are Ready!" : currentStepData?.title}
            </h2>
            <p className="text-muted-foreground text-lg">
              {isComplete
                ? `Generated ${numIdeas} personalized topic ideas for your content strategy`
                : currentStepData?.description}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progress</span>
              <span className="text-sm text-muted-foreground">
                {Math.round(progress)}%
              </span>
            </div>
            <Progress
              value={progress}
              className="h-2 transition-all duration-300"
            />
          </div>

          {/* Step Indicators */}
          <div className="flex justify-center space-x-2 mb-8">
            {loadingSteps.map((step, index) => (
              <div
                key={step.id}
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-300",
                  index <= currentStep ? "bg-primary" : "bg-muted",
                  index === currentStep && "animate-pulse",
                )}
              />
            ))}
          </div>

          {/* AI Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="space-y-1">
              <Users className="h-4 w-4 mx-auto text-muted-foreground" />
              <div className="text-xs text-muted-foreground">Audience</div>
              <Badge variant="secondary" className="text-xs">
                Analyzed
              </Badge>
            </div>
            <div className="space-y-1">
              <Target className="h-4 w-4 mx-auto text-muted-foreground" />
              <div className="text-xs text-muted-foreground">Goals</div>
              <Badge variant="secondary" className="text-xs">
                Optimized
              </Badge>
            </div>
            <div className="space-y-1">
              <FileText className="h-4 w-4 mx-auto text-muted-foreground" />
              <div className="text-xs text-muted-foreground">Ideas</div>
              <Badge variant="secondary" className="text-xs">
                {numIdeas}
              </Badge>
            </div>
            <div className="space-y-1">
              <Clock className="h-4 w-4 mx-auto text-muted-foreground" />
              <div className="text-xs text-muted-foreground">Time</div>
              <Badge variant="secondary" className="text-xs">
                ~10s
              </Badge>
            </div>
          </div>
        </Card>

        {/* Loading Tips */}
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            💡 <strong>Pro Tip:</strong> While we generate your topics, think
            about how you'll adapt them for different platforms and audiences.
          </p>
        </div>
      </div>
    </div>
  );
}
