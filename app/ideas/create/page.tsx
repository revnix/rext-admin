"use client";

import {
  ArrowLeft,
  ArrowRight,
  Building,
  Eye,
  FileText,
  Route,
  Settings,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { useState } from "react";
import { PageLayout } from "@/components/page-layout";
import { AdvancedStep } from "@/components/topic-builder/steps/AdvancedStep";
import { AudienceStep } from "@/components/topic-builder/steps/AudienceStep";
import { ContentFormatStep } from "@/components/topic-builder/steps/ContentFormatStep";
import { GoalsStep } from "@/components/topic-builder/steps/GoalsStep";
import { IndustryStep } from "@/components/topic-builder/steps/IndustryStep";
import { WizardModeSelectionStep } from "@/components/topic-builder/steps/WizardModeSelectionStep";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { detectYMYL, validateFormStep } from "@/lib/topic-builder-utils";
import type { TopicBuilderFormData } from "@/types/topic-builder";
import {
  CONTENT_GOAL_OPTIONS,
  CONTENT_TYPE_OPTIONS,
  INDUSTRY_OPTIONS,
  LANGUAGE_OPTIONS,
  PLATFORM_OPTIONS,
  PURPOSE_OPTIONS,
  REGION_OPTIONS,
  TONE_OPTIONS,
} from "@/types/topic-builder";

const initialFormData: TopicBuilderFormData = {
  wizardMode: "subject-first",
  industry: "technology",
  content_type: "blog-post",
  demographic_age: [],
  demographic_location: [],
  purpose: [],
  content_goal: [],
  tone: [],
  num_ideas: 5,
};

const steps = [
  {
    id: 1,
    title: "Wizard Mode",
    description: "Choose your approach",
    icon: Route,
    required: true,
  },
  {
    id: 2,
    title: "Industry/Subject",
    description: "Select domain or enter topic",
    icon: Building,
    required: true,
  },
  {
    id: 3,
    title: "Audience",
    description: "Define your target audience",
    icon: Users,
    required: true,
  },
  {
    id: 4,
    title: "Content Format",
    description: "Choose content type & platform",
    icon: FileText,
    required: true,
  },
  {
    id: 5,
    title: "Goals & Style",
    description: "Set purpose and tone",
    icon: Target,
    required: true,
  },
  {
    id: 6,
    title: "Advanced Options",
    description: "Keywords & preferences",
    icon: Settings,
    advanced: true,
  },
  {
    id: 7,
    title: "Review",
    description: "Review your selections",
    icon: Eye,
    required: true,
  },
  {
    id: 8,
    title: "Generate",
    description: "Create topic ideas",
    icon: Sparkles,
    required: true,
  },
];

export default function TopicBuilderPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] =
    useState<TopicBuilderFormData>(initialFormData);
  const [errors, _setErrors] = useState<Record<string, string>>({});

  const breadcrumbs = [
    { label: "Ideas", href: "/ideas" },
    { label: "Topic Builder" },
  ];

  const updateFormData = (
    field: keyof TopicBuilderFormData,
    value: string | string[] | number,
  ) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };

      // Auto-detect YMYL when industry changes
      if (field === "industry" && typeof value === "string") {
        updated.is_ymyl = detectYMYL(value);
      }

      return updated;
    });
  };

  const progress = (currentStep / steps.length) * 100;

  const nextStep = () => {
    if (validateFormStep(currentStep, formData) && currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    } else {
      console.warn("Validation failed for step", currentStep);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleGenerate = () => {
    console.log("Generating topics with data:", formData);
    // TODO: Implement topic generation API call
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <WizardModeSelectionStep
            formData={formData}
            updateFormData={updateFormData}
            errors={errors}
          />
        );

      case 2:
        return (
          <IndustryStep
            formData={formData}
            updateFormData={updateFormData}
            errors={errors}
          />
        );

      case 3:
        return (
          <AudienceStep
            formData={formData}
            updateFormData={updateFormData}
            errors={errors}
          />
        );

      case 4:
        return (
          <ContentFormatStep
            formData={formData}
            updateFormData={updateFormData}
            errors={errors}
          />
        );

      case 5:
        return (
          <GoalsStep
            formData={formData}
            updateFormData={updateFormData}
            errors={errors}
          />
        );

      case 6:
        return (
          <AdvancedStep
            formData={formData}
            updateFormData={updateFormData}
            errors={errors}
          />
        );

      case 7:
        return (
          <div className="space-y-6">
            <div className="text-sm text-muted-foreground mb-4">
              Review your selections before generating topic ideas.
            </div>

            <div className="grid gap-4">
              <div className="space-y-3">
                <div>
                  <strong>Mode:</strong>{" "}
                  {formData.wizardMode === "subject-first"
                    ? "Subject-First"
                    : "Industry-First"}
                </div>
                {formData.subject && (
                  <div>
                    <strong>Subject:</strong> {formData.subject}
                  </div>
                )}
                <div>
                  <strong>Industry:</strong>{" "}
                  {INDUSTRY_OPTIONS.find(
                    (opt) => opt.value === formData.industry,
                  )?.label || formData.industry}
                </div>
                {formData.focus && (
                  <div>
                    <strong>Focus:</strong> {formData.focus}
                  </div>
                )}
                {formData.audience && (
                  <div>
                    <strong>Audience:</strong> {formData.audience}
                  </div>
                )}
                <div>
                  <strong>Content Type:</strong>{" "}
                  {CONTENT_TYPE_OPTIONS.find(
                    (opt) => opt.value === formData.content_type,
                  )?.label || formData.content_type}
                </div>
                {formData.platform && (
                  <div>
                    <strong>Platform:</strong>{" "}
                    {PLATFORM_OPTIONS.find(
                      (opt) => opt.value === formData.platform,
                    )?.label || formData.platform}
                  </div>
                )}
                {formData.purpose.length > 0 && (
                  <div>
                    <strong>Purpose:</strong>{" "}
                    {formData.purpose
                      .map(
                        (p) =>
                          PURPOSE_OPTIONS.find((opt) => opt.value === p)
                            ?.label || p,
                      )
                      .join(", ")}
                  </div>
                )}
                {formData.content_goal.length > 0 && (
                  <div>
                    <strong>Content Goals:</strong>{" "}
                    {formData.content_goal
                      .map(
                        (g) =>
                          CONTENT_GOAL_OPTIONS.find((opt) => opt.value === g)
                            ?.label || g,
                      )
                      .join(", ")}
                  </div>
                )}
                {formData.tone.length > 0 && (
                  <div>
                    <strong>Tone:</strong>{" "}
                    {formData.tone
                      .map(
                        (t) =>
                          TONE_OPTIONS.find((opt) => opt.value === t)?.label ||
                          t,
                      )
                      .join(", ")}
                  </div>
                )}
                <div>
                  <strong>Number of Ideas:</strong> {formData.num_ideas}
                </div>
                {formData.keywords && (
                  <div>
                    <strong>Keywords:</strong> {formData.keywords}
                  </div>
                )}
                {formData.exclude && (
                  <div>
                    <strong>Exclude:</strong> {formData.exclude}
                  </div>
                )}
                {formData.region && (
                  <div>
                    <strong>Region:</strong>{" "}
                    {REGION_OPTIONS.find((opt) => opt.value === formData.region)
                      ?.label || formData.region}
                  </div>
                )}
                {formData.language && (
                  <div>
                    <strong>Language:</strong>{" "}
                    {LANGUAGE_OPTIONS.find(
                      (opt) => opt.value === formData.language,
                    )?.label || formData.language}
                  </div>
                )}
                {formData.notes && (
                  <div>
                    <strong>Notes:</strong> {formData.notes}
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 8:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Sparkles className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="text-lg font-semibold mb-2">Ready to Generate!</h3>
              <p className="text-muted-foreground mb-4">
                We'll create {formData.num_ideas} targeted topic ideas based on
                your selections.
              </p>
              <Button onClick={handleGenerate} size="lg" className="w-full">
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Topic Ideas
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const currentStepData = steps[currentStep - 1];

  return (
    <PageLayout
      title="Topic Builder"
      description="Generate AI-powered content topic ideas for your industry"
      breadcrumbs={breadcrumbs}
    >
      {/* Progress Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Step {currentStep} of {steps.length}
          </div>
        </div>

        <Progress value={progress} className="w-full" />

        {/* Step Indicators */}
        <div className="flex items-center justify-between">
          {steps.map((step, _index) => {
            const StepIcon = step.icon;
            const isActive = step.id === currentStep;
            const isCompleted = step.id < currentStep;

            return (
              <div key={step.id} className="flex flex-col items-center gap-2">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : isCompleted
                        ? "bg-green-500 text-white"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  <StepIcon className="h-4 w-4" />
                </div>
                <div className="text-center">
                  <div
                    className={`text-sm font-medium ${isActive ? "text-primary" : ""}`}
                  >
                    {step.title}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <Card className="flex-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <currentStepData.icon className="h-5 w-5" />
            {currentStepData.title}
          </CardTitle>
          <CardDescription>{currentStepData.description}</CardDescription>
        </CardHeader>
        <CardContent>{renderStepContent()}</CardContent>
      </Card>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 1}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Previous
        </Button>

        <div className="text-sm text-muted-foreground">
          {currentStep} of {steps.length} steps completed
        </div>

        {currentStep === steps.length ? (
          <Button onClick={handleGenerate} className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Generate Topics
          </Button>
        ) : (
          <Button onClick={nextStep} className="flex items-center gap-2">
            Next
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </PageLayout>
  );
}
