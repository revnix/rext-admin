import { FormField } from "@/components/ui/form-field";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import type {
  TopicBuilderFormData,
  ValidationResult,
} from "@/types/topic-builder";

interface AdvancedStepProps {
  formData: TopicBuilderFormData;
  updateFormData: (
    field: keyof TopicBuilderFormData,
    value: string | string[] | number,
  ) => void;
  validateField?: (field: keyof TopicBuilderFormData) => ValidationResult;
  getFieldError?: (field: keyof TopicBuilderFormData) => string | undefined;
  errors?: Record<string, string>;
}

export function AdvancedStep({
  formData,
  updateFormData,
  validateField: _validateField,
  getFieldError,
  errors,
}: AdvancedStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-sm text-muted-foreground mb-4">
        These options are optional but can help generate more targeted ideas.
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Additional Notes - First and larger */}
        <div>
          <FormField
            label="Any other requirements?"
            error={getFieldError?.("notes") || errors?.notes}
            htmlFor="notes"
          >
            <Textarea
              id="notes"
              placeholder="Any additional context, requirements, or special instructions..."
              value={formData.notes || ""}
              onChange={(e) => updateFormData("notes", e.target.value)}
              className="min-h-[120px] resize-none"
            />
          </FormField>
        </div>

        {/* Number of Ideas Slider */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <Label htmlFor="num_ideas">Number of topic ideas</Label>
            <span className="text-sm font-medium bg-muted px-2 py-1 rounded">
              {formData.num_ideas || 5}
            </span>
          </div>
          <Slider
            id="num_ideas"
            min={1}
            max={20}
            step={1}
            value={[formData.num_ideas || 5]}
            onValueChange={(values: number[]) =>
              updateFormData("num_ideas", values[0])
            }
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>1 idea</span>
            <span>20 ideas</span>
          </div>
        </div>
      </div>
    </div>
  );
}
