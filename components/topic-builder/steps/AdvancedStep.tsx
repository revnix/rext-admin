import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, type RadioOption } from "@/components/ui/radio-group";
import { SelectWithCustom } from "@/components/ui/select-with-custom";
import { Textarea } from "@/components/ui/textarea";
import type { TopicBuilderFormData } from "@/types/topic-builder";
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
  errors?: Record<string, string>;
}

export function AdvancedStep({
  formData,
  updateFormData,
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
          <div className="grid gap-2">
            <Label htmlFor="keywords">Keywords/Focus Areas</Label>
            <Input
              id="keywords"
              placeholder="Enter keywords or key phrases (comma-separated)"
              value={formData.keywords || ""}
              onChange={(e) => updateFormData("keywords", e.target.value)}
            />
            {errors?.keywords && (
              <p className="text-sm text-red-500">{errors.keywords}</p>
            )}
          </div>
        </div>

        {/* Exclude/Avoid */}
        <div className="md:col-span-1">
          <div className="grid gap-2">
            <Label htmlFor="exclude">Exclude/Avoid</Label>
            <Input
              id="exclude"
              placeholder="Topics or angles to avoid (comma-separated)"
              value={formData.exclude || ""}
              onChange={(e) => updateFormData("exclude", e.target.value)}
            />
            {errors?.exclude && (
              <p className="text-sm text-red-500">{errors.exclude}</p>
            )}
          </div>
        </div>

        {/* Number of Ideas */}
        <div className="md:col-span-1">
          <div className="grid gap-2">
            <Label htmlFor="num_ideas">Number of Ideas</Label>
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
            {errors?.num_ideas && (
              <p className="text-sm text-red-500">{errors.num_ideas}</p>
            )}
          </div>
        </div>

        {/* Target Region */}
        <div className="md:col-span-1">
          <div className="grid gap-2">
            <Label htmlFor="region">Target Region</Label>
            <SelectWithCustom
              options={REGION_OPTIONS}
              value={formData.region || ""}
              onChange={(value) => updateFormData("region", value)}
              placeholder="Geographic focus (optional)"
            />
            {errors?.region && (
              <p className="text-sm text-red-500">{errors.region}</p>
            )}
          </div>
        </div>

        {/* Content Language */}
        <div className="md:col-span-1">
          <div className="grid gap-2">
            <Label htmlFor="language">Content Language</Label>
            <SelectWithCustom
              options={LANGUAGE_OPTIONS}
              value={formData.language || ""}
              onChange={(value) => updateFormData("language", value)}
              placeholder="What language? (optional)"
            />
            {errors?.language && (
              <p className="text-sm text-red-500">{errors.language}</p>
            )}
          </div>
        </div>

        {/* Content Timing Preference */}
        <div className="md:col-span-1">
          <div className="grid gap-3">
            <Label>Content Timing Preference</Label>
            <RadioGroup
              options={timingPreferenceOptions}
              value={formData.fresh_vs_evergreen || ""}
              onValueChange={(value) =>
                updateFormData("fresh_vs_evergreen", value)
              }
              columns={1}
            />
            {errors?.fresh_vs_evergreen && (
              <p className="text-sm text-red-500">
                {errors.fresh_vs_evergreen}
              </p>
            )}
          </div>
        </div>

        {/* Originality Preference */}
        <div className="md:col-span-1">
          <div className="grid gap-3">
            <Label>Originality Preference</Label>
            <RadioGroup
              options={originalityPreferenceOptions}
              value={formData.safe_vs_original || ""}
              onValueChange={(value) =>
                updateFormData("safe_vs_original", value)
              }
              columns={1}
            />
            {errors?.safe_vs_original && (
              <p className="text-sm text-red-500">{errors.safe_vs_original}</p>
            )}
          </div>
        </div>

        {/* Additional Notes - Full width */}
        <div className="md:col-span-2">
          <div className="grid gap-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any special instructions or context?"
              value={formData.notes || ""}
              onChange={(e) => updateFormData("notes", e.target.value)}
              rows={3}
            />
            {errors?.notes && (
              <p className="text-sm text-red-500">{errors.notes}</p>
            )}
          </div>
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
