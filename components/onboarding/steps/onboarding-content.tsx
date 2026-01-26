"use client";

import { ArrowRight, FileText, Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface OnboardingContentProps {
  onNext: () => void;
  onSkip: () => void;
  onBack: () => void;
  isLoading: boolean;
}

export function OnboardingContent({
  onNext,
  onSkip,
  onBack,
  isLoading,
}: OnboardingContentProps) {
  const features = [
    {
      icon: Wand2,
      title: "AI-Powered Generation",
      description: "Create blog posts, articles, and marketing copy instantly",
    },
    {
      icon: FileText,
      title: "Multiple Formats",
      description: "Generate content in various formats and styles",
    },
    {
      icon: Sparkles,
      title: "Brand Consistency",
      description: "AI learns your brand voice for consistent content",
    },
  ];

  return (
    <div className="space-y-8 py-4">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="rounded-full bg-primary/10 p-4">
            <Sparkles className="h-10 w-10 text-primary" />
          </div>
        </div>
        <h2 className="text-2xl font-bold">Generate Your First Content</h2>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Ready to create amazing content with AI? Let's explore what REXT can
          do for you.
        </p>
      </div>

      {/* Features */}
      <div className="max-w-2xl mx-auto space-y-4">
        {features.map((feature) => (
          <Card key={feature.title} className="border-2">
            <CardContent className="flex items-start gap-4 p-4">
              <div className="rounded-full bg-primary/10 p-3">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Action cards */}
      <div className="max-w-2xl mx-auto grid gap-4 md:grid-cols-2">
        <Card
          className="border-2 hover:border-primary/50 transition-colors cursor-pointer"
          onClick={onNext}
        >
          <CardContent className="p-6 text-center space-y-2">
            <div className="flex justify-center">
              <div className="rounded-full bg-primary p-3">
                <Wand2 className="h-6 w-6 text-primary-foreground" />
              </div>
            </div>
            <h3 className="font-semibold">Try Content Generation</h3>
            <p className="text-sm text-muted-foreground">
              Go to your workspace and generate your first piece of content
            </p>
            <Button className="w-full mt-4">
              Go to Workspace
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <Card
          className="border-2 hover:border-primary/50 transition-colors cursor-pointer"
          onClick={onSkip}
        >
          <CardContent className="p-6 text-center space-y-2">
            <div className="flex justify-center">
              <div className="rounded-full bg-muted p-3">
                <FileText className="h-6 w-6 text-muted-foreground" />
              </div>
            </div>
            <h3 className="font-semibold">Explore Later</h3>
            <p className="text-sm text-muted-foreground">
              Take your time to explore features at your own pace
            </p>
            <Button variant="outline" className="w-full mt-4">
              I'll explore later
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Navigation */}
      <div className="flex justify-center pt-4">
        <Button variant="ghost" onClick={onBack} disabled={isLoading}>
          Back
        </Button>
      </div>
    </div>
  );
}
