"use client";

import {
  ArrowLeft,
  ArrowRight,
  Building,
  Eye,
  FileText,
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
import { WizardSidebar } from "@/components/topic-builder/WizardSidebar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { useTopicBuilder } from "@/hooks/use-topic-builder";

const steps = [
  {
    id: 1,
    title: "Industry & Topic",
    description: "Select your approach and domain",
    icon: Building,
    required: true,
  },
  {
    id: 2,
    title: "Audience",
    description: "Define your target audience",
    icon: Users,
    required: true,
  },
  {
    id: 3,
    title: "Content Format",
    description: "Choose content type & platform",
    icon: FileText,
    required: true,
  },
  {
    id: 4,
    title: "Goals & Style",
    description: "Set purpose and tone",
    icon: Target,
    required: true,
  },
  {
    id: 5,
    title: "Advanced Options",
    description: "Keywords & preferences",
    icon: Settings,
    advanced: true,
  },
  {
    id: 6,
    title: "Review",
    description: "Review your selections",
    icon: Eye,
    required: true,
  },
  {
    id: 7,
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
          <IndustryStep
            formData={formData}
            updateFormData={updateFormData}
            errors={errors}
          />
        );

      case 2:
        return (
          <AudienceStep
            formData={formData}
            updateFormData={updateFormData}
            errors={errors}
          />
        );

      case 3:
        return (
          <ContentFormatStep
            formData={formData}
            updateFormData={updateFormData}
            errors={errors}
          />
        );

      case 4:
        return (
          <GoalsStep
            formData={formData}
            updateFormData={updateFormData}
            errors={errors}
          />
        );

      case 5:
        return (
          <AdvancedStep
            formData={formData}
            updateFormData={updateFormData}
            errors={errors}
          />
        );

      case 6:
        return <ReviewStep formData={formData} setCurrentStep={goToStep} />;

      case 7:
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
      className="p-0"
    >
      <div className="flex h-full">
        {/* Sidebar */}
        <WizardSidebar
          steps={steps}
          currentStep={currentStep}
          onStepClick={goToStep}
          errors={errors}
          className="hidden lg:block"
        />

        {/* Mobile Sidebar - Collapsible */}
        <div className="lg:hidden">
          <WizardSidebar
            steps={steps}
            currentStep={currentStep}
            onStepClick={goToStep}
            errors={errors}
            className="absolute inset-y-0 left-0 z-50 w-80 transform transition-transform duration-300 ease-in-out bg-background border-r"
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-full lg:ml-0">
          <div className="flex-1 p-6">
            <Card className="h-full">
              <CardHeader>
                <CardDescription>{currentStepData.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                {renderStepContent()}
              </CardContent>
            </Card>
          </div>

          {/* Navigation Footer */}
          <div className="p-6 pt-0">
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
                Step {currentStep} of {steps.length}
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
                <Button
                  onClick={handleNext}
                  className="flex items-center gap-2"
                >
                  Next
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
