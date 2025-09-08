import { useEffect } from "react";
import {
  CheckboxGroup,
  type CheckboxOption,
} from "@/components/ui/checkbox-group";
import { FormField } from "@/components/ui/form-field";
import { Label } from "@/components/ui/label";
import { RadioGroup, type RadioOption } from "@/components/ui/radio-group";
import { DEMOGRAPHIC_AGE_OPTIONS } from "@/data/topic-builder-options";
import {
  getAudienceForIndustry,
  getAudienceOptions,
} from "@/lib/topic-builder-utils";
import type {
  TopicBuilderFormData,
  ValidationResult,
} from "@/types/topic-builder";
import {
  AUDIENCE_SIZE_OPTIONS,
  READER_LEVEL_OPTIONS,
} from "@/types/topic-builder";

interface AudienceStepProps {
  formData: TopicBuilderFormData;
  updateFormData: (
    field: keyof TopicBuilderFormData,
    value: string | string[] | number,
  ) => void;
  validateField?: (field: keyof TopicBuilderFormData) => ValidationResult;
  getFieldError?: (field: keyof TopicBuilderFormData) => string | undefined;
  errors?: Record<string, string>;
}

export function AudienceStep({
  formData,
  updateFormData,
  validateField: _validateField,
  getFieldError,
  errors,
}: AudienceStepProps) {
  const audienceOptions = getAudienceOptions(formData.industry);

  // Auto-update audience options and defaults when industry changes
  useEffect(() => {
    if (formData.industry) {
      const availableAudiences = getAudienceForIndustry(formData.industry);
      const currentAudiences = formData.audience || [];

      if (currentAudiences.length > 0) {
        // Filter out audiences that are no longer valid for the new industry
        const validAudiences = currentAudiences.filter((audience) =>
          availableAudiences.includes(audience),
        );

        // Update audience selection if some became invalid
        if (validAudiences.length !== currentAudiences.length) {
          updateFormData("audience", validAudiences);
        }
      }
    }
  }, [formData.industry, formData.audience, updateFormData]);

  // Convert SelectOption to RadioOption format
  const readerLevelOptions: RadioOption[] = READER_LEVEL_OPTIONS.map(
    (option) => ({
      label: option.label,
      value: option.value,
      description: getReaderLevelDescription(option.value),
    }),
  );

  const audienceSizeOptions: RadioOption[] = AUDIENCE_SIZE_OPTIONS.map(
    (option) => ({
      label: option.label,
      value: option.value,
      description: getAudienceSizeDescription(option.value),
    }),
  );

  // Convert to CheckboxOption format
  const ageGroupOptions: CheckboxOption[] = DEMOGRAPHIC_AGE_OPTIONS.map(
    (option) => ({
      label: option.label,
      value: option.value,
    }),
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Target Audience - Full width */}
        <div className="md:col-span-2">
          <FormField
            label="Who are you creating this for?"
            error={getFieldError?.("audience") || errors?.audience}
            isValid={
              (formData.audience?.length ?? 0) > 0 &&
              !getFieldError?.("audience")
            }
            required
            htmlFor="audience"
          >
            <CheckboxGroup
              options={audienceOptions}
              value={formData.audience || []}
              onValueChange={(selected) => updateFormData("audience", selected)}
              columns={4}
              maxSelections={5}
            />
          </FormField>
        </div>

        {/* Reader Experience Level */}
        <div className="md:col-span-2">
          <FormField
            label="What's their experience level?"
            error={getFieldError?.("reader_level") || errors?.reader_level}
            isValid={
              !!formData.reader_level && !getFieldError?.("reader_level")
            }
          >
            <RadioGroup
              options={readerLevelOptions}
              value={formData.reader_level || ""}
              onValueChange={(value) => updateFormData("reader_level", value)}
              columns={3}
            />
          </FormField>
        </div>

        {/* Audience Size */}
        <div className="md:col-span-2">
          <FormField
            label="How big is your audience?"
            error={getFieldError?.("audience_size") || errors?.audience_size}
            isValid={
              !!formData.audience_size && !getFieldError?.("audience_size")
            }
          >
            <RadioGroup
              options={audienceSizeOptions}
              value={formData.audience_size || ""}
              onValueChange={(value) => updateFormData("audience_size", value)}
              columns={4}
            />
          </FormField>
        </div>

        {/* Age Groups */}
        <div className="md:col-span-2">
          <div className="grid gap-3">
            <Label>Age Groups (Optional)</Label>
            <CheckboxGroup
              options={ageGroupOptions}
              value={formData.demographic_age}
              onValueChange={(selected) =>
                updateFormData("demographic_age", selected)
              }
              columns={2}
              maxSelections={4}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper functions for descriptions
function getReaderLevelDescription(value: string): string {
  switch (value) {
    case "beginner":
      return "New to the topic, needs basic explanations";
    case "intermediate":
      return "Some knowledge, wants practical insights";
    case "expert":
      return "Advanced understanding, seeks expert analysis";
    default:
      return "";
  }
}

function getAudienceSizeDescription(value: string): string {
  switch (value) {
    case "small":
      return "Niche community or specialized group";
    case "medium":
      return "Growing audience with engaged followers";
    case "large":
      return "Established audience with broad reach";
    case "massive":
      return "Large-scale audience or viral potential";
    default:
      return "";
  }
}
