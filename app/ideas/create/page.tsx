"use client";

import {
  ArrowLeft,
  ArrowRight,
  Building,
  Eye,
  FileText,
  Route,
  Settings,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { useState } from "react";
import { PageLayout } from "@/components/page-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MultiSelect } from "@/components/ui/multi-select";
import { Progress } from "@/components/ui/progress";
import { SelectWithCustom } from "@/components/ui/select-with-custom";
import { Textarea } from "@/components/ui/textarea";
import {
  DEMOGRAPHIC_AGE_OPTIONS,
  DEMOGRAPHIC_LOCATION_OPTIONS,
} from "@/data/topic-builder-options";
import { detectYMYL, validateFormStep } from "@/lib/topic-builder-utils";
import type { TopicBuilderFormData } from "@/types/topic-builder";
import {
  AUDIENCE_SIZE_OPTIONS,
  CONTENT_GOAL_OPTIONS,
  CONTENT_TYPE_OPTIONS,
  INDUSTRY_OPTIONS,
  LANGUAGE_OPTIONS,
  ORIGINALITY_TOGGLE_OPTIONS,
  PLATFORM_OPTIONS,
  PREFERENCE_TOGGLE_OPTIONS,
  PURPOSE_OPTIONS,
  READER_LEVEL_OPTIONS,
  REGION_OPTIONS,
  TONE_OPTIONS,
  WIZARD_MODE_OPTIONS,
} from "@/types/topic-builder";

const initialFormData: TopicBuilderFormData = {
  wizardMode: "subject-first",
  industry: "technology",
  content_type: "blog-post",
  demographic_age: [],
  demographic_location: [],
  purpose: [],
  content_goal: [],
  tone: [],
  num_ideas: 5,
};

const steps = [
  {
    id: 1,
    title: "Wizard Mode",
    description: "Choose your approach",
    icon: Route,
    required: true,
  },
  {
    id: 2,
    title: "Industry/Subject",
    description: "Select domain or enter topic",
    icon: Building,
    required: true,
  },
  {
    id: 3,
    title: "Audience",
    description: "Define your target audience",
    icon: Users,
    required: true,
  },
  {
    id: 4,
    title: "Content Format",
    description: "Choose content type & platform",
    icon: FileText,
    required: true,
  },
  {
    id: 5,
    title: "Goals & Style",
    description: "Set purpose and tone",
    icon: Target,
    required: true,
  },
  {
    id: 6,
    title: "Advanced Options",
    description: "Keywords & preferences",
    icon: Settings,
    advanced: true,
  },
  {
    id: 7,
    title: "Review",
    description: "Review your selections",
    icon: Eye,
    required: true,
  },
  {
    id: 8,
    title: "Generate",
    description: "Create topic ideas",
    icon: Sparkles,
    required: true,
  },
];

export default function TopicBuilderPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] =
    useState<TopicBuilderFormData>(initialFormData);

  const breadcrumbs = [
    { label: "Ideas", href: "/ideas" },
    { label: "Topic Builder" },
  ];

  const updateFormData = (
    field: keyof TopicBuilderFormData,
    value: string | string[] | number,
  ) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };

      // Auto-detect YMYL when industry changes
      if (field === "industry" && typeof value === "string") {
        updated.is_ymyl = detectYMYL(value);
      }

      return updated;
    });
  };

  const progress = (currentStep / steps.length) * 100;

  const nextStep = () => {
    if (validateFormStep(currentStep, formData) && currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    } else {
      console.warn("Validation failed for step", currentStep);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleGenerate = () => {
    console.log("Generating topics with data:", formData);
    // TODO: Implement topic generation API call
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
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
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="grid gap-4">
              {formData.wizardMode === "subject-first" && (
                <div className="grid gap-2">
                  <Label htmlFor="subject">Your Subject/Topic *</Label>
                  <Input
                    id="subject"
                    placeholder="What specific subject do you want to write about?"
                    value={formData.subject || ""}
                    onChange={(e) => updateFormData("subject", e.target.value)}
                  />
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="industry">Industry/Domain *</Label>
                <SelectWithCustom
                  options={INDUSTRY_OPTIONS}
                  value={formData.industry}
                  onChange={(value) => updateFormData("industry", value)}
                  placeholder="Which industry or domain?"
                  allowCustom={true}
                />
              </div>

              {formData.industry === "other" && (
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
                </div>
              )}

              {formData.wizardMode === "industry-first" && (
                <div className="grid gap-2">
                  <Label htmlFor="focus">Specific Focus (Optional)</Label>
                  <Input
                    id="focus"
                    placeholder="Any specific area within this industry?"
                    value={formData.focus || ""}
                    onChange={(e) => updateFormData("focus", e.target.value)}
                  />
                </div>
              )}

              {formData.is_ymyl && (
                <div className="rounded-lg bg-yellow-50 p-4 border border-yellow-200">
                  <p className="text-sm text-yellow-800">
                    <strong>YMYL Content Detected:</strong> This industry
                    involves health, finance, or legal topics. We'll keep
                    suggestions factual and non-advisory.
                  </p>
                </div>
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="audience">Target Audience</Label>
                <Input
                  id="audience"
                  placeholder="Who are you writing for? (e.g., teachers, students, managers)"
                  value={formData.audience || ""}
                  onChange={(e) => updateFormData("audience", e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="reader_level">Reader Experience Level</Label>
                <SelectWithCustom
                  options={READER_LEVEL_OPTIONS}
                  value={formData.reader_level || ""}
                  onChange={(value) => updateFormData("reader_level", value)}
                  placeholder="What's their expertise level?"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="audience_size">Audience Size</Label>
                <SelectWithCustom
                  options={AUDIENCE_SIZE_OPTIONS}
                  value={formData.audience_size || ""}
                  onChange={(value) => updateFormData("audience_size", value)}
                  placeholder="How large is your target audience?"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="demographicAge">Age Groups</Label>
                <MultiSelect
                  options={DEMOGRAPHIC_AGE_OPTIONS}
                  selected={formData.demographic_age}
                  onChange={(selected) =>
                    updateFormData("demographic_age", selected)
                  }
                  placeholder="What age groups? (optional)"
                  allowCustom={true}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="demographicLocation">Geographic Focus</Label>
                <MultiSelect
                  options={DEMOGRAPHIC_LOCATION_OPTIONS}
                  selected={formData.demographic_location}
                  onChange={(selected) =>
                    updateFormData("demographic_location", selected)
                  }
                  placeholder="Where is your audience? (optional)"
                  allowCustom={true}
                />
              </div>
            </div>
          </div>
        );

      case 4:
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
              </div>

              {formData.content_type === "other" && (
                <div className="grid gap-2">
                  <Label htmlFor="content_type_other">
                    Specify Content Type
                  </Label>
                  <Input
                    id="content_type_other"
                    placeholder="Please specify your content type"
                    value={formData.content_type_other || ""}
                    onChange={(e) =>
                      updateFormData("content_type_other", e.target.value)
                    }
                  />
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
                </div>
              )}

              {formData.platform === "other" && (
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
                </div>
              )}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="purpose">Content Purpose *</Label>
                <MultiSelect
                  options={PURPOSE_OPTIONS}
                  selected={formData.purpose}
                  onChange={(selected) => updateFormData("purpose", selected)}
                  placeholder="What's the main purpose? (select multiple)"
                  allowCustom={true}
                />
              </div>

              {formData.purpose.includes("other") && (
                <div className="grid gap-2">
                  <Label htmlFor="purpose_other">Specify Purpose</Label>
                  <Input
                    id="purpose_other"
                    placeholder="Please specify your purpose"
                    value={formData.purpose_other || ""}
                    onChange={(e) =>
                      updateFormData("purpose_other", e.target.value)
                    }
                  />
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="content_goal">Content Goals *</Label>
                <MultiSelect
                  options={CONTENT_GOAL_OPTIONS}
                  selected={formData.content_goal}
                  onChange={(selected) =>
                    updateFormData("content_goal", selected)
                  }
                  placeholder="What type of content? (select multiple)"
                  allowCustom={true}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="tone">Tone & Style *</Label>
                <MultiSelect
                  options={TONE_OPTIONS}
                  selected={formData.tone}
                  onChange={(selected) => updateFormData("tone", selected)}
                  placeholder="What tone should the content have? (select multiple)"
                  allowCustom={true}
                />
              </div>

              {formData.tone.includes("other") && (
                <div className="grid gap-2">
                  <Label htmlFor="tone_other">Specify Tone</Label>
                  <Input
                    id="tone_other"
                    placeholder="Please specify your preferred tone"
                    value={formData.tone_other || ""}
                    onChange={(e) =>
                      updateFormData("tone_other", e.target.value)
                    }
                  />
                </div>
              )}
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div className="text-sm text-muted-foreground mb-4">
              These options are optional but can help generate more targeted
              ideas.
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
              </div>

              <div className="grid gap-2">
                <Label htmlFor="exclude">Exclude/Avoid</Label>
                <Input
                  id="exclude"
                  placeholder="Topics or angles to avoid (comma-separated)"
                  value={formData.exclude || ""}
                  onChange={(e) => updateFormData("exclude", e.target.value)}
                />
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
              </div>

              <div className="grid gap-2">
                <Label htmlFor="region">Target Region</Label>
                <SelectWithCustom
                  options={REGION_OPTIONS}
                  value={formData.region || ""}
                  onChange={(value) => updateFormData("region", value)}
                  placeholder="Geographic focus (optional)"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="language">Content Language</Label>
                <SelectWithCustom
                  options={LANGUAGE_OPTIONS}
                  value={formData.language || ""}
                  onChange={(value) => updateFormData("language", value)}
                  placeholder="What language? (optional)"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="fresh_vs_evergreen">
                  Content Timing Preference
                </Label>
                <SelectWithCustom
                  options={PREFERENCE_TOGGLE_OPTIONS}
                  value={formData.fresh_vs_evergreen || ""}
                  onChange={(value) =>
                    updateFormData("fresh_vs_evergreen", value)
                  }
                  placeholder="Fresh & trending vs evergreen?"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="safe_vs_original">Originality Preference</Label>
                <SelectWithCustom
                  options={ORIGINALITY_TOGGLE_OPTIONS}
                  value={formData.safe_vs_original || ""}
                  onChange={(value) =>
                    updateFormData("safe_vs_original", value)
                  }
                  placeholder="Safe & conventional vs original?"
                />
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
              </div>
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-6">
            <div className="text-sm text-muted-foreground mb-4">
              Review your selections before generating topic ideas.
            </div>

            <div className="grid gap-4">
              <div className="space-y-3">
                <div>
                  <strong>Mode:</strong>{" "}
                  {formData.wizardMode === "subject-first"
                    ? "Subject-First"
                    : "Industry-First"}
                </div>
                {formData.subject && (
                  <div>
                    <strong>Subject:</strong> {formData.subject}
                  </div>
                )}
                <div>
                  <strong>Industry:</strong>{" "}
                  {INDUSTRY_OPTIONS.find(
                    (opt) => opt.value === formData.industry,
                  )?.label || formData.industry}
                </div>
                {formData.focus && (
                  <div>
                    <strong>Focus:</strong> {formData.focus}
                  </div>
                )}
                {formData.audience && (
                  <div>
                    <strong>Audience:</strong> {formData.audience}
                  </div>
                )}
                <div>
                  <strong>Content Type:</strong>{" "}
                  {CONTENT_TYPE_OPTIONS.find(
                    (opt) => opt.value === formData.content_type,
                  )?.label || formData.content_type}
                </div>
                {formData.platform && (
                  <div>
                    <strong>Platform:</strong>{" "}
                    {PLATFORM_OPTIONS.find(
                      (opt) => opt.value === formData.platform,
                    )?.label || formData.platform}
                  </div>
                )}
                {formData.purpose.length > 0 && (
                  <div>
                    <strong>Purpose:</strong>{" "}
                    {formData.purpose
                      .map(
                        (p) =>
                          PURPOSE_OPTIONS.find((opt) => opt.value === p)
                            ?.label || p,
                      )
                      .join(", ")}
                  </div>
                )}
                {formData.content_goal.length > 0 && (
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
                )}
                {formData.tone.length > 0 && (
                  <div>
                    <strong>Tone:</strong>{" "}
                    {formData.tone
                      .map(
                        (t) =>
                          TONE_OPTIONS.find((opt) => opt.value === t)?.label ||
                          t,
                      )
                      .join(", ")}
                  </div>
                )}
                <div>
                  <strong>Number of Ideas:</strong> {formData.num_ideas}
                </div>
                {formData.keywords && (
                  <div>
                    <strong>Keywords:</strong> {formData.keywords}
                  </div>
                )}
                {formData.exclude && (
                  <div>
                    <strong>Exclude:</strong> {formData.exclude}
                  </div>
                )}
                {formData.region && (
                  <div>
                    <strong>Region:</strong>{" "}
                    {REGION_OPTIONS.find((opt) => opt.value === formData.region)
                      ?.label || formData.region}
                  </div>
                )}
                {formData.language && (
                  <div>
                    <strong>Language:</strong>{" "}
                    {LANGUAGE_OPTIONS.find(
                      (opt) => opt.value === formData.language,
                    )?.label || formData.language}
                  </div>
                )}
                {formData.notes && (
                  <div>
                    <strong>Notes:</strong> {formData.notes}
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 8:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Sparkles className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="text-lg font-semibold mb-2">Ready to Generate!</h3>
              <p className="text-muted-foreground mb-4">
                We'll create {formData.num_ideas} targeted topic ideas based on
                your selections.
              </p>
              <Button onClick={handleGenerate} size="lg" className="w-full">
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Topic Ideas
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const currentStepData = steps[currentStep - 1];

  return (
    <PageLayout
      title="Topic Builder"
      description="Generate AI-powered content topic ideas for your industry"
      breadcrumbs={breadcrumbs}
    >
      {/* Progress Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Step {currentStep} of {steps.length}
          </div>
        </div>

        <Progress value={progress} className="w-full" />

        {/* Step Indicators */}
        <div className="flex items-center justify-between">
          {steps.map((step, _index) => {
            const StepIcon = step.icon;
            const isActive = step.id === currentStep;
            const isCompleted = step.id < currentStep;

            return (
              <div key={step.id} className="flex flex-col items-center gap-2">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : isCompleted
                        ? "bg-green-500 text-white"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  <StepIcon className="h-4 w-4" />
                </div>
                <div className="text-center">
                  <div
                    className={`text-sm font-medium ${isActive ? "text-primary" : ""}`}
                  >
                    {step.title}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <Card className="flex-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <currentStepData.icon className="h-5 w-5" />
            {currentStepData.title}
          </CardTitle>
          <CardDescription>{currentStepData.description}</CardDescription>
        </CardHeader>
        <CardContent>{renderStepContent()}</CardContent>
      </Card>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 1}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Previous
        </Button>

        <div className="text-sm text-muted-foreground">
          {currentStep} of {steps.length} steps completed
        </div>

        {currentStep === steps.length ? (
          <Button onClick={handleGenerate} className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Generate Topics
          </Button>
        ) : (
          <Button onClick={nextStep} className="flex items-center gap-2">
            Next
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </PageLayout>
  );
}
