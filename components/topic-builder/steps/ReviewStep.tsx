import { Button } from "@/components/ui/button";
import type { TopicBuilderFormData } from "@/types/topic-builder";
import {
  CONTENT_GOAL_OPTIONS,
  CONTENT_TYPE_OPTIONS,
  INDUSTRY_OPTIONS,
  LANGUAGE_OPTIONS,
  PLATFORM_OPTIONS,
  PURPOSE_OPTIONS,
  REGION_OPTIONS,
  TONE_OPTIONS,
} from "@/types/topic-builder";

interface ReviewStepProps {
  formData: TopicBuilderFormData;
  setCurrentStep: (step: number) => void;
}

export function ReviewStep({ formData, setCurrentStep }: ReviewStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-sm text-muted-foreground mb-4">
        Review your selections before generating topic ideas.
      </div>

      <div className="grid gap-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <strong>Mode:</strong>{" "}
              {formData.wizardMode === "subject-first"
                ? "Subject-First"
                : "Industry-First"}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentStep(1)}
            >
              Edit
            </Button>
          </div>

          {formData.subject && (
            <div className="flex items-center justify-between">
              <div>
                <strong>Subject:</strong> {formData.subject}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentStep(1)}
              >
                Edit
              </Button>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <strong>Industry:</strong>{" "}
              {INDUSTRY_OPTIONS.find((opt) => opt.value === formData.industry)
                ?.label || formData.industry}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentStep(2)}
            >
              Edit
            </Button>
          </div>

          {formData.focus && (
            <div className="flex items-center justify-between">
              <div>
                <strong>Focus:</strong> {formData.focus}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentStep(2)}
              >
                Edit
              </Button>
            </div>
          )}

          {formData.audience && (
            <div className="flex items-center justify-between">
              <div>
                <strong>Audience:</strong> {formData.audience}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentStep(3)}
              >
                Edit
              </Button>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <strong>Content Type:</strong>{" "}
              {CONTENT_TYPE_OPTIONS.find(
                (opt) => opt.value === formData.content_type,
              )?.label || formData.content_type}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentStep(4)}
            >
              Edit
            </Button>
          </div>

          {formData.platform && (
            <div className="flex items-center justify-between">
              <div>
                <strong>Platform:</strong>{" "}
                {PLATFORM_OPTIONS.find((opt) => opt.value === formData.platform)
                  ?.label || formData.platform}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentStep(4)}
              >
                Edit
              </Button>
            </div>
          )}

          {formData.purpose.length > 0 && (
            <div className="flex items-center justify-between">
              <div>
                <strong>Purpose:</strong>{" "}
                {formData.purpose
                  .map(
                    (p) =>
                      PURPOSE_OPTIONS.find((opt) => opt.value === p)?.label ||
                      p,
                  )
                  .join(", ")}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentStep(5)}
              >
                Edit
              </Button>
            </div>
          )}

          {formData.content_goal.length > 0 && (
            <div className="flex items-center justify-between">
              <div>
                <strong>Content Goals:</strong>{" "}
                {formData.content_goal
                  .map(
                    (g) =>
                      CONTENT_GOAL_OPTIONS.find((opt) => opt.value === g)
                        ?.label || g,
                  )
                  .join(", ")}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentStep(5)}
              >
                Edit
              </Button>
            </div>
          )}

          {formData.tone.length > 0 && (
            <div className="flex items-center justify-between">
              <div>
                <strong>Tone:</strong>{" "}
                {formData.tone
                  .map(
                    (t) =>
                      TONE_OPTIONS.find((opt) => opt.value === t)?.label || t,
                  )
                  .join(", ")}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentStep(5)}
              >
                Edit
              </Button>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <strong>Number of Ideas:</strong> {formData.num_ideas}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentStep(6)}
            >
              Edit
            </Button>
          </div>

          {formData.keywords && (
            <div className="flex items-center justify-between">
              <div>
                <strong>Keywords:</strong> {formData.keywords}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentStep(6)}
              >
                Edit
              </Button>
            </div>
          )}

          {formData.exclude && (
            <div className="flex items-center justify-between">
              <div>
                <strong>Exclude:</strong> {formData.exclude}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentStep(6)}
              >
                Edit
              </Button>
            </div>
          )}

          {formData.region && (
            <div className="flex items-center justify-between">
              <div>
                <strong>Region:</strong>{" "}
                {REGION_OPTIONS.find((opt) => opt.value === formData.region)
                  ?.label || formData.region}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentStep(6)}
              >
                Edit
              </Button>
            </div>
          )}

          {formData.language && (
            <div className="flex items-center justify-between">
              <div>
                <strong>Language:</strong>{" "}
                {LANGUAGE_OPTIONS.find((opt) => opt.value === formData.language)
                  ?.label || formData.language}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentStep(6)}
              >
                Edit
              </Button>
            </div>
          )}

          {formData.notes && (
            <div className="flex items-center justify-between">
              <div>
                <strong>Notes:</strong> {formData.notes}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentStep(6)}
              >
                Edit
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
