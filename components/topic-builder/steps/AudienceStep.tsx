import { useEffect } from "react";
import { CheckboxGroup } from "@/components/ui/checkbox-group";
import { FormField } from "@/components/ui/form-field";
import {
  getAudienceForIndustry,
  getAudienceOptions,
} from "@/lib/topic-builder-utils";
import type {
  TopicBuilderFormData,
  ValidationResult,
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
      </div>
    </div>
  );
}
