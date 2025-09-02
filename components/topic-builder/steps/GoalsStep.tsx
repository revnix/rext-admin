import {
  CheckboxGroup,
  type CheckboxOption,
} from "@/components/ui/checkbox-group";
import { FormField, ValidationInput } from "@/components/ui/form-field";
import type {
  TopicBuilderFormData,
  ValidationResult,
} from "@/types/topic-builder";
import {
  CONTENT_GOAL_OPTIONS,
  PURPOSE_OPTIONS,
  TONE_OPTIONS,
} from "@/types/topic-builder";

interface GoalsStepProps {
  formData: TopicBuilderFormData;
  updateFormData: (
    field: keyof TopicBuilderFormData,
    value: string | string[] | number,
  ) => void;
  validateField?: (field: keyof TopicBuilderFormData) => ValidationResult;
  getFieldError?: (field: keyof TopicBuilderFormData) => string | undefined;
  errors?: Record<string, string>;
}

export function GoalsStep({
  formData,
  updateFormData,
  validateField: _validateField,
  getFieldError,
  errors,
}: GoalsStepProps) {
  // Convert SelectOption to CheckboxOption format with descriptions
  const purposeOptions: CheckboxOption[] = PURPOSE_OPTIONS.map((option) => ({
    label: option.label,
    value: option.value,
    description: getPurposeDescription(option.value),
  }));

  const contentGoalOptions: CheckboxOption[] = CONTENT_GOAL_OPTIONS.map(
    (option) => ({
      label: option.label,
      value: option.value,
      description: getContentGoalDescription(option.value),
    }),
  );

  const toneOptions: CheckboxOption[] = TONE_OPTIONS.map((option) => ({
    label: option.label,
    value: option.value,
    description: getToneDescription(option.value),
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Content Purpose - Full width */}
        <div className="md:col-span-2">
          <FormField
            label="What do you want to achieve?"
            error={getFieldError?.("purpose") || errors?.purpose}
            isValid={formData.purpose.length > 0 && !getFieldError?.("purpose")}
            required
          >
            <CheckboxGroup
              options={purposeOptions}
              value={formData.purpose}
              onValueChange={(selected) => updateFormData("purpose", selected)}
              columns={4}
              maxSelections={3}
            />
          </FormField>
        </div>

        {/* Purpose Other */}
        {formData.purpose.includes("other") && (
          <div className="md:col-span-1">
            <FormField
              label="Specify Purpose"
              error={getFieldError?.("purpose_other") || errors?.purpose_other}
              isValid={
                !!formData.purpose_other?.trim() &&
                !getFieldError?.("purpose_other")
              }
              required
              htmlFor="purpose_other"
            >
              <ValidationInput
                id="purpose_other"
                placeholder="Please specify your purpose"
                value={formData.purpose_other || ""}
                onChange={(e) =>
                  updateFormData("purpose_other", e.target.value)
                }
                error={
                  getFieldError?.("purpose_other") || errors?.purpose_other
                }
                isValid={
                  !!formData.purpose_other?.trim() &&
                  !getFieldError?.("purpose_other")
                }
              />
            </FormField>
          </div>
        )}

        {/* Content Goals */}
        <div className="md:col-span-2">
          <FormField
            label="What style of content?"
            error={getFieldError?.("content_goal") || errors?.content_goal}
            isValid={
              formData.content_goal.length > 0 &&
              !getFieldError?.("content_goal")
            }
            required
          >
            <CheckboxGroup
              options={contentGoalOptions}
              value={formData.content_goal}
              onValueChange={(selected) =>
                updateFormData("content_goal", selected)
              }
              columns={4}
              maxSelections={3}
            />
          </FormField>
        </div>

        {/* Tone & Style */}
        <div className="md:col-span-2">
          <FormField
            label="What tone should we use?"
            error={getFieldError?.("tone") || errors?.tone}
            isValid={formData.tone.length > 0 && !getFieldError?.("tone")}
            required
          >
            <CheckboxGroup
              options={toneOptions}
              value={formData.tone}
              onValueChange={(selected) => updateFormData("tone", selected)}
              columns={4}
              maxSelections={3}
            />
          </FormField>
        </div>

        {/* Tone Other */}
        {formData.tone.includes("other") && (
          <div className="md:col-span-1">
            <FormField
              label="Specify Tone"
              error={getFieldError?.("tone_other") || errors?.tone_other}
              isValid={
                !!formData.tone_other?.trim() && !getFieldError?.("tone_other")
              }
              required
              htmlFor="tone_other"
            >
              <ValidationInput
                id="tone_other"
                placeholder="Please specify your preferred tone"
                value={formData.tone_other || ""}
                onChange={(e) => updateFormData("tone_other", e.target.value)}
                error={getFieldError?.("tone_other") || errors?.tone_other}
                isValid={
                  !!formData.tone_other?.trim() &&
                  !getFieldError?.("tone_other")
                }
              />
            </FormField>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper functions for descriptions
function getPurposeDescription(value: string): string {
  switch (value) {
    case "educate-inform":
      return "Share knowledge and teach your audience";
    case "entertain-engage":
      return "Create fun, engaging content";
    case "inspire-motivate":
      return "Motivate and inspire action";
    case "persuade-convince":
      return "Influence opinions and decisions";
    case "promote-product":
      return "Showcase products or services";
    case "drive-seo":
      return "Improve search engine visibility";
    case "thought-leadership":
      return "Establish expertise and authority";
    default:
      return "";
  }
}

function getContentGoalDescription(value: string): string {
  switch (value) {
    case "tutorial":
      return "Step-by-step instructional content";
    case "explainer":
      return "Break down complex topics simply";
    case "news-trend":
      return "Cover current events and trends";
    case "opinion-leadership":
      return "Share insights and perspectives";
    case "listicle":
      return "Organized lists and actionable tips";
    case "case-study":
      return "Real-world examples and results";
    case "comparison":
      return "Compare options and alternatives";
    case "review":
      return "Evaluate products or services";
    default:
      return "";
  }
}

function getToneDescription(value: string): string {
  switch (value) {
    case "professional-formal":
      return "Business-appropriate and polished";
    case "casual-conversational":
      return "Relaxed and approachable";
    case "friendly-warm":
      return "Welcoming and personable";
    case "humorous-playful":
      return "Light-hearted and entertaining";
    case "serious-academic":
      return "Scholarly and authoritative";
    case "inspirational":
      return "Uplifting and motivational";
    case "urgent-action":
      return "Compelling and action-oriented";
    default:
      return "";
  }
}
