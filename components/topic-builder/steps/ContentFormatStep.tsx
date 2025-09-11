import { FormField } from "@/components/ui/form-field";
import { RadioGroup, type RadioOption } from "@/components/ui/radio-group";
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

  // Convert PLATFORM_OPTIONS to RadioOption format with descriptions
  const platformOptions: RadioOption[] = PLATFORM_OPTIONS.map((option) => ({
    label: option.label,
    value: option.value,
    description: getPlatformDescription(option.value),
  }));

  // Enhanced handler for content type changes with proper state management
  const handleContentTypeChange = (value: string) => {
    // Update the content type field - this will trigger the updateFormDataForContentTypeChange
    // logic in the useTopicBuilder hook which properly handles platform field resets
    updateFormData("content_type", value);
  };

  // Enhanced handler for platform changes with validation feedback
  const handlePlatformChange = (value: string) => {
    updateFormData("platform", value);
  };

  // Get current error states for better UX feedback
  const contentTypeError =
    getFieldError?.("content_type") || errors?.content_type;
  const platformError = getFieldError?.("platform") || errors?.platform;

  // Check if platform field should be shown and required
  const shouldShowPlatform = formData.content_type === "social-media";
  const isPlatformRequired = shouldShowPlatform;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Content Type - Full width */}
        <div className="md:col-span-2">
          <FormField
            label="What type of content will this be?"
            error={contentTypeError}
            isValid={!!formData.content_type && !contentTypeError}
            required
          >
            <RadioGroup
              options={contentTypeOptions}
              value={formData.content_type}
              onValueChange={handleContentTypeChange}
              columns={4}
            />
          </FormField>
        </div>

        {/* Platform/Channel - Conditional display with enhanced validation */}
        {shouldShowPlatform && (
          <div className="md:col-span-2">
            <FormField
              label="Where will you publish this?"
              error={platformError}
              isValid={!!formData.platform && !platformError}
              required={isPlatformRequired}
            >
              <RadioGroup
                options={platformOptions}
                value={formData.platform || ""}
                onValueChange={handlePlatformChange}
                columns={4}
              />
            </FormField>
            {isPlatformRequired && !formData.platform && (
              <p className="text-sm text-muted-foreground mt-2">
                Please select a platform to publish your social media post
              </p>
            )}
          </div>
        )}

        {/* Info message for Blog Post selection */}
        {formData.content_type === "blog-post" && (
          <div className="md:col-span-2">
            <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
              Blog posts and articles will be optimized for your website or blog
              platform
            </p>
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
    default:
      return "";
  }
}

// Helper function for platform descriptions
function getPlatformDescription(value: string): string {
  switch (value) {
    case "facebook":
      return "Professional and personal content sharing";
    case "instagram":
      return "Visual content and stories";
    case "twitter":
      return "Real-time updates and conversations";
    case "linkedin":
      return "Professional networking and B2B content";
    case "tiktok":
      return "Short-form video content";
    case "youtube":
      return "Long-form video content and tutorials";
    default:
      return "";
  }
}
