import { FormField, ValidationInput } from "@/components/ui/form-field";
import { RadioGroup, type RadioOption } from "@/components/ui/radio-group";
import { SelectWithCustom } from "@/components/ui/select-with-custom";
import { Textarea } from "@/components/ui/textarea";
import type {
  TopicBuilderFormData,
  ValidationResult,
} from "@/types/topic-builder";
import {
  LANGUAGE_OPTIONS,
  ORIGINALITY_TOGGLE_OPTIONS,
  PREFERENCE_TOGGLE_OPTIONS,
  REGION_OPTIONS,
} from "@/types/topic-builder";

interface AdvancedStepProps {
  formData: TopicBuilderFormData;
  updateFormData: (
    field: keyof TopicBuilderFormData,
    value: string | string[] | number,
  ) => void;
  validateField?: (field: keyof TopicBuilderFormData) => ValidationResult;
  getFieldError?: (field: keyof TopicBuilderFormData) => string | undefined;
  errors?: Record<string, string>;
}

export function AdvancedStep({
  formData,
  updateFormData,
  validateField: _validateField,
  getFieldError,
  errors,
}: AdvancedStepProps) {
  // Convert toggle options to RadioOption format with descriptions
  const timingPreferenceOptions: RadioOption[] = PREFERENCE_TOGGLE_OPTIONS.map(
    (option) => ({
      label: option.label,
      value: option.value,
      description: getTimingPreferenceDescription(option.value),
    }),
  );

  const originalityPreferenceOptions: RadioOption[] =
    ORIGINALITY_TOGGLE_OPTIONS.map((option) => ({
      label: option.label,
      value: option.value,
      description: getOriginalityPreferenceDescription(option.value),
    }));

  return (
    <div className="space-y-6">
      <div className="text-sm text-muted-foreground mb-4">
        These options are optional but can help generate more targeted ideas.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Keywords/Focus Areas */}
        <div className="md:col-span-1">
          <FormField
            label="Keywords/Focus Areas"
            error={getFieldError?.("keywords") || errors?.keywords}
            htmlFor="keywords"
          >
            <ValidationInput
              id="keywords"
              placeholder="Enter keywords or key phrases (comma-separated)"
              value={formData.keywords || ""}
              onChange={(e) => updateFormData("keywords", e.target.value)}
              error={getFieldError?.("keywords") || errors?.keywords}
            />
          </FormField>
        </div>

        {/* Exclude/Avoid */}
        <div className="md:col-span-1">
          <FormField
            label="Exclude/Avoid"
            error={getFieldError?.("exclude") || errors?.exclude}
            htmlFor="exclude"
          >
            <ValidationInput
              id="exclude"
              placeholder="Topics or angles to avoid (comma-separated)"
              value={formData.exclude || ""}
              onChange={(e) => updateFormData("exclude", e.target.value)}
              error={getFieldError?.("exclude") || errors?.exclude}
            />
          </FormField>
        </div>

        {/* Number of Ideas */}
        <div className="md:col-span-1">
          <FormField
            label="Number of Ideas"
            error={getFieldError?.("num_ideas") || errors?.num_ideas}
            htmlFor="num_ideas"
          >
            <SelectWithCustom
              options={[
                { label: "3 ideas", value: "3" },
                { label: "5 ideas", value: "5" },
                { label: "10 ideas", value: "10" },
                { label: "15 ideas", value: "15" },
              ]}
              value={formData.num_ideas.toString()}
              onChange={(value) =>
                updateFormData("num_ideas", parseInt(value, 10))
              }
              placeholder="How many topic ideas?"
            />
          </FormField>
        </div>

        {/* Target Region */}
        <div className="md:col-span-1">
          <FormField
            label="Target Region"
            error={getFieldError?.("region") || errors?.region}
            htmlFor="region"
          >
            <SelectWithCustom
              options={REGION_OPTIONS}
              value={formData.region || ""}
              onChange={(value) => updateFormData("region", value)}
              placeholder="Geographic focus (optional)"
            />
          </FormField>
        </div>

        {/* Content Language */}
        <div className="md:col-span-1">
          <FormField
            label="Content Language"
            error={getFieldError?.("language") || errors?.language}
            htmlFor="language"
          >
            <SelectWithCustom
              options={LANGUAGE_OPTIONS}
              value={formData.language || ""}
              onChange={(value) => updateFormData("language", value)}
              placeholder="What language? (optional)"
            />
          </FormField>
        </div>

        {/* Content Timing Preference */}
        <div className="md:col-span-1">
          <FormField
            label="Content Timing Preference"
            error={
              getFieldError?.("fresh_vs_evergreen") ||
              errors?.fresh_vs_evergreen
            }
          >
            <RadioGroup
              options={timingPreferenceOptions}
              value={formData.fresh_vs_evergreen || ""}
              onValueChange={(value) =>
                updateFormData("fresh_vs_evergreen", value)
              }
              columns={1}
            />
          </FormField>
        </div>

        {/* Originality Preference */}
        <div className="md:col-span-1">
          <FormField
            label="Originality Preference"
            error={
              getFieldError?.("safe_vs_original") || errors?.safe_vs_original
            }
          >
            <RadioGroup
              options={originalityPreferenceOptions}
              value={formData.safe_vs_original || ""}
              onValueChange={(value) =>
                updateFormData("safe_vs_original", value)
              }
              columns={1}
            />
          </FormField>
        </div>

        {/* Additional Notes - Full width */}
        <div className="md:col-span-2">
          <FormField
            label="Additional Notes"
            error={getFieldError?.("notes") || errors?.notes}
            htmlFor="notes"
          >
            <Textarea
              id="notes"
              placeholder="Any special instructions or context?"
              value={formData.notes || ""}
              onChange={(e) => updateFormData("notes", e.target.value)}
              rows={3}
            />
          </FormField>
        </div>
      </div>
    </div>
  );
}

// Helper functions for descriptions
function getTimingPreferenceDescription(value: string): string {
  switch (value) {
    case "fresh":
      return "Current trends and timely topics";
    case "evergreen":
      return "Timeless content that stays relevant";
    case "balanced":
      return "Mix of trending and timeless content";
    default:
      return "";
  }
}

function getOriginalityPreferenceDescription(value: string): string {
  switch (value) {
    case "safe":
      return "Proven approaches and established ideas";
    case "original":
      return "Unique angles and contrarian perspectives";
    case "balanced":
      return "Mix of proven and innovative approaches";
    default:
      return "";
  }
}
