"use client";

import {
  ArrowLeft,
  ArrowRight,
  Building,
  FileText,
  Settings,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { PageLayout } from "@/components/page-layout";
import { AILoadingScreen } from "@/components/topic-builder/AILoadingScreen";
import { AdvancedStep } from "@/components/topic-builder/steps/AdvancedStep";
import { AudienceStep } from "@/components/topic-builder/steps/AudienceStep";
import { ContentFormatStep } from "@/components/topic-builder/steps/ContentFormatStep";
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
    title: "Getting Started",
    description: "Choose your approach and field",
    icon: Building,
    required: true,
  },
  {
    id: 2,
    title: "Your Audience",
    description: "Who are you creating this for?",
    icon: Users,
    required: true,
  },
  {
    id: 3,
    title: "Content Type",
    description: "What will you create and where?",
    icon: FileText,
    required: true,
  },
  {
    id: 4,
    title: "Goals & Style",
    description: "What do you want to achieve?",
    icon: Target,
    required: true,
  },
  {
    id: 5,
    title: "Fine-tune (Optional)",
    description: "Add keywords and preferences",
    icon: Settings,
    advanced: true,
  },
  {
    id: 6,
    title: "Generate Ideas",
    description: "Review your choices and create topics",
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
    isStepCompleted,
    validateField,
    getFieldError,
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
            validateField={validateField}
            getFieldError={getFieldError}
            errors={errors}
          />
        );

      case 2:
        return (
          <AudienceStep
            formData={formData}
            updateFormData={updateFormData}
            validateField={validateField}
            getFieldError={getFieldError}
            errors={errors}
          />
        );

      case 3:
        return (
          <ContentFormatStep
            formData={formData}
            updateFormData={updateFormData}
            validateField={validateField}
            getFieldError={getFieldError}
            errors={errors}
          />
        );

      case 4:
        return (
          <GoalsStep
            formData={formData}
            updateFormData={updateFormData}
            validateField={validateField}
            getFieldError={getFieldError}
            errors={errors}
          />
        );

      case 5:
        return (
          <AdvancedStep
            formData={formData}
            updateFormData={updateFormData}
            validateField={validateField}
            getFieldError={getFieldError}
            errors={errors}
          />
        );

      case 6:
        return (
          <ReviewStep
            formData={formData}
            onGenerate={handleGenerate}
            onGoBack={handlePrev}
            isGenerating={isGenerating}
          />
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
          isStepCompleted={isStepCompleted}
          errors={errors}
          className="hidden lg:block"
        />

        {/* Mobile Sidebar - Collapsible */}
        <div className="lg:hidden">
          <WizardSidebar
            steps={steps}
            currentStep={currentStep}
            onStepClick={goToStep}
            isStepCompleted={isStepCompleted}
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

                {/* Top Navigation */}
                {currentStep < 6 && (
                  <div className="flex items-center justify-between pt-4 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handlePrev}
                      disabled={currentStep === 1}
                      className="flex items-center gap-1.5"
                    >
                      <ArrowLeft className="h-3 w-3" />
                      Previous
                    </Button>

                    <div className="text-xs text-muted-foreground">
                      Step {currentStep} of {steps.length}
                    </div>

                    <Button
                      size="sm"
                      onClick={handleNext}
                      className="flex items-center gap-1.5"
                    >
                      Next
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="flex-1">
                {renderStepContent()}
              </CardContent>
            </Card>
          </div>

          {/* Navigation Footer */}
          {currentStep < 6 && (
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

                <Button
                  onClick={handleNext}
                  className="flex items-center gap-2"
                >
                  Next
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Loading Modal */}
      {isGenerating && <AILoadingScreen numIdeas={formData.num_ideas} />}
    </PageLayout>
  );
}
