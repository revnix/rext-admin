import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, type RadioOption } from "@/components/ui/radio-group";
import { SelectWithCustom } from "@/components/ui/select-with-custom";
import type { TopicBuilderFormData } from "@/types/topic-builder";
import { CONTENT_TYPE_OPTIONS, PLATFORM_OPTIONS } from "@/types/topic-builder";

interface ContentFormatStepProps {
  formData: TopicBuilderFormData;
  updateFormData: (
    field: keyof TopicBuilderFormData,
    value: string | string[] | number,
  ) => void;
  errors?: Record<string, string>;
}

export function ContentFormatStep({
  formData,
  updateFormData,
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
          <div className="grid gap-3">
            <Label>Content Type *</Label>
            <RadioGroup
              options={contentTypeOptions}
              value={formData.content_type}
              onValueChange={(value) => updateFormData("content_type", value)}
              columns={2}
            />
            {errors?.content_type && (
              <p className="text-sm text-red-500">{errors.content_type}</p>
            )}
          </div>
        </div>

        {/* Content Type Other - Full width when visible */}
        {formData.content_type === "other" && (
          <div className="md:col-span-2">
            <div className="grid gap-2">
              <Label htmlFor="content_type_other">Specify Content Type</Label>
              <Input
                id="content_type_other"
                placeholder="Please specify your content type"
                value={formData.content_type_other || ""}
                onChange={(e) =>
                  updateFormData("content_type_other", e.target.value)
                }
              />
              {errors?.content_type_other && (
                <p className="text-sm text-red-500">
                  {errors.content_type_other}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Platform/Channel */}
        {(formData.content_type === "social-media" ||
          formData.content_type === "video-content") && (
          <div className="md:col-span-1">
            <div className="grid gap-2">
              <Label htmlFor="platform">Platform/Channel</Label>
              <SelectWithCustom
                options={PLATFORM_OPTIONS}
                value={formData.platform || ""}
                onChange={(value) => updateFormData("platform", value)}
                placeholder="Where will you publish this?"
                allowCustom={true}
              />
              {errors?.platform && (
                <p className="text-sm text-red-500">{errors.platform}</p>
              )}
            </div>
          </div>
        )}

        {/* Platform Other */}
        {formData.platform === "other" && (
          <div className="md:col-span-1">
            <div className="grid gap-2">
              <Label htmlFor="platform_other">Specify Platform</Label>
              <Input
                id="platform_other"
                placeholder="Please specify your platform"
                value={formData.platform_other || ""}
                onChange={(e) =>
                  updateFormData("platform_other", e.target.value)
                }
              />
              {errors?.platform_other && (
                <p className="text-sm text-red-500">{errors.platform_other}</p>
              )}
            </div>
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
