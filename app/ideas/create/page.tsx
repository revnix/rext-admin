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
import { PageLayout } from "@/components/page-layout";
import { AdvancedStep } from "@/components/topic-builder/steps/AdvancedStep";
import { AudienceStep } from "@/components/topic-builder/steps/AudienceStep";
import { ContentFormatStep } from "@/components/topic-builder/steps/ContentFormatStep";
import { GenerationStep } from "@/components/topic-builder/steps/GenerationStep";
import { GoalsStep } from "@/components/topic-builder/steps/GoalsStep";
import { IndustryStep } from "@/components/topic-builder/steps/IndustryStep";
import { ReviewStep } from "@/components/topic-builder/steps/ReviewStep";
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
import { useTopicBuilder } from "@/hooks/use-topic-builder";

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
  const {
    formData,
    currentStep,
    errors,
    isGenerating,
    updateFormData,
    nextStep,
    prevStep,
    goToStep,
    generateTopics,
  } = useTopicBuilder();

  const breadcrumbs = [
    { label: "Ideas", href: "/ideas" },
    { label: "Topic Builder" },
  ];

  const progress = (currentStep / steps.length) * 100;

  const handleNext = () => {
    const success = nextStep();
    if (!success) {
      console.warn("Validation failed for step", currentStep);
    }
  };

  const handlePrev = () => {
    prevStep();
  };

  const handleGenerate = async () => {
    await generateTopics();
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
        return <ReviewStep formData={formData} setCurrentStep={goToStep} />;

      case 8:
        return (
          <GenerationStep formData={formData} onGenerate={handleGenerate} />
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
          onClick={handlePrev}
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
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex items-center gap-2"
          >
            <Sparkles className="h-4 w-4" />
            {isGenerating ? "Generating..." : "Generate Topics"}
          </Button>
        ) : (
          <Button onClick={handleNext} className="flex items-center gap-2">
            Next
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </PageLayout>
  );
}
