"use client";

import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Lightbulb,
  Target,
  Users,
  Zap,
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
import type { IdeaBuilderFormData } from "@/types/idea-builder";
import {
  AUDIENCE_SIZE_OPTIONS,
  BUDGET_OPTIONS,
  COMPETITION_ANALYSIS_OPTIONS,
  DEMOGRAPHIC_AGE_OPTIONS,
  DEMOGRAPHIC_LOCATION_OPTIONS,
  IDEA_CATEGORY_OPTIONS,
  IDEA_PRIORITY_OPTIONS,
  PRIMARY_GOAL_OPTIONS,
  RESOURCES_OPTIONS,
  RISK_ASSESSMENT_OPTIONS,
  SKILLS_REQUIRED_OPTIONS,
  SOLUTION_APPROACH_OPTIONS,
  SUCCESS_METRICS_OPTIONS,
  TARGET_AUDIENCE_OPTIONS,
  TIMEFRAME_OPTIONS,
} from "@/types/idea-builder";

const initialFormData: IdeaBuilderFormData = {
  ideaName: "",
  ideaDescription: "",
  category: [],
  priority: "medium",
  targetAudience: [],
  audienceSize: "medium",
  demographicAge: [],
  demographicLocation: [],
  problemStatement: "",
  solutionApproach: [],
  competitorAnalysis: "some",
  uniqueValueProp: "",
  timeframe: "1-3-months",
  budget: "medium",
  resources: [],
  skillsRequired: [],
  primaryGoal: [],
  successMetrics: [],
  expectedOutcome: "",
  riskAssessment: "medium",
};

// Using imported option constants from types

const steps = [
  {
    id: 1,
    title: "Idea Basics",
    description: "Define your core idea and concept",
    icon: Lightbulb,
  },
  {
    id: 2,
    title: "Target Audience",
    description: "Identify who your idea serves",
    icon: Users,
  },
  {
    id: 3,
    title: "Problem & Solution",
    description: "Define the problem and your solution",
    icon: Target,
  },
  {
    id: 4,
    title: "Implementation",
    description: "Plan resources and execution",
    icon: Zap,
  },
  {
    id: 5,
    title: "Goals & Metrics",
    description: "Set success criteria and measurements",
    icon: CheckCircle,
  },
];

export default function IdeaBuilderPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] =
    useState<IdeaBuilderFormData>(initialFormData);

  const breadcrumbs = [{ label: "Ideas", href: "/ideas" }, { label: "Create" }];

  const updateFormData = (
    field: keyof IdeaBuilderFormData,
    value: string | string[],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const progress = (currentStep / steps.length) * 100;

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    console.log("Idea submitted:", formData);
    // Handle form submission
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="ideaName">Idea Name *</Label>
                <Input
                  id="ideaName"
                  placeholder="What's your big idea called?"
                  value={formData.ideaName}
                  onChange={(e) => updateFormData("ideaName", e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="ideaDescription">Idea Description *</Label>
                <Input
                  id="ideaDescription"
                  placeholder="Briefly describe your idea in one sentence"
                  value={formData.ideaDescription}
                  onChange={(e) =>
                    updateFormData("ideaDescription", e.target.value)
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="category">Categories *</Label>
                <MultiSelect
                  options={IDEA_CATEGORY_OPTIONS}
                  selected={formData.category}
                  onChange={(selected) => updateFormData("category", selected)}
                  placeholder="Select categories (you can select multiple)"
                  allowCustom={true}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="priority">Priority Level *</Label>
                <SelectWithCustom
                  options={IDEA_PRIORITY_OPTIONS}
                  value={formData.priority}
                  onChange={(value) => updateFormData("priority", value)}
                  placeholder="How important is this idea?"
                  allowCustom={true}
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="targetAudience">Target Audiences *</Label>
                <MultiSelect
                  options={TARGET_AUDIENCE_OPTIONS}
                  selected={formData.targetAudience}
                  onChange={(selected) =>
                    updateFormData("targetAudience", selected)
                  }
                  placeholder="Who are your target audiences? (select multiple)"
                  allowCustom={true}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="audienceSize">Estimated Audience Size *</Label>
                <SelectWithCustom
                  options={AUDIENCE_SIZE_OPTIONS}
                  value={formData.audienceSize}
                  onChange={(value) => updateFormData("audienceSize", value)}
                  placeholder="How large is your target market?"
                  allowCustom={true}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="demographicAge">Age Groups *</Label>
                <MultiSelect
                  options={DEMOGRAPHIC_AGE_OPTIONS}
                  selected={formData.demographicAge}
                  onChange={(selected) =>
                    updateFormData("demographicAge", selected)
                  }
                  placeholder="What age groups are you targeting? (select multiple)"
                  allowCustom={true}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="demographicLocation">Geographic Focus *</Label>
                <MultiSelect
                  options={DEMOGRAPHIC_LOCATION_OPTIONS}
                  selected={formData.demographicLocation}
                  onChange={(selected) =>
                    updateFormData("demographicLocation", selected)
                  }
                  placeholder="Where is your audience located? (select multiple)"
                  allowCustom={true}
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="problemStatement">Problem Statement *</Label>
                <Input
                  id="problemStatement"
                  placeholder="What specific problem does your idea solve?"
                  value={formData.problemStatement}
                  onChange={(e) =>
                    updateFormData("problemStatement", e.target.value)
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="solutionApproach">Solution Approaches *</Label>
                <MultiSelect
                  options={SOLUTION_APPROACH_OPTIONS}
                  selected={formData.solutionApproach}
                  onChange={(selected) =>
                    updateFormData("solutionApproach", selected)
                  }
                  placeholder="How do you plan to solve this problem? (select multiple)"
                  allowCustom={true}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="competitorAnalysis">
                  Existing Competitors *
                </Label>
                <SelectWithCustom
                  options={COMPETITION_ANALYSIS_OPTIONS}
                  value={formData.competitorAnalysis}
                  onChange={(value) =>
                    updateFormData("competitorAnalysis", value)
                  }
                  placeholder="How many competitors exist?"
                  allowCustom={true}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="uniqueValueProp">
                  Unique Value Proposition *
                </Label>
                <Input
                  id="uniqueValueProp"
                  placeholder="What makes your solution unique/better?"
                  value={formData.uniqueValueProp}
                  onChange={(e) =>
                    updateFormData("uniqueValueProp", e.target.value)
                  }
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
                <Label htmlFor="timeframe">Implementation Timeframe *</Label>
                <SelectWithCustom
                  options={TIMEFRAME_OPTIONS}
                  value={formData.timeframe}
                  onChange={(value) => updateFormData("timeframe", value)}
                  placeholder="How long will this take to implement?"
                  allowCustom={true}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="budget">Budget Range *</Label>
                <SelectWithCustom
                  options={BUDGET_OPTIONS}
                  value={formData.budget}
                  onChange={(value) => updateFormData("budget", value)}
                  placeholder="What's your budget for this idea?"
                  allowCustom={true}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="resources">Required Resources *</Label>
                <MultiSelect
                  options={RESOURCES_OPTIONS}
                  selected={formData.resources}
                  onChange={(selected) => updateFormData("resources", selected)}
                  placeholder="What resources do you need? (select multiple)"
                  allowCustom={true}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="skillsRequired">Key Skills Required *</Label>
                <MultiSelect
                  options={SKILLS_REQUIRED_OPTIONS}
                  selected={formData.skillsRequired}
                  onChange={(selected) =>
                    updateFormData("skillsRequired", selected)
                  }
                  placeholder="What skills are most important? (select multiple)"
                  allowCustom={true}
                />
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="primaryGoal">Primary Goals *</Label>
                <MultiSelect
                  options={PRIMARY_GOAL_OPTIONS}
                  selected={formData.primaryGoal}
                  onChange={(selected) =>
                    updateFormData("primaryGoal", selected)
                  }
                  placeholder="What are your main goals? (select multiple)"
                  allowCustom={true}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="successMetrics">Success Metrics *</Label>
                <MultiSelect
                  options={SUCCESS_METRICS_OPTIONS}
                  selected={formData.successMetrics}
                  onChange={(selected) =>
                    updateFormData("successMetrics", selected)
                  }
                  placeholder="How will you measure success? (select multiple)"
                  allowCustom={true}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="expectedOutcome">Expected Outcome *</Label>
                <Input
                  id="expectedOutcome"
                  placeholder="What specific outcome do you expect?"
                  value={formData.expectedOutcome}
                  onChange={(e) =>
                    updateFormData("expectedOutcome", e.target.value)
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="riskAssessment">Risk Assessment *</Label>
                <SelectWithCustom
                  options={RISK_ASSESSMENT_OPTIONS}
                  value={formData.riskAssessment}
                  onChange={(value) => updateFormData("riskAssessment", value)}
                  placeholder="What's the risk level?"
                  allowCustom={true}
                />
              </div>
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
      title="Idea Builder"
      description="Turn your concept into a structured, actionable idea"
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
          <Button onClick={handleSubmit} className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Submit Idea
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
