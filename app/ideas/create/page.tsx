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
import { useRouter } from "next/navigation";
import { PageLayout } from "@/components/page-layout";
import { AILoadingScreen } from "@/components/topic-builder/AILoadingScreen";
import { TopicsList } from "@/components/topic-builder/results/TopicsList";
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
import { ErrorAlert, NetworkStatus } from "@/components/ui/error-alert";
import { APIErrorBoundary } from "@/components/ui/error-boundary";
import { useTopicBuilder } from "@/hooks/use-topic-builder";
import { useTopicStorage } from "@/hooks/use-topic-storage";
import type { GeneratedTopic } from "@/types/topic-builder";

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
    title: "Advanced Options",
    description: "Add notes and choose idea count",
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
  const router = useRouter();

  const {
    formData,
    currentStep,
    errors,
    generatedTopics,
    isGenerating,
    generationError,
    isOnline,
    updateFormData,
    nextStep,
    prevStep,
    goToStep,
    isStepCompleted,
    validateField,
    getFieldError,
    generateTopics,
    clearTopics,
    retryGeneration,
    clearGenerationError,
  } = useTopicBuilder();

  const {
    saveTopic,
    saveTopics,
    removeTopic,
    exportTopics,
    error: storageError,
    clearError: clearStorageError,
  } = useTopicStorage();

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

  const handleTopicSave = async (topicId: string) => {
    const topic = generatedTopics.find((t) => t.id === topicId);
    if (topic) {
      saveTopic(topic);
      console.log("Topic saved to localStorage:", topicId);
    }
  };

  const handleBulkSave = async (topicIds: string[]) => {
    const topicsToSave = generatedTopics.filter((topic) =>
      topicIds.includes(topic.id),
    );
    saveTopics(topicsToSave);
    console.log("Bulk saved topics to localStorage:", topicIds);
  };

  const handleTopicEdit = async (
    topicId: string,
    updates: Partial<GeneratedTopic>,
  ) => {
    // TODO: Implement topic editing functionality
    console.log("Editing topic:", topicId, updates);
    // In a real implementation, this would update the topic in state/API
  };

  const handleTopicRegenerate = async (topicId: string) => {
    // TODO: Implement single topic regeneration
    console.log("Regenerating topic:", topicId);
    // In a real implementation, this would call the API to regenerate just this topic
  };

  const handleTopicExport = async (
    _topics: GeneratedTopic[],
    format: "json" | "csv",
  ) => {
    exportTopics(format);
    console.log("Exporting saved topics:", format);
  };

  const handleTopicDelete = async (topicId: string) => {
    removeTopic(topicId);
    console.log("Topic deleted from localStorage:", topicId);
  };

  const handleBackToWizard = () => {
    clearTopics();
    // Optionally reset to step 6 for review
    goToStep(6);
  };

  const handleRegenerateTopics = async () => {
    clearTopics();
    await generateTopics();
  };

  const handleNavigateToIdeas = () => {
    router.push("/ideas");
  };

  const handleGenerateNew = () => {
    clearTopics();
    goToStep(1);
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
            onRestart={() => goToStep(1)}
            isGenerating={isGenerating}
            generationError={generationError}
            onRetry={retryGeneration}
            onClearError={clearGenerationError}
          />
        );

      default:
        return null;
    }
  };

  const currentStepData = steps[currentStep - 1];

  // Show results if we have generated topics
  const showResults = generatedTopics.length > 0 && !isGenerating;

  return (
    <PageLayout
      title="Topic Builder"
      description="Generate AI-powered content topic ideas for your industry"
      breadcrumbs={breadcrumbs}
      className="p-0"
    >
      {showResults ? (
        // Results View
        <APIErrorBoundary onRetry={retryGeneration}>
          <div className="flex-1 p-6">
            <TopicsList
              topics={generatedTopics}
              onTopicSave={handleTopicSave}
              onTopicEdit={handleTopicEdit}
              onTopicRegenerate={handleTopicRegenerate}
              onTopicExport={handleTopicExport}
              onTopicDelete={handleTopicDelete}
              onBulkSave={handleBulkSave}
              onBackToWizard={handleBackToWizard}
              onRegenerateTopics={handleRegenerateTopics}
              onNavigateToIdeas={handleNavigateToIdeas}
              onGenerateNew={handleGenerateNew}
            />
          </div>
        </APIErrorBoundary>
      ) : (
        // Wizard View
        <div className="flex h-full">
          {/* Network Status - show when offline */}
          {!isOnline && (
            <div className="fixed top-4 right-4 z-50">
              <NetworkStatus />
            </div>
          )}

          {/* Sidebar */}
          <APIErrorBoundary onRetry={retryGeneration}>
            <WizardSidebar
              steps={steps}
              currentStep={currentStep}
              onStepClick={goToStep}
              isStepCompleted={isStepCompleted}
              errors={errors}
              className="hidden lg:block"
            />
          </APIErrorBoundary>

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
                  <CardDescription>
                    {currentStepData.description}
                  </CardDescription>

                  {/* Generation Error Display */}
                  {generationError && (
                    <div className="mt-4">
                      <ErrorAlert
                        error={generationError}
                        operation="topic_generation"
                        onRetry={retryGeneration}
                        onGoBack={() => goToStep(Math.max(1, currentStep - 1))}
                        onContactSupport={() => {
                          // TODO: Implement support contact functionality
                          console.log("Contact support clicked");
                        }}
                      />
                    </div>
                  )}

                  {/* Storage Error Display */}
                  {storageError && (
                    <div className="mt-4">
                      <ErrorAlert
                        error={{
                          type: "unknown_error",
                          message: storageError,
                          severity: "medium",
                          recoveryActions: ["retry"],
                          isRetryable: true,
                          timestamp: new Date().toISOString(),
                        }}
                        operation="data_save"
                        onRetry={clearStorageError}
                        onGoBack={() => clearStorageError()}
                        onContactSupport={() => {
                          console.log(
                            "Storage error - contact support clicked",
                          );
                        }}
                      />
                    </div>
                  )}

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
                  <APIErrorBoundary onRetry={retryGeneration}>
                    {renderStepContent()}
                  </APIErrorBoundary>
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
      )}

      {/* AI Loading Modal */}
      {isGenerating && <AILoadingScreen numIdeas={formData.num_ideas} />}
    </PageLayout>
  );
}
