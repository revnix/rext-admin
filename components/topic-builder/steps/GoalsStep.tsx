import {
  CheckboxGroup,
  type CheckboxOption,
} from "@/components/ui/checkbox-group";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { TopicBuilderFormData } from "@/types/topic-builder";
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
  errors?: Record<string, string>;
}

export function GoalsStep({
  formData,
  updateFormData,
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
          <div className="grid gap-3">
            <Label>Content Purpose *</Label>
            <CheckboxGroup
              options={purposeOptions}
              value={formData.purpose}
              onValueChange={(selected) => updateFormData("purpose", selected)}
              columns={2}
              maxSelections={3}
            />
            {errors?.purpose && (
              <p className="text-sm text-red-500">{errors.purpose}</p>
            )}
          </div>
        </div>

        {/* Purpose Other */}
        {formData.purpose.includes("other") && (
          <div className="md:col-span-1">
            <div className="grid gap-2">
              <Label htmlFor="purpose_other">Specify Purpose</Label>
              <Input
                id="purpose_other"
                placeholder="Please specify your purpose"
                value={formData.purpose_other || ""}
                onChange={(e) =>
                  updateFormData("purpose_other", e.target.value)
                }
              />
              {errors?.purpose_other && (
                <p className="text-sm text-red-500">{errors.purpose_other}</p>
              )}
            </div>
          </div>
        )}

        {/* Content Goals */}
        <div className="md:col-span-1">
          <div className="grid gap-3">
            <Label>Content Goals *</Label>
            <CheckboxGroup
              options={contentGoalOptions}
              value={formData.content_goal}
              onValueChange={(selected) =>
                updateFormData("content_goal", selected)
              }
              columns={1}
              maxSelections={3}
            />
            {errors?.content_goal && (
              <p className="text-sm text-red-500">{errors.content_goal}</p>
            )}
          </div>
        </div>

        {/* Tone & Style */}
        <div className="md:col-span-1">
          <div className="grid gap-3">
            <Label>Tone & Style *</Label>
            <CheckboxGroup
              options={toneOptions}
              value={formData.tone}
              onValueChange={(selected) => updateFormData("tone", selected)}
              columns={1}
              maxSelections={3}
            />
            {errors?.tone && (
              <p className="text-sm text-red-500">{errors.tone}</p>
            )}
          </div>
        </div>

        {/* Tone Other */}
        {formData.tone.includes("other") && (
          <div className="md:col-span-1">
            <div className="grid gap-2">
              <Label htmlFor="tone_other">Specify Tone</Label>
              <Input
                id="tone_other"
                placeholder="Please specify your preferred tone"
                value={formData.tone_other || ""}
                onChange={(e) => updateFormData("tone_other", e.target.value)}
              />
              {errors?.tone_other && (
                <p className="text-sm text-red-500">{errors.tone_other}</p>
              )}
            </div>
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
