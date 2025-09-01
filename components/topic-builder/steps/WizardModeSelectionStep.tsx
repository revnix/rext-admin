import { Label } from "@/components/ui/label";
import { SelectWithCustom } from "@/components/ui/select-with-custom";
import type { TopicBuilderFormData } from "@/types/topic-builder";
import { WIZARD_MODE_OPTIONS } from "@/types/topic-builder";

interface WizardModeSelectionStepProps {
  formData: TopicBuilderFormData;
  updateFormData: (
    field: keyof TopicBuilderFormData,
    value: string | string[] | number,
  ) => void;
  errors?: Record<string, string>;
}

export function WizardModeSelectionStep({
  formData,
  updateFormData,
  errors,
}: WizardModeSelectionStepProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="wizardMode">Choose Your Approach *</Label>
          <SelectWithCustom
            options={WIZARD_MODE_OPTIONS}
            value={formData.wizardMode}
            onChange={(value) => updateFormData("wizardMode", value)}
            placeholder="How would you like to start?"
          />
          {errors?.wizardMode && (
            <p className="text-sm text-red-500">{errors.wizardMode}</p>
          )}
        </div>
      </div>
    </div>
  );
}
