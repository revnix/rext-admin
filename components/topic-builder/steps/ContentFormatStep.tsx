import { FormField, ValidationInput } from "@/components/ui/form-field";
import { RadioGroup, type RadioOption } from "@/components/ui/radio-group";
import { SelectWithCustom } from "@/components/ui/select-with-custom";
import type {
  TopicBuilderFormData,
  ValidationResult,
} from "@/types/topic-builder";
import { CONTENT_TYPE_OPTIONS, PLATFORM_OPTIONS } from "@/types/topic-builder";

interface ContentFormatStepProps {
  formData: TopicBuilderFormData;
  updateFormData: (
    field: keyof TopicBuilderFormData,
    value: string | string[] | number,
  ) => void;
  validateField?: (field: keyof TopicBuilderFormData) => ValidationResult;
  getFieldError?: (field: keyof TopicBuilderFormData) => string | undefined;
  errors?: Record<string, string>;
}

export function ContentFormatStep({
  formData,
  updateFormData,
  validateField: _validateField,
  getFieldError,
  errors,
}: ContentFormatStepProps) {
  // Convert SelectOption to RadioOption format with descriptions
  const contentTypeOptions: RadioOption[] = CONTENT_TYPE_OPTIONS.map(
    (option) => ({
      label: option.label,
      value: option.value,
      description: getContentTypeDescription(option.value),
    }),
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Content Type - Full width */}
        <div className="md:col-span-2">
          <FormField
            label="Content Type"
            error={getFieldError?.("content_type") || errors?.content_type}
            isValid={
              !!formData.content_type && !getFieldError?.("content_type")
            }
            required
          >
            <RadioGroup
              options={contentTypeOptions}
              value={formData.content_type}
              onValueChange={(value) => updateFormData("content_type", value)}
              columns={2}
            />
          </FormField>
        </div>

        {/* Content Type Other - Full width when visible */}
        {formData.content_type === "other" && (
          <div className="md:col-span-2">
            <FormField
              label="Specify Content Type"
              error={
                getFieldError?.("content_type_other") ||
                errors?.content_type_other
              }
              isValid={
                !!formData.content_type_other?.trim() &&
                !getFieldError?.("content_type_other")
              }
              required
              htmlFor="content_type_other"
            >
              <ValidationInput
                id="content_type_other"
                placeholder="Please specify your content type"
                value={formData.content_type_other || ""}
                onChange={(e) =>
                  updateFormData("content_type_other", e.target.value)
                }
                error={
                  getFieldError?.("content_type_other") ||
                  errors?.content_type_other
                }
                isValid={
                  !!formData.content_type_other?.trim() &&
                  !getFieldError?.("content_type_other")
                }
              />
            </FormField>
          </div>
        )}

        {/* Platform/Channel */}
        {(formData.content_type === "social-media" ||
          formData.content_type === "video-content") && (
          <div className="md:col-span-1">
            <FormField
              label="Platform/Channel"
              error={getFieldError?.("platform") || errors?.platform}
              isValid={!!formData.platform && !getFieldError?.("platform")}
              htmlFor="platform"
            >
              <SelectWithCustom
                options={PLATFORM_OPTIONS}
                value={formData.platform || ""}
                onChange={(value) => updateFormData("platform", value)}
                placeholder="Where will you publish this?"
                allowCustom={true}
              />
            </FormField>
          </div>
        )}

        {/* Platform Other */}
        {formData.platform === "other" && (
          <div className="md:col-span-1">
            <FormField
              label="Specify Platform"
              error={
                getFieldError?.("platform_other") || errors?.platform_other
              }
              isValid={
                !!formData.platform_other?.trim() &&
                !getFieldError?.("platform_other")
              }
              required
              htmlFor="platform_other"
            >
              <ValidationInput
                id="platform_other"
                placeholder="Please specify your platform"
                value={formData.platform_other || ""}
                onChange={(e) =>
                  updateFormData("platform_other", e.target.value)
                }
                error={
                  getFieldError?.("platform_other") || errors?.platform_other
                }
                isValid={
                  !!formData.platform_other?.trim() &&
                  !getFieldError?.("platform_other")
                }
              />
            </FormField>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function for content type descriptions
function getContentTypeDescription(value: string): string {
  switch (value) {
    case "blog-post":
      return "Long-form articles and blog content";
    case "social-media":
      return "Short posts for social platforms";
    case "video-content":
      return "Video scripts and video topics";
    case "podcast":
      return "Audio content and episode ideas";
    case "infographic":
      return "Visual data and concept graphics";
    case "ebook-guide":
      return "In-depth guides and resources";
    case "case-study":
      return "Success stories and analysis";
    case "whitepaper":
      return "Research reports and technical docs";
    case "newsletter":
      return "Email content and updates";
    case "presentation":
      return "Slide decks and presentations";
    case "press-release":
      return "News announcements and PR";
    default:
      return "";
  }
}
