import { Label } from "@/components/ui/label";
import { MultiSelect } from "@/components/ui/multi-select";
import { SelectWithCustom } from "@/components/ui/select-with-custom";
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

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        <div className="grid gap-2">
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

        <div className="grid gap-2">
          <Label htmlFor="reader_level">Reader Experience Level</Label>
          <SelectWithCustom
            options={READER_LEVEL_OPTIONS}
            value={formData.reader_level || ""}
            onChange={(value) => updateFormData("reader_level", value)}
            placeholder="What's their expertise level?"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="audience_size">Audience Size</Label>
          <SelectWithCustom
            options={AUDIENCE_SIZE_OPTIONS}
            value={formData.audience_size || ""}
            onChange={(value) => updateFormData("audience_size", value)}
            placeholder="How large is your target audience?"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="demographicAge">Age Groups</Label>
          <MultiSelect
            options={DEMOGRAPHIC_AGE_OPTIONS}
            selected={formData.demographic_age}
            onChange={(selected) => updateFormData("demographic_age", selected)}
            placeholder="What age groups? (optional)"
            allowCustom={true}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="demographicLocation">Geographic Focus</Label>
          <MultiSelect
            options={DEMOGRAPHIC_LOCATION_OPTIONS}
            selected={formData.demographic_location}
            onChange={(selected) =>
              updateFormData("demographic_location", selected)
            }
            placeholder="Where is your audience? (optional)"
            allowCustom={true}
          />
        </div>
      </div>
    </div>
  );
}
