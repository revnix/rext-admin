import {
  CheckboxGroup,
  type CheckboxOption,
} from "@/components/ui/checkbox-group";
import { FormField, ValidationInput } from "@/components/ui/form-field";
import type {
  TopicBuilderFormData,
  ValidationResult,
} from "@/types/topic-builder";
import { PURPOSE_OPTIONS } from "@/types/topic-builder";

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
