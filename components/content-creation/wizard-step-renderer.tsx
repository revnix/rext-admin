"use client";

import type { WizardDependencyEngine } from "@/lib/content-creation/dependency-engine";
import type {
  ContentCreationFormData,
  PartialContentCreationFormData,
  WizardAction,
  WizardStepProps,
} from "@/types/content-creation";
import { AudienceGoalsStep } from "./steps/audience-goals-step";
import { ContentStructureStep } from "./steps/content-structure-step";
import { ResearchSettingsStep } from "./steps/research-settings-step";
import { ReviewLaunchStep } from "./steps/review-launch-step";
import { TopicContentStep } from "./steps/topic-content-step";
import { VoiceStyleStep } from "./steps/voice-style-step";

interface WizardStepRendererProps extends WizardStepProps {
  dependencyEngine: WizardDependencyEngine;
  dispatch: React.Dispatch<WizardAction>;
  onLaunch?: (formData: ContentCreationFormData) => Promise<void>;
  onSaveDraft?: (formData: PartialContentCreationFormData) => Promise<void>;
  onGoToStep?: (stepIndex: number) => void;
}

/**
 * Wizard Step Renderer Component
 *
 * This component renders individual wizard steps based on their step ID.
 * It acts as a router to determine which step component to render.
 */
export function WizardStepRenderer({
  step,
  formData,
  errors,
  touched,
  isActive,
  onFieldChange,
  onFieldTouch,
  dependencyEngine,
  dispatch,
  onLaunch,
  onSaveDraft,
  onGoToStep,
}: WizardStepRendererProps) {
  // Route to the appropriate step component based on step ID
  switch (step.id) {
    case "topic-content":
      return (
        <TopicContentStep
          step={step}
          formData={formData}
          errors={errors}
          touched={touched}
          isActive={isActive}
          onFieldChange={onFieldChange}
          onFieldTouch={onFieldTouch}
          dependencyEngine={dependencyEngine}
          dispatch={dispatch}
        />
      );

    case "audience-goals":
      return (
        <AudienceGoalsStep
          step={step}
          formData={formData}
          errors={errors}
          touched={touched}
          isActive={isActive}
          onFieldChange={onFieldChange}
          onFieldTouch={onFieldTouch}
          dependencyEngine={dependencyEngine}
        />
      );

    case "voice-style":
      return (
        <VoiceStyleStep
          step={step}
          formData={formData}
          errors={errors}
          touched={touched}
          isActive={isActive}
          onFieldChange={onFieldChange}
          onFieldTouch={onFieldTouch}
          dependencyEngine={dependencyEngine}
        />
      );

    case "content-structure":
      return (
        <ContentStructureStep
          step={step}
          formData={formData}
          errors={errors}
          touched={touched}
          isActive={isActive}
          onFieldChange={onFieldChange}
          onFieldTouch={onFieldTouch}
          dependencyEngine={dependencyEngine}
        />
      );

    case "research-settings":
      return (
        <ResearchSettingsStep
          step={step}
          formData={formData}
          errors={errors}
          touched={touched}
          isActive={isActive}
          onFieldChange={onFieldChange}
          onFieldTouch={onFieldTouch}
          dependencyEngine={dependencyEngine}
        />
      );

    case "review-launch":
      return (
        <ReviewLaunchStep
          step={step}
          formData={formData}
          errors={errors}
          touched={touched}
          isActive={isActive}
          onFieldChange={onFieldChange}
          onFieldTouch={onFieldTouch}
          dependencyEngine={dependencyEngine}
          onGoToStep={onGoToStep}
        />
      );

    default:
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold">{step.title}</h2>
            <p className="text-muted-foreground mt-2">{step.description}</p>
          </div>
          <div className="bg-destructive/10 p-6 rounded-lg text-center">
            <p className="text-sm text-destructive">Unknown step: {step.id}</p>
          </div>
        </div>
      );
  }
}
