import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
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
        These options are optional but can help generate more targeted topics.
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Number of TopicsSlider */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <Label htmlFor="num_topics">Number of topics</Label>
            <span className="text-sm font-medium bg-muted px-2 py-1 rounded">
              {formData.num_topics || 5}
            </span>
          </div>
          <Slider
            id="num_topics"
            min={1}
            max={20}
            step={1}
            value={[formData.num_topics || 5]}
            onValueChange={(values: number[]) =>
              updateFormData("num_topics", values[0])
            }
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>1 topic</span>
            <span>20 topics</span>
          </div>
        </div>
      </div>
    </div>
  );
}
