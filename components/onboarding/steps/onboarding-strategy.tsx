"use client";

import { Globe, UserCircle } from "lucide-react";
import { useState, useImperativeHandle, forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Persona } from "@/types/workspace";

interface OnboardingStrategyProps {
  onNext: (
    strategy: "analyze" | "manual",
    personaData?: Partial<Persona>,
  ) => void;
  isLoading: boolean;
  onChange?: (strategy: "analyze" | "manual" | null) => void;
  onFormVisibilityChange?: (isVisible: boolean) => void;
}

export interface OnboardingStrategyRef {
  handleContinue: () => void;
  handleBack: () => void;
  getSelectedStrategy: () => "analyze" | "manual" | null;
  isShowingForm: () => boolean;
}

export const OnboardingStrategy = forwardRef<
  OnboardingStrategyRef,
  OnboardingStrategyProps
>(({ onNext, onChange, onFormVisibilityChange }, ref) => {
  const [selectedStrategy, setSelectedStrategy] = useState<
    "analyze" | "manual" | null
  >(null);
  const [showPersonaForm, setShowPersonaForm] = useState(false);

  const [personaData, setPersonaData] = useState<Partial<Persona>>({
    full_name: "",
    professional_title: "",
    areas_of_expertise: "",
    tone_of_voice: "",
    bio: "",
    linkedin_url: "",
  });

  const handleStrategySelect = (strategy: "analyze" | "manual") => {
    setSelectedStrategy(strategy);
    onChange?.(strategy);
  };

  const handleContinueClick = () => {
    if (selectedStrategy === "manual") {
      // Show persona form instead of proceeding
      setShowPersonaForm(true);
      onFormVisibilityChange?.(true);
    } else if (selectedStrategy === "analyze") {
      // Proceed directly to next step
      onNext(selectedStrategy);
    }
  };

  const handleBackClick = () => {
    // Go back from persona form to strategy selection
    setShowPersonaForm(false);
    onFormVisibilityChange?.(false);
  };

  const handlePersonaFieldChange = (field: keyof Persona, value: string) => {
    setPersonaData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const _handlePersonaFormSubmit = () => {
    // Pass persona data to parent and proceed to next step
    onNext("manual", personaData);
  };

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    handleContinue: handleContinueClick,
    handleBack: handleBackClick,
    getSelectedStrategy: () => selectedStrategy,
    isShowingForm: () => showPersonaForm,
  }));

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
      <AnimatePresence mode="wait">
        {!showPersonaForm ? (
          <motion.div
            key="strategy-selection"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            {/* Header */}
            <div className="text-center space-y-4">
              <h1 className="text-3xl md:text-4xl font-bold">
                Welcome to Wrext
              </h1>
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
                        <strategy.icon
                          className={`h-6 w-6 ${strategy.iconColor}`}
                        />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">
                        {strategy.title}
                      </h3>
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
          </motion.div>
        ) : (
          <motion.div
            key="persona-form"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            {/* Header */}
            <div className="text-center space-y-4">
              <h1 className="text-3xl md:text-4xl font-bold">
                Create New Persona
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Define a new author persona to enhance your content's EEAT
                signals
              </p>
            </div>

            {/* Persona Form */}
            <div className="max-w-2xl mx-auto">
              <Card className="border-2">
                <CardContent className="p-6 space-y-6">
                  {/* Form Fields */}
                  <div className="space-y-4">
                    {/* Full Name */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="full_name"
                        className="text-base font-medium"
                      >
                        Full Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="full_name"
                        type="text"
                        placeholder="e.g., Dr. Sarah Mitchell"
                        value={personaData.full_name || ""}
                        onChange={(e) =>
                          handlePersonaFieldChange("full_name", e.target.value)
                        }
                        className="h-11"
                      />
                    </div>

                    {/* Professional Title */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="professional_title"
                        className="text-base font-medium"
                      >
                        Professional Title{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="professional_title"
                        type="text"
                        placeholder="e.g., Board-Certified Dermatologist"
                        value={personaData.professional_title || ""}
                        onChange={(e) =>
                          handlePersonaFieldChange(
                            "professional_title",
                            e.target.value,
                          )
                        }
                        className="h-11"
                      />
                    </div>

                    {/* Areas of Expertise */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="areas_of_expertise"
                        className="text-base font-medium"
                      >
                        Areas of Expertise
                      </Label>
                      <Input
                        id="areas_of_expertise"
                        type="text"
                        placeholder="Add expertise tag"
                        value={personaData.areas_of_expertise || ""}
                        onChange={(e) =>
                          handlePersonaFieldChange(
                            "areas_of_expertise",
                            e.target.value,
                          )
                        }
                        className="h-11"
                      />
                    </div>

                    {/* Tone of Voice */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="tone_of_voice"
                        className="text-base font-medium"
                      >
                        Tone of Voice
                      </Label>
                      <Input
                        id="tone_of_voice"
                        type="text"
                        placeholder="e.g., Professional, Empathetic, Evidence-based"
                        value={personaData.tone_of_voice || ""}
                        onChange={(e) =>
                          handlePersonaFieldChange(
                            "tone_of_voice",
                            e.target.value,
                          )
                        }
                        className="h-11"
                      />
                    </div>

                    {/* Bio */}
                    <div className="space-y-2">
                      <Label htmlFor="bio" className="text-base font-medium">
                        Bio
                      </Label>
                      <Textarea
                        id="bio"
                        placeholder="Brief professional biography..."
                        value={personaData.bio || ""}
                        onChange={(e) =>
                          handlePersonaFieldChange("bio", e.target.value)
                        }
                        className="min-h-[100px] resize-none"
                      />
                    </div>

                    {/* LinkedIn URL */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="linkedin_url"
                        className="text-base font-medium"
                      >
                        LinkedIn URL{" "}
                        <span className="text-muted-foreground">
                          (Optional)
                        </span>
                      </Label>
                      <Input
                        id="linkedin_url"
                        type="url"
                        placeholder="https://linkedin.com/in/username"
                        value={personaData.linkedin_url || ""}
                        onChange={(e) =>
                          handlePersonaFieldChange(
                            "linkedin_url",
                            e.target.value,
                          )
                        }
                        className="h-11"
                      />
                    </div>
                  </div>

                  {/* EEAT Optimization Notice */}
                  <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-xl">💡</span>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                          EEAT Optimization
                        </p>
                        <p className="text-sm text-amber-800 dark:text-amber-200">
                          This persona will be used to inject authentic
                          experience and expertise into your content, improving
                          trust signals for search engines.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

OnboardingStrategy.displayName = "OnboardingStrategy";
