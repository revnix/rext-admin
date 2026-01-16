"use client";

import { Globe, UserCircle } from "lucide-react";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface OnboardingStrategyProps {
  onNext: (strategy: "analyze" | "manual") => void;
  isLoading: boolean;
  onChange?: (strategy: "analyze" | "manual" | null) => void;
}

export function OnboardingStrategy({ onChange }: OnboardingStrategyProps) {
  const [selectedStrategy, setSelectedStrategy] = useState<
    "analyze" | "manual" | null
  >(null);

  const handleStrategySelect = (strategy: "analyze" | "manual") => {
    setSelectedStrategy(strategy);
    onChange?.(strategy);
  };

  const strategies = [
    {
      id: "analyze" as const,
      icon: Globe,
      title: "Analyze Website",
      description:
        "We'll extract your brand identity and suggest personas automatically.",
      iconBgColor: "bg-primary/10",
      iconColor: "text-primary",
      borderColor: "hover:border-primary/50",
    },
    {
      id: "manual" as const,
      icon: UserCircle,
      title: "Manual Persona",
      description: "Directly create your first author profile from scratch.",
      iconBgColor: "bg-primary/10",
      iconColor: "text-primary",
      borderColor: "hover:border-primary/50",
    },
  ];

  return (
    <div className="space-y-8 py-4">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl md:text-4xl font-bold">Welcome to Wrext</h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          Content that Ranks. AI that Cares.
        </p>
      </div>

      {/* Subtitle */}
      <div className="text-center space-y-2 max-w-2xl mx-auto">
        <h2 className="text-xl md:text-2xl font-semibold">
          How should we start?
        </h2>
        <p className="text-muted-foreground">
          Choose the foundation for your content strategy.
        </p>
      </div>

      {/* Strategy Cards */}
      <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
        {strategies.map((strategy) => (
          <Card
            key={strategy.id}
            className={`border-2 transition-all duration-200 cursor-pointer ${
              selectedStrategy === strategy.id
                ? "border-primary shadow-md"
                : `border-border ${strategy.borderColor}`
            }`}
            onClick={() => handleStrategySelect(strategy.id)}
          >
            <CardContent className="p-6 space-y-4">
              {/* Icon */}
              <div className="flex items-start">
                <div
                  className={`rounded-xl ${strategy.iconBgColor} p-3 inline-flex`}
                >
                  <strategy.icon className={`h-6 w-6 ${strategy.iconColor}`} />
                </div>
              </div>

              {/* Content */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">{strategy.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {strategy.description}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Footer Note */}
      <p className="text-center text-sm text-muted-foreground pt-4">
        You can change this later in your workspace settings
      </p>
    </div>
  );
}
