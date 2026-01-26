"use client";

import { Brain, Sparkles, Users, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface OnboardingWelcomeProps {
  onNext: () => void;
  isLoading: boolean;
}

export function OnboardingWelcome({
  onNext,
  isLoading,
}: OnboardingWelcomeProps) {
  const features = [
    {
      icon: Brain,
      title: "AI-Powered Content",
      description: "Generate high-quality content with advanced AI",
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Work together seamlessly with your team",
    },
    {
      icon: Zap,
      title: "Smart Workflows",
      description: "Automate your content creation process",
    },
  ];

  return (
    <div className="space-y-8 py-4">
      {/* Hero section */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="rounded-full bg-primary/10 p-4">
            <Sparkles className="h-12 w-12 text-primary" />
          </div>
        </div>
        <h1 className="text-3xl font-bold">Welcome to REXT!</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Your AI-powered content automation platform. Let's get you set up in
          just a few minutes.
        </p>
      </div>

      {/* Features grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {features.map((feature) => (
          <Card key={feature.title} className="border-2">
            <CardContent className="pt-6 text-center space-y-2">
              <div className="flex justify-center">
                <div className="rounded-full bg-primary/10 p-3">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
              </div>
              <h3 className="font-semibold">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">
                {feature.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex justify-center gap-4 pt-4">
        <Button size="lg" onClick={onNext} disabled={isLoading}>
          {isLoading ? "Loading..." : "Let's Get Started"}
        </Button>
      </div>

      {/* Footer note */}
      <p className="text-center text-sm text-muted-foreground">
        This should only take about 2-3 minutes
      </p>
    </div>
  );
}
