"use client";

import { ArrowRight, Brain, FileText, Link } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface OnboardingKnowledgeProps {
  onNext: () => void;
  onSkip: () => void;
  onBack: () => void;
  isLoading: boolean;
}

export function OnboardingKnowledge({
  onNext,
  onSkip,
  onBack,
  isLoading,
}: OnboardingKnowledgeProps) {
  const options = [
    {
      icon: FileText,
      title: "Upload Documents",
      description: "PDFs, Word docs, text files, and more",
      action: "I'll upload files in my workspace",
    },
    {
      icon: Link,
      title: "Add Websites",
      description: "Import content from your website or blog",
      action: "I'll add URLs in my workspace",
    },
    {
      icon: Brain,
      title: "Start Fresh",
      description: "Create knowledge bases as you need them",
      action: "I'll set this up later",
    },
  ];

  return (
    <div className="space-y-8 py-4">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="rounded-full bg-primary/10 p-4">
            <Brain className="h-10 w-10 text-primary" />
          </div>
        </div>
        <h2 className="text-2xl font-bold">Add Knowledge Base</h2>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Import your existing content to help AI generate better, more accurate
          content tailored to your brand.
        </p>
      </div>

      {/* Options */}
      <div className="max-w-2xl mx-auto space-y-4">
        {options.map((option, index) => (
          <Card
            key={option.title}
            className="border-2 hover:border-primary/50 transition-colors cursor-pointer"
            onClick={() => {
              if (index === 2) {
                onSkip();
              } else {
                onNext();
              }
            }}
          >
            <CardContent className="flex items-center gap-4 p-4">
              <div className="rounded-full bg-primary/10 p-3">
                <option.icon className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">{option.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {option.description}
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Info box */}
      <div className="max-w-2xl mx-auto">
        <div className="rounded-lg bg-muted p-4 text-sm">
          <p className="text-muted-foreground">
            <strong className="text-foreground">💡 Tip:</strong> You can always
            add more knowledge bases later from your workspace. The more context
            you provide, the better AI can generate content for you.
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-center gap-4 pt-4">
        <Button variant="ghost" onClick={onBack} disabled={isLoading}>
          Back
        </Button>
        <Button variant="outline" onClick={onSkip} disabled={isLoading}>
          Skip this step
        </Button>
      </div>
    </div>
  );
}
