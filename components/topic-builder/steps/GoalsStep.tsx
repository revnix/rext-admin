import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MultiSelect } from "@/components/ui/multi-select";
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
  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="purpose">Content Purpose *</Label>
          <MultiSelect
            options={PURPOSE_OPTIONS}
            selected={formData.purpose}
            onChange={(selected) => updateFormData("purpose", selected)}
            placeholder="What's the main purpose? (select multiple)"
            allowCustom={true}
          />
          {errors?.purpose && (
            <p className="text-sm text-red-500">{errors.purpose}</p>
          )}
        </div>

        {formData.purpose.includes("other") && (
          <div className="grid gap-2">
            <Label htmlFor="purpose_other">Specify Purpose</Label>
            <Input
              id="purpose_other"
              placeholder="Please specify your purpose"
              value={formData.purpose_other || ""}
              onChange={(e) => updateFormData("purpose_other", e.target.value)}
            />
            {errors?.purpose_other && (
              <p className="text-sm text-red-500">{errors.purpose_other}</p>
            )}
          </div>
        )}

        <div className="grid gap-2">
          <Label htmlFor="content_goal">Content Goals *</Label>
          <MultiSelect
            options={CONTENT_GOAL_OPTIONS}
            selected={formData.content_goal}
            onChange={(selected) => updateFormData("content_goal", selected)}
            placeholder="What type of content? (select multiple)"
            allowCustom={true}
          />
          {errors?.content_goal && (
            <p className="text-sm text-red-500">{errors.content_goal}</p>
          )}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="tone">Tone & Style *</Label>
          <MultiSelect
            options={TONE_OPTIONS}
            selected={formData.tone}
            onChange={(selected) => updateFormData("tone", selected)}
            placeholder="What tone should the content have? (select multiple)"
            allowCustom={true}
          />
          {errors?.tone && (
            <p className="text-sm text-red-500">{errors.tone}</p>
          )}
        </div>

        {formData.tone.includes("other") && (
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
        )}
      </div>
    </div>
  );
}
