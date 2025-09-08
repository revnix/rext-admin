"use client";

import { Brain, FileText, Sparkles, Target, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
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

  // Access the topic builder hook for cancellation
  const { cancelGeneration } = useTopicBuilder();

  // Handle cancel button click
  const handleCancel = () => {
    console.log("User clicked cancel on loading screen");
    cancelGeneration();
  };

  useEffect(() => {
    let stepTimer: NodeJS.Timeout;

    const runStep = (stepIndex: number) => {
      if (stepIndex >= loadingSteps.length) {
        setIsComplete(true);
        return;
      }

      setCurrentStep(stepIndex);
      const step = loadingSteps[stepIndex];

      stepTimer = setTimeout(() => {
        runStep(stepIndex + 1);
      }, step.duration);
    };

    runStep(0);

    return () => {
      clearTimeout(stepTimer);
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
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary rounded-full animate-pulse opacity-40" />
          <div className="absolute top-3/4 right-1/4 w-3 h-3 bg-secondary rounded-full animate-pulse opacity-30" />
          <div className="absolute top-1/2 left-3/4 w-1 h-1 bg-primary rounded-full animate-pulse opacity-50" />
          <div className="absolute bottom-1/4 left-1/2 w-2 h-2 bg-secondary rounded-full animate-pulse opacity-35" />
        </div>

        <div className="relative z-10 p-12 text-center">
          {/* Animated Icon */}
          <div className="mb-8">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <CurrentIcon
                  className="w-24 h-24 text-primary animate-pulse"
                  strokeWidth={1.5}
                />
                <div className="absolute inset-0 w-24 h-24">
                  <CurrentIcon
                    className="w-24 h-24 text-primary/20 animate-ping"
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

          {/* Single Prominent Progress Bar with Enhanced Animation */}
          <div className="mb-12">
            <div className="w-full h-6 md:h-8 bg-gradient-to-r from-primary/30 via-primary to-primary/30 rounded-2xl relative overflow-hidden shadow-2xl border-2 border-primary/20">
              {/* Primary shimmer effect */}
              <div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent"
                style={{
                  animation: "shimmer 2s ease-in-out infinite",
                  backgroundSize: "200% 100%",
                }}
              />

              {/* Secondary wave effect */}
              <div
                className="absolute inset-0 bg-gradient-to-r from-primary/40 via-transparent to-primary/40"
                style={{
                  animation: "shimmer 3s ease-in-out infinite reverse",
                  backgroundSize: "150% 100%",
                }}
              />

              {/* Enhanced pulsing elements */}
              <div className="absolute inset-0 flex items-center justify-around">
                <div className="relative">
                  <div
                    className="w-2 h-2 bg-white/80 rounded-full animate-ping"
                    style={{ animationDelay: "0s" }}
                  />
                  <div
                    className="absolute inset-0 w-2 h-2 bg-white/40 rounded-full animate-pulse"
                    style={{ animationDelay: "0.5s" }}
                  />
                </div>

                <div className="relative">
                  <div
                    className="w-2 h-2 bg-white/80 rounded-full animate-ping"
                    style={{ animationDelay: "0.7s" }}
                  />
                  <div
                    className="absolute inset-0 w-2 h-2 bg-white/40 rounded-full animate-pulse"
                    style={{ animationDelay: "1.2s" }}
                  />
                </div>

                <div className="relative">
                  <div
                    className="w-2 h-2 bg-white/80 rounded-full animate-ping"
                    style={{ animationDelay: "1.4s" }}
                  />
                  <div
                    className="absolute inset-0 w-2 h-2 bg-white/40 rounded-full animate-pulse"
                    style={{ animationDelay: "1.9s" }}
                  />
                </div>

                <div className="relative">
                  <div
                    className="w-2 h-2 bg-white/80 rounded-full animate-ping"
                    style={{ animationDelay: "2.1s" }}
                  />
                  <div
                    className="absolute inset-0 w-2 h-2 bg-white/40 rounded-full animate-pulse"
                    style={{ animationDelay: "2.6s" }}
                  />
                </div>
              </div>

              {/* Floating particles inside the bar */}
              <div className="absolute inset-0">
                <div
                  className="absolute top-1 left-4 w-1 h-1 bg-white/60 rounded-full animate-bounce"
                  style={{ animationDelay: "0.3s", animationDuration: "2s" }}
                />
                <div
                  className="absolute bottom-1 left-1/3 w-1 h-1 bg-white/60 rounded-full animate-bounce"
                  style={{ animationDelay: "1.1s", animationDuration: "2.5s" }}
                />
                <div
                  className="absolute top-1 right-1/3 w-1 h-1 bg-white/60 rounded-full animate-bounce"
                  style={{ animationDelay: "1.8s", animationDuration: "2s" }}
                />
                <div
                  className="absolute bottom-1 right-4 w-1 h-1 bg-white/60 rounded-full animate-bounce"
                  style={{ animationDelay: "2.5s", animationDuration: "2.5s" }}
                />
              </div>
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
                onClick={handleCancel}
                className="bg-background/80 backdrop-blur-sm border-primary/20 hover:bg-background/90 hover:border-primary/30 transition-all duration-200 text-foreground/80 hover:text-foreground"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel Generation
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
