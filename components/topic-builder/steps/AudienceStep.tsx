import {
  CheckboxGroup,
  type CheckboxOption,
} from "@/components/ui/checkbox-group";
import { Label } from "@/components/ui/label";
import { MultiSelect } from "@/components/ui/multi-select";
import { RadioGroup, type RadioOption } from "@/components/ui/radio-group";
import {
  DEMOGRAPHIC_AGE_OPTIONS,
  DEMOGRAPHIC_LOCATION_OPTIONS,
} from "@/data/topic-builder-options";
import { getAudienceOptions } from "@/lib/topic-builder-utils";
import type { TopicBuilderFormData } from "@/types/topic-builder";
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
  errors?: Record<string, string>;
}

export function AudienceStep({
  formData,
  updateFormData,
  errors,
}: AudienceStepProps) {
  const audienceOptions = getAudienceOptions(formData.industry);

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

  const locationOptions: CheckboxOption[] = DEMOGRAPHIC_LOCATION_OPTIONS.map(
    (option) => ({
      label: option.label,
      value: option.value,
    }),
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-6">
        <div className="grid gap-3">
          <Label htmlFor="audience">Target Audience *</Label>
          <MultiSelect
            options={audienceOptions}
            selected={formData.audience ? [formData.audience] : []}
            onChange={(selected) =>
              updateFormData("audience", selected[0] || "")
            }
            placeholder="Who are you writing for?"
            allowCustom={true}
          />
          {errors?.audience && (
            <p className="text-sm text-red-500">{errors.audience}</p>
          )}
        </div>

        <div className="grid gap-3">
          <Label>Reader Experience Level</Label>
          <RadioGroup
            options={readerLevelOptions}
            value={formData.reader_level || ""}
            onValueChange={(value) => updateFormData("reader_level", value)}
            columns={3}
          />
        </div>

        <div className="grid gap-3">
          <Label>Audience Size</Label>
          <RadioGroup
            options={audienceSizeOptions}
            value={formData.audience_size || ""}
            onValueChange={(value) => updateFormData("audience_size", value)}
            columns={2}
          />
        </div>

        <div className="grid gap-3">
          <Label>Age Groups (Optional)</Label>
          <CheckboxGroup
            options={ageGroupOptions}
            value={formData.demographic_age}
            onValueChange={(selected) =>
              updateFormData("demographic_age", selected)
            }
            columns={3}
            maxSelections={4}
          />
        </div>

        <div className="grid gap-3">
          <Label>Geographic Focus (Optional)</Label>
          <CheckboxGroup
            options={locationOptions}
            value={formData.demographic_location}
            onValueChange={(selected) =>
              updateFormData("demographic_location", selected)
            }
            columns={2}
            maxSelections={3}
          />
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
