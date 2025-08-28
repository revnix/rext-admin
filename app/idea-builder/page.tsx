"use client"

import { useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SelectWithCustom, type SelectWithCustomOption } from "@/components/ui/select-with-custom"
import { MultiSelect, type MultiSelectOption } from "@/components/ui/multi-select"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { ArrowLeft, ArrowRight, CheckCircle, Lightbulb, Target, Users, Zap } from "lucide-react"

interface FormData {
  // Step 1: Idea Basics
  ideaName: string
  ideaDescription: string
  category: string[]  // Multi-select
  priority: string
  
  // Step 2: Target Audience
  targetAudience: string[]  // Multi-select
  audienceSize: string
  demographicAge: string[]  // Multi-select
  demographicLocation: string[]  // Multi-select
  
  // Step 3: Problem & Solution
  problemStatement: string
  solutionApproach: string[]  // Multi-select
  competitorAnalysis: string
  uniqueValueProp: string
  
  // Step 4: Implementation
  timeframe: string
  budget: string
  resources: string[]  // Multi-select
  skillsRequired: string[]  // Multi-select
  
  // Step 5: Goals & Metrics
  primaryGoal: string[]  // Multi-select
  successMetrics: string[]  // Multi-select
  expectedOutcome: string
  riskAssessment: string
}

const initialFormData: FormData = {
  ideaName: "",
  ideaDescription: "",
  category: [],
  priority: "",
  targetAudience: [],
  audienceSize: "",
  demographicAge: [],
  demographicLocation: [],
  problemStatement: "",
  solutionApproach: [],
  competitorAnalysis: "",
  uniqueValueProp: "",
  timeframe: "",
  budget: "",
  resources: [],
  skillsRequired: [],
  primaryGoal: [],
  successMetrics: [],
  expectedOutcome: "",
  riskAssessment: "",
}

// Option definitions
const categoryOptions: MultiSelectOption[] = [
  { label: "Technology", value: "technology" },
  { label: "Business", value: "business" },
  { label: "Marketing", value: "marketing" },
  { label: "Product", value: "product" },
  { label: "Service", value: "service" },
  { label: "Process Improvement", value: "process" },
  { label: "Innovation", value: "innovation" },
]

const targetAudienceOptions: MultiSelectOption[] = [
  { label: "General Consumers", value: "consumers" },
  { label: "Small Businesses", value: "businesses" },
  { label: "Enterprise/Large Corporations", value: "enterprise" },
  { label: "Students/Education", value: "students" },
  { label: "Working Professionals", value: "professionals" },
  { label: "Senior Citizens", value: "seniors" },
  { label: "Teenagers", value: "teens" },
  { label: "Parents/Families", value: "parents" },
]

const demographicAgeOptions: MultiSelectOption[] = [
  { label: "Gen Z (18-27)", value: "gen-z" },
  { label: "Millennial (28-43)", value: "millennial" },
  { label: "Gen X (44-59)", value: "gen-x" },
  { label: "Baby Boomer (60+)", value: "boomer" },
  { label: "All Age Groups", value: "all-ages" },
]

const demographicLocationOptions: MultiSelectOption[] = [
  { label: "Local/City", value: "local" },
  { label: "Regional/State", value: "regional" },
  { label: "National", value: "national" },
  { label: "Global/International", value: "global" },
]

const solutionApproachOptions: MultiSelectOption[] = [
  { label: "Software/App Solution", value: "software" },
  { label: "Service-based Solution", value: "service" },
  { label: "Physical Product", value: "product" },
  { label: "Process Improvement", value: "process" },
  { label: "Platform/Marketplace", value: "platform" },
  { label: "Automation/AI", value: "automation" },
]

const resourcesOptions: MultiSelectOption[] = [
  { label: "Just myself", value: "self" },
  { label: "Small team (2-3 people)", value: "small-team" },
  { label: "Team (4-10 people)", value: "team" },
  { label: "Large team (10+ people)", value: "large-team" },
  { label: "External partners/vendors", value: "external" },
]

const skillsRequiredOptions: MultiSelectOption[] = [
  { label: "Technical/Development", value: "technical" },
  { label: "Design/UX", value: "design" },
  { label: "Marketing/Sales", value: "marketing" },
  { label: "Business Strategy", value: "business" },
  { label: "Operations/Management", value: "operations" },
]

const primaryGoalOptions: MultiSelectOption[] = [
  { label: "Generate Revenue", value: "revenue" },
  { label: "Acquire Users/Customers", value: "users" },
  { label: "Improve Efficiency", value: "efficiency" },
  { label: "Build Brand Awareness", value: "brand" },
  { label: "Solve a Problem", value: "problem-solving" },
  { label: "Learning/Experience", value: "learning" },
  { label: "Social Impact", value: "impact" },
]

const successMetricsOptions: MultiSelectOption[] = [
  { label: "Monthly/Annual Revenue", value: "revenue" },
  { label: "User/Customer Count", value: "users" },
  { label: "User Engagement Metrics", value: "engagement" },
  { label: "Customer Satisfaction", value: "satisfaction" },
  { label: "Efficiency Improvements", value: "efficiency" },
  { label: "Market Share", value: "market-share" },
  { label: "Return on Investment", value: "roi" },
]

const priorityOptions: SelectWithCustomOption[] = [
  { label: "Low - Nice to have", value: "low" },
  { label: "Medium - Important", value: "medium" },
  { label: "High - Critical", value: "high" },
  { label: "Urgent - Must do now", value: "urgent" },
]

const audienceSizeOptions: SelectWithCustomOption[] = [
  { label: "Small (< 1,000 people)", value: "small" },
  { label: "Medium (1K - 10K people)", value: "medium" },
  { label: "Large (10K - 100K people)", value: "large" },
  { label: "Massive (100K+ people)", value: "massive" },
]

const competitorAnalysisOptions: SelectWithCustomOption[] = [
  { label: "No direct competitors", value: "none" },
  { label: "Few competitors (1-3)", value: "few" },
  { label: "Some competitors (4-10)", value: "some" },
  { label: "Many competitors (10+)", value: "many" },
  { label: "Market is saturated", value: "saturated" },
]

const timeframeOptions: SelectWithCustomOption[] = [
  { label: "1 Week or less", value: "1-week" },
  { label: "2-4 Weeks", value: "2-4-weeks" },
  { label: "1-3 Months", value: "1-3-months" },
  { label: "3-6 Months", value: "3-6-months" },
  { label: "6-12 Months", value: "6-12-months" },
  { label: "1+ Years", value: "1-year-plus" },
]

const budgetOptions: SelectWithCustomOption[] = [
  { label: "Minimal ($0 - $1K)", value: "minimal" },
  { label: "Low ($1K - $5K)", value: "low" },
  { label: "Medium ($5K - $25K)", value: "medium" },
  { label: "High ($25K - $100K)", value: "high" },
  { label: "Enterprise ($100K+)", value: "enterprise" },
]

const riskAssessmentOptions: SelectWithCustomOption[] = [
  { label: "Low Risk - Safe bet", value: "low" },
  { label: "Medium Risk - Calculated risk", value: "medium" },
  { label: "High Risk - Big potential payoff", value: "high" },
  { label: "Experimental - Learning opportunity", value: "experimental" },
]

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
]

export default function IdeaBuilderPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<FormData>(initialFormData)

  const updateFormData = (field: keyof FormData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const progress = (currentStep / steps.length) * 100

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = () => {
    console.log("Idea submitted:", formData)
    // Handle form submission
  }

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
                  onChange={(e) => updateFormData("ideaDescription", e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="category">Categories *</Label>
                <MultiSelect
                  options={categoryOptions}
                  selected={formData.category}
                  onChange={(selected) => updateFormData("category", selected)}
                  placeholder="Select categories (you can select multiple)"
                  allowCustom={true}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="priority">Priority Level *</Label>
                <SelectWithCustom
                  options={priorityOptions}
                  value={formData.priority}
                  onChange={(value) => updateFormData("priority", value)}
                  placeholder="How important is this idea?"
                  allowCustom={true}
                />
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="targetAudience">Target Audiences *</Label>
                <MultiSelect
                  options={targetAudienceOptions}
                  selected={formData.targetAudience}
                  onChange={(selected) => updateFormData("targetAudience", selected)}
                  placeholder="Who are your target audiences? (select multiple)"
                  allowCustom={true}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="audienceSize">Estimated Audience Size *</Label>
                <SelectWithCustom
                  options={audienceSizeOptions}
                  value={formData.audienceSize}
                  onChange={(value) => updateFormData("audienceSize", value)}
                  placeholder="How large is your target market?"
                  allowCustom={true}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="demographicAge">Age Groups *</Label>
                <MultiSelect
                  options={demographicAgeOptions}
                  selected={formData.demographicAge}
                  onChange={(selected) => updateFormData("demographicAge", selected)}
                  placeholder="What age groups are you targeting? (select multiple)"
                  allowCustom={true}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="demographicLocation">Geographic Focus *</Label>
                <MultiSelect
                  options={demographicLocationOptions}
                  selected={formData.demographicLocation}
                  onChange={(selected) => updateFormData("demographicLocation", selected)}
                  placeholder="Where is your audience located? (select multiple)"
                  allowCustom={true}
                />
              </div>
            </div>
          </div>
        )

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
                  onChange={(e) => updateFormData("problemStatement", e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="solutionApproach">Solution Approaches *</Label>
                <MultiSelect
                  options={solutionApproachOptions}
                  selected={formData.solutionApproach}
                  onChange={(selected) => updateFormData("solutionApproach", selected)}
                  placeholder="How do you plan to solve this problem? (select multiple)"
                  allowCustom={true}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="competitorAnalysis">Existing Competitors *</Label>
                <SelectWithCustom
                  options={competitorAnalysisOptions}
                  value={formData.competitorAnalysis}
                  onChange={(value) => updateFormData("competitorAnalysis", value)}
                  placeholder="How many competitors exist?"
                  allowCustom={true}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="uniqueValueProp">Unique Value Proposition *</Label>
                <Input
                  id="uniqueValueProp"
                  placeholder="What makes your solution unique/better?"
                  value={formData.uniqueValueProp}
                  onChange={(e) => updateFormData("uniqueValueProp", e.target.value)}
                />
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="timeframe">Implementation Timeframe *</Label>
                <SelectWithCustom
                  options={timeframeOptions}
                  value={formData.timeframe}
                  onChange={(value) => updateFormData("timeframe", value)}
                  placeholder="How long will this take to implement?"
                  allowCustom={true}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="budget">Budget Range *</Label>
                <SelectWithCustom
                  options={budgetOptions}
                  value={formData.budget}
                  onChange={(value) => updateFormData("budget", value)}
                  placeholder="What's your budget for this idea?"
                  allowCustom={true}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="resources">Required Resources *</Label>
                <MultiSelect
                  options={resourcesOptions}
                  selected={formData.resources}
                  onChange={(selected) => updateFormData("resources", selected)}
                  placeholder="What resources do you need? (select multiple)"
                  allowCustom={true}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="skillsRequired">Key Skills Required *</Label>
                <MultiSelect
                  options={skillsRequiredOptions}
                  selected={formData.skillsRequired}
                  onChange={(selected) => updateFormData("skillsRequired", selected)}
                  placeholder="What skills are most important? (select multiple)"
                  allowCustom={true}
                />
              </div>
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-6">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="primaryGoal">Primary Goals *</Label>
                <MultiSelect
                  options={primaryGoalOptions}
                  selected={formData.primaryGoal}
                  onChange={(selected) => updateFormData("primaryGoal", selected)}
                  placeholder="What are your main goals? (select multiple)"
                  allowCustom={true}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="successMetrics">Success Metrics *</Label>
                <MultiSelect
                  options={successMetricsOptions}
                  selected={formData.successMetrics}
                  onChange={(selected) => updateFormData("successMetrics", selected)}
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
                  onChange={(e) => updateFormData("expectedOutcome", e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="riskAssessment">Risk Assessment *</Label>
                <SelectWithCustom
                  options={riskAssessmentOptions}
                  value={formData.riskAssessment}
                  onChange={(value) => updateFormData("riskAssessment", value)}
                  placeholder="What's the risk level?"
                  allowCustom={true}
                />
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const currentStepData = steps[currentStep - 1]

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#">Create</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Idea Builder</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {/* Progress Header */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Idea Builder</h1>
                <p className="text-muted-foreground">
                  Turn your concept into a structured, actionable idea
                </p>
              </div>
              <div className="text-sm text-muted-foreground">
                Step {currentStep} of {steps.length}
              </div>
            </div>
            
            <Progress value={progress} className="w-full" />
            
            {/* Step Indicators */}
            <div className="flex items-center justify-between">
              {steps.map((step, index) => {
                const StepIcon = step.icon
                const isActive = step.id === currentStep
                const isCompleted = step.id < currentStep
                
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
                      <div className={`text-sm font-medium ${isActive ? "text-primary" : ""}`}>
                        {step.title}
                      </div>
                    </div>
                  </div>
                )
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
              <CardDescription>
                {currentStepData.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderStepContent()}
            </CardContent>
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
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}