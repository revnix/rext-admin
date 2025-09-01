import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="content_type">Content Type *</Label>
          <SelectWithCustom
            options={CONTENT_TYPE_OPTIONS}
            value={formData.content_type}
            onChange={(value) => updateFormData("content_type", value)}
            placeholder="What type of content are you creating?"
            allowCustom={true}
          />
          {errors?.content_type && (
            <p className="text-sm text-red-500">{errors.content_type}</p>
          )}
        </div>

        {formData.content_type === "other" && (
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
        )}

        {(formData.content_type === "social-media" ||
          formData.content_type === "video-content") && (
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
        )}

        {formData.platform === "other" && (
          <div className="grid gap-2">
            <Label htmlFor="platform_other">Specify Platform</Label>
            <Input
              id="platform_other"
              placeholder="Please specify your platform"
              value={formData.platform_other || ""}
              onChange={(e) => updateFormData("platform_other", e.target.value)}
            />
            {errors?.platform_other && (
              <p className="text-sm text-red-500">{errors.platform_other}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
