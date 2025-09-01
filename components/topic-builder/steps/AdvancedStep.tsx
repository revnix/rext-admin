import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  return (
    <div className="space-y-6">
      <div className="text-sm text-muted-foreground mb-4">
        These options are optional but can help generate more targeted ideas.
      </div>

      <div className="grid gap-4">
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

        <div className="grid gap-2">
          <Label htmlFor="fresh_vs_evergreen">Content Timing Preference</Label>
          <SelectWithCustom
            options={PREFERENCE_TOGGLE_OPTIONS}
            value={formData.fresh_vs_evergreen || ""}
            onChange={(value) => updateFormData("fresh_vs_evergreen", value)}
            placeholder="Fresh & trending vs evergreen?"
          />
          {errors?.fresh_vs_evergreen && (
            <p className="text-sm text-red-500">{errors.fresh_vs_evergreen}</p>
          )}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="safe_vs_original">Originality Preference</Label>
          <SelectWithCustom
            options={ORIGINALITY_TOGGLE_OPTIONS}
            value={formData.safe_vs_original || ""}
            onChange={(value) => updateFormData("safe_vs_original", value)}
            placeholder="Safe & conventional vs original?"
          />
          {errors?.safe_vs_original && (
            <p className="text-sm text-red-500">{errors.safe_vs_original}</p>
          )}
        </div>

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
  );
}
