import { FormField, ValidationInput } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, type RadioOption } from "@/components/ui/radio-group";
import { SelectWithCustom } from "@/components/ui/select-with-custom";
import type {
  TopicBuilderFormData,
  ValidationResult,
} from "@/types/topic-builder";
import { INDUSTRY_OPTIONS } from "@/types/topic-builder";

interface IndustryStepProps {
  formData: TopicBuilderFormData;
  updateFormData: (
    field: keyof TopicBuilderFormData,
    value: string | string[] | number,
  ) => void;
  validateField?: (field: keyof TopicBuilderFormData) => ValidationResult;
  getFieldError?: (field: keyof TopicBuilderFormData) => string | undefined;
  errors?: Record<string, string>;
}

export function IndustryStep({
  formData,
  updateFormData,
  validateField: _validateField,
  getFieldError,
  errors,
}: IndustryStepProps) {
  const approachOptions: RadioOption[] = [
    {
      label: "I have a specific topic in mind",
      value: "subject-first",
      description: "Start with your topic and we'll help refine it",
    },
    {
      label: "I want to explore my industry",
      value: "industry-first",
      description: "Browse trending topics in your field",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Approach Selection - Full width */}
        <div className="md:col-span-2">
          <FormField
            label="How would you like to start?"
            error={getFieldError?.("wizardMode") || errors?.wizardMode}
            required
          >
            <RadioGroup
              options={approachOptions}
              value={formData.wizardMode}
              onValueChange={(value: string) =>
                updateFormData("wizardMode", value)
              }
              columns={2}
            />
          </FormField>
        </div>
        {/* Subject/Topic - Full width when visible */}
        {formData.wizardMode === "subject-first" && (
          <div className="md:col-span-2">
            <FormField
              label="What's your topic?"
              error={getFieldError?.("subject") || errors?.subject}
              isValid={
                !!formData.subject?.trim() && !getFieldError?.("subject")
              }
              required
              htmlFor="subject"
            >
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  Tell us the specific subject you want to explore
                </p>
                <ValidationInput
                  id="subject"
                  placeholder="e.g., AI in healthcare, sustainable fashion, remote work productivity..."
                  value={formData.subject || ""}
                  onChange={(e) => updateFormData("subject", e.target.value)}
                  error={getFieldError?.("subject") || errors?.subject}
                  isValid={
                    !!formData.subject?.trim() && !getFieldError?.("subject")
                  }
                />
              </div>
            </FormField>
          </div>
        )}

        {/* Industry Selection */}
        <div className="md:col-span-1">
          <div className="grid gap-2">
            <Label htmlFor="industry">
              What's your field or industry? *
              <span className="text-sm text-muted-foreground block mt-1">
                For example: Technology, Healthcare, Education, Finance
              </span>
            </Label>
            <SelectWithCustom
              options={INDUSTRY_OPTIONS}
              value={formData.industry}
              onChange={(value) => updateFormData("industry", value)}
              placeholder="e.g., Technology, Healthcare, Education..."
              allowCustom={true}
            />
            {errors?.industry && (
              <p className="text-sm text-red-500">{errors.industry}</p>
            )}
          </div>
        </div>

        {/* Specific Focus */}
        {formData.wizardMode === "industry-first" && (
          <div className="md:col-span-1">
            <div className="grid gap-2">
              <Label htmlFor="focus">
                Any specific focus? (Optional)
                <span className="text-sm text-muted-foreground block mt-1">
                  Narrow down to a specific area if you have one in mind
                </span>
              </Label>
              <Input
                id="focus"
                placeholder="e.g., AI in healthcare, mobile app development..."
                value={formData.focus || ""}
                onChange={(e) => updateFormData("focus", e.target.value)}
              />
              {errors?.focus && (
                <p className="text-sm text-red-500">{errors.focus}</p>
              )}
            </div>
          </div>
        )}

        {/* Industry Other - Full width when visible */}
        {formData.industry === "other" && (
          <div className="md:col-span-2">
            <div className="grid gap-2">
              <Label htmlFor="industry_other">Specify Industry</Label>
              <Input
                id="industry_other"
                placeholder="Please specify your industry"
                value={formData.industry_other || ""}
                onChange={(e) =>
                  updateFormData("industry_other", e.target.value)
                }
              />
              {errors?.industry_other && (
                <p className="text-sm text-red-500">{errors.industry_other}</p>
              )}
            </div>
          </div>
        )}

        {/* YMYL Warning - Full width when visible */}
        {formData.is_ymyl && (
          <div className="md:col-span-2">
            <div className="rounded-lg bg-yellow-50 p-4 border border-yellow-200">
              <p className="text-sm text-yellow-800">
                <strong>YMYL Content Detected:</strong> This industry involves
                health, finance, or legal topics. We'll keep suggestions factual
                and non-advisory.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
