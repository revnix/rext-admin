import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectWithCustom } from "@/components/ui/select-with-custom";
import type { TopicBuilderFormData } from "@/types/topic-builder";
import { INDUSTRY_OPTIONS } from "@/types/topic-builder";

interface IndustryStepProps {
  formData: TopicBuilderFormData;
  updateFormData: (
    field: keyof TopicBuilderFormData,
    value: string | string[] | number,
  ) => void;
  errors?: Record<string, string>;
}

export function IndustryStep({
  formData,
  updateFormData,
  errors,
}: IndustryStepProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        {formData.wizardMode === "subject-first" && (
          <div className="grid gap-2">
            <Label htmlFor="subject">Your Subject/Topic *</Label>
            <Input
              id="subject"
              placeholder="What specific subject do you want to write about?"
              value={formData.subject || ""}
              onChange={(e) => updateFormData("subject", e.target.value)}
            />
            {errors?.subject && (
              <p className="text-sm text-red-500">{errors.subject}</p>
            )}
          </div>
        )}

        <div className="grid gap-2">
          <Label htmlFor="industry">Industry/Domain *</Label>
          <SelectWithCustom
            options={INDUSTRY_OPTIONS}
            value={formData.industry}
            onChange={(value) => updateFormData("industry", value)}
            placeholder="Which industry or domain?"
            allowCustom={true}
          />
          {errors?.industry && (
            <p className="text-sm text-red-500">{errors.industry}</p>
          )}
        </div>

        {formData.industry === "other" && (
          <div className="grid gap-2">
            <Label htmlFor="industry_other">Specify Industry</Label>
            <Input
              id="industry_other"
              placeholder="Please specify your industry"
              value={formData.industry_other || ""}
              onChange={(e) => updateFormData("industry_other", e.target.value)}
            />
            {errors?.industry_other && (
              <p className="text-sm text-red-500">{errors.industry_other}</p>
            )}
          </div>
        )}

        {formData.wizardMode === "industry-first" && (
          <div className="grid gap-2">
            <Label htmlFor="focus">Specific Focus (Optional)</Label>
            <Input
              id="focus"
              placeholder="Any specific area within this industry?"
              value={formData.focus || ""}
              onChange={(e) => updateFormData("focus", e.target.value)}
            />
            {errors?.focus && (
              <p className="text-sm text-red-500">{errors.focus}</p>
            )}
          </div>
        )}

        {formData.is_ymyl && (
          <div className="rounded-lg bg-yellow-50 p-4 border border-yellow-200">
            <p className="text-sm text-yellow-800">
              <strong>YMYL Content Detected:</strong> This industry involves
              health, finance, or legal topics. We'll keep suggestions factual
              and non-advisory.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
