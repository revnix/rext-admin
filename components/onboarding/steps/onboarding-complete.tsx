"use client";

import { ArrowRight, Book, CheckCircle2, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface OnboardingCompleteProps {
  onComplete: () => void;
}

export function OnboardingComplete({ onComplete }: OnboardingCompleteProps) {
  const nextSteps = [
    {
      icon: Sparkles,
      title: "Generate Content",
      description: "Create your first AI-generated content",
      link: "/w",
    },
    {
      icon: Users,
      title: "Invite Team Members",
      description: "Collaborate with your team",
      link: "/w",
    },
    {
      icon: Book,
      title: "Add Knowledge",
      description: "Upload documents or add website content",
      link: "/w",
    },
  ];

  return (
    <div className="space-y-8 py-4">
      {/* Success header */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="rounded-full bg-green-100 dark:bg-green-950 p-4">
            <CheckCircle2 className="h-16 w-16 text-green-600 dark:text-green-400" />
          </div>
        </div>
        <h1 className="text-3xl font-bold">You're All Set!</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Congratulations! Your WREXT account is ready. Here's what you can do
          next to get the most out of the platform.
        </p>
      </div>

      {/* Next steps */}
      <div className="max-w-2xl mx-auto space-y-4">
        <h3 className="font-semibold text-center mb-4">Quick Start Guide</h3>
        {nextSteps.map((step) => (
          <Card key={step.title} className="border-2">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="rounded-full bg-primary/10 p-3">
                <step.icon className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold mb-1">{step.title}</h4>
                <p className="text-sm text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Resources */}
      <div className="max-w-2xl mx-auto">
        <div className="rounded-lg bg-muted p-6 space-y-3">
          <h4 className="font-semibold">Need Help?</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Check out our documentation for detailed guides</li>
            <li>• Join our community to connect with other users</li>
            <li>• Contact support if you have any questions</li>
          </ul>
        </div>
      </div>

      {/* Complete button */}
      <div className="flex justify-center pt-4">
        <Button size="lg" onClick={onComplete} className="px-8">
          Go to Dashboard
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      {/* Footer note */}
      <p className="text-center text-sm text-muted-foreground">
        You can always access this guide again from your settings
      </p>
    </div>
  );
}
