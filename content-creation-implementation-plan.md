# Content Creation Wizard - Implementation Plan

## Project Overview

Create a comprehensive content creation wizard at `/content/create` that simplifies the flow creation process by:
- Removing technical complexity (AI models, advanced RAG settings, project selection)
- Using a multi-step wizard with conditional field dependencies
- Following existing design patterns (PageLayout, typeform components)
- Implementing a bold, simple, yet comprehensive form design
- Adding human-in-loop approval workflows

## Analysis Summary

### Existing Codebase Patterns
- **Page Structure**: Uses `PageLayout` component with breadcrumbs, title, description, actions
- **Data Flow**: Content page at `/app/content/page.tsx` shows generated content with `ContentData` interface
- **UI Components**: Typeform-style components for wizard interactions (`QuestionCard`, multi-select, etc.)
- **Routing**: Next.js app router structure
- **Types**: Centralized in `/types/` folder with index export system

### Key Requirements Analysis
1. **Simplified Wizard**: 7 steps instead of 10+ technical sections
2. **Dynamic Dependencies**: Questions appear/change based on previous answers
3. **No Technical Questions**: Remove AI model config, advanced RAG, project selection
4. **Human-in-Loop**: Add approval workflow interface
5. **Bold & Simple Design**: Professional but not typeform-style, comprehensive form

## Implementation Plan

### Phase 1: Type System & Data Models

#### 1.1 Core Content Creation Types (`types/content-creation.ts`)
```typescript
interface ContentCreationFormData {
  // Step 1: Topic & Basics
  topicId: string;
  platform: 'Website' | 'Social Media';
  contentType: string; // Dynamic based on platform
  industry: string;

  // Step 2: Audience & Goals
  audienceSize: 'Small' | 'Medium' | 'Large';
  audienceType: string[];
  readingLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  goals: string[];

  // Step 3: Voice & Localization
  tone: string[];
  region: string;
  language: string;

  // Step 4: Content Structure
  contentLength: ContentLengthOption;
  primaryKeywords?: string[];
  searchIntent?: string[];
  includeTOC: boolean;
  includeSummary: boolean;
  includeCTA: boolean;
  includeKeyTakeaways: boolean;

  // Step 5: Research Settings (Simplified)
  researchLevel: 'Basic' | 'Comprehensive' | 'Expert';
  includeLatestInfo: boolean;
  includeExamples: boolean;
  factChecking: 'Basic' | 'Standard' | 'Strict';
  contentFreshness: 'Very Recent (1 month)' | 'Recent (6 months)' | 'Moderate (1 year)' | 'Extended (2 years)' | 'All Time';
  includeStatistics: boolean;
  includeQuotes: boolean;
  competitorAnalysis: boolean;

  // Step 6: Human Review
  enableHumansInLoop: boolean;
  humanReviewers: string[];

  // Step 7: Output Format (Hidden/Auto)
  format: 'Markdown'; // Default
  includeFrontMatter: boolean; // Auto true
}

interface WizardStep {
  id: string;
  title: string;
  description: string;
  fields: WizardField[];
  validation: ValidationSchema;
}

interface WizardField {
  id: string;
  label: string;
  type: 'radio' | 'multi-select' | 'dropdown' | 'toggle' | 'tag-input' | 'custom-length';
  required: boolean;
  options?: SelectOption[] | ((formData: Partial<ContentCreationFormData>) => SelectOption[]);
  dependsOn?: FieldDependency[];
  visible?: (formData: Partial<ContentCreationFormData>) => boolean;
  helpText?: string;
  defaultValue?: any;
}

interface FieldDependency {
  field: string;
  values: any[];
  action: 'show' | 'hide' | 'filter-options';
}
```

#### 1.2 Step Configuration (`types/wizard-config.ts`)
```typescript
interface WizardConfig {
  steps: WizardStep[];
  dependencies: DependencyMap;
  validation: ValidationConfig;
}

interface WizardState {
  currentStep: number;
  formData: Partial<ContentCreationFormData>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isValid: boolean;
  canProceed: boolean;
}
```

### Phase 2: Wizard Step Configuration

#### 2.1 Step Definitions (`lib/wizard-steps.ts`)
Define the 6 simplified steps:

1. **Topic & Content Type** (3 questions)
   - Topic selection (from API)
   - Platform (Website/Social Media)
   - Content Type (dependent on platform)
   - Industry (pre-filled, editable)

2. **Audience & Goals** (4 questions)
   - Audience size
   - Audience type (filtered by industry)
   - Reading level
   - Goals (filtered by platform/type)

3. **Voice & Style** (3 questions)
   - Tone (suggested by audience/reading level)
   - Region
   - Language (English only for now)

4. **Content Structure** (6 questions)
   - Content length (type-specific options)
   - Primary keywords (optional, AI-suggested)
   - Search intent (conditional)
   - Include TOC (conditional on length)
   - Include Summary (conditional on length)
   - Include CTA (conditional on goals)

5. **Research Settings** (8 simplified questions)
   - Research level
   - Include latest info
   - Include examples
   - Fact checking level
   - Content freshness
   - Include statistics
   - Include quotes
   - Competitor analysis

6. **Review & Launch** (2 questions)
   - Human review toggle
   - Reviewer selection (if enabled)

#### 2.2 Dependency Logic (`lib/wizard-dependencies.ts`)
```typescript
const dependencies: DependencyMap = {
  contentType: {
    dependsOn: [{ field: 'platform', values: ['Social Media'], options: ['Thread', 'Carousel', 'Post', 'Poll', 'Video Script'] }]
  },
  audienceType: {
    dependsOn: [{ field: 'industry', filterOptions: true }]
  },
  tone: {
    dependsOn: [{ field: 'audienceType', suggests: true }, { field: 'readingLevel', suggests: true }]
  },
  includeTOC: {
    dependsOn: [{ field: 'contentLength', values: ['Medium', 'Long'], show: true }]
  },
  // ... more dependencies
};
```

### Phase 3: Component Architecture

#### 3.1 Main Page Component (`app/content/create/page.tsx`)
```typescript
export default function CreateContentPage() {
  return (
    <PageLayout
      title="Create Content"
      description="Generate high-quality content with AI assistance"
      breadcrumbs={[
        { label: "Content", href: "/content" },
        { label: "Create Content" }
      ]}
    >
      <ContentCreationWizard />
    </PageLayout>
  );
}
```

#### 3.2 Wizard Container (`components/content-creation/wizard-container.tsx`)
- State management with useReducer
- Step navigation logic
- Form validation
- Progress tracking
- Auto-save functionality

#### 3.3 Step Components (`components/content-creation/steps/`)
- `TopicAndTypeStep.tsx`
- `AudienceAndGoalsStep.tsx`
- `VoiceAndStyleStep.tsx`
- `ContentStructureStep.tsx`
- `ResearchSettingsStep.tsx`
- `ReviewAndLaunchStep.tsx`

#### 3.4 Specialized Field Components (`components/content-creation/fields/`)
- `ContentLengthSelector.tsx` - Radio + custom input
- `KeywordTagInput.tsx` - Tag input with AI suggestions
- `HumanReviewersSelector.tsx` - Team member multi-select
- `ConditionalFieldWrapper.tsx` - Handles dependency logic

### Phase 4: Advanced Features

#### 4.1 Dependency Engine (`lib/dependency-engine.ts`)
```typescript
class WizardDependencyEngine {
  evaluateFieldVisibility(field: WizardField, formData: Partial<ContentCreationFormData>): boolean
  getFilteredOptions(field: WizardField, formData: Partial<ContentCreationFormData>): SelectOption[]
  getSuggestedValues(field: WizardField, formData: Partial<ContentCreationFormData>): any[]
  validateStep(stepId: string, formData: Partial<ContentCreationFormData>): ValidationResult
}
```

#### 4.2 Auto-save & Draft Management (`hooks/use-wizard-persistence.ts`)
```typescript
const useWizardPersistence = (wizardId: string) => {
  // Auto-save every 30 seconds
  // Load draft on mount
  // Clear draft on completion
  // Handle conflicts
}
```

#### 4.3 Progress Tracking (`components/content-creation/progress-indicator.tsx`)
```typescript
interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  completedFields: number;
  totalFields: number;
  canSkipStep: boolean;
}
```

### Phase 5: Human-in-Loop Interface

#### 5.1 Reviewer Selection (`components/content-creation/human-review-setup.tsx`)
- Toggle for enabling human review
- Multi-select for reviewer selection
- Review stage configuration
- Notification preferences

#### 5.2 Review Workflow Types (`types/review-workflow.ts`)
```typescript
interface ReviewWorkflow {
  enabled: boolean;
  reviewers: ReviewerAssignment[];
  stages: ReviewStage[];
  notifications: NotificationConfig;
}

interface ReviewStage {
  id: string;
  name: string;
  description: string;
  reviewers: string[];
  required: boolean;
  autoApprove: boolean;
}
```

### Phase 6: UI/UX Implementation

#### 6.1 Design System Adherence
- Use existing `Button`, `Card`, `Input` components
- Follow `PageLayout` structure
- Implement smooth animations with `framer-motion`
- Ensure mobile responsiveness

#### 6.2 Enhanced UX Features
- **Smart Defaults**: Pre-fill based on topic metadata
- **Progressive Disclosure**: Show advanced options only when needed
- **Real-time Validation**: Immediate feedback on errors
- **Contextual Help**: Tooltips and help text for complex options
- **Keyboard Navigation**: Full keyboard support
- **Auto-generation**: Flow name, keywords, etc.

#### 6.3 Visual Design
- **Bold Typography**: Large, clear headings
- **Simple Layout**: Single-column, card-based design
- **Clear Progress**: Step indicator with completion status
- **Conditional Animations**: Smooth field appearance/disappearance
- **Action Buttons**: Prominent Next/Back/Save buttons

### Phase 7: Integration & Testing

#### 7.1 API Integration
- Topic loading from existing API
- Team members for reviewer selection
- Content creation endpoint integration
- Progress tracking endpoint

#### 7.2 Form Validation
```typescript
const validationSchema = {
  step1: yup.object({
    topicId: yup.string().required(),
    platform: yup.string().required(),
    contentType: yup.string().required(),
  }),
  // ... more validation schemas
};
```

#### 7.3 Error Handling
- Field-level validation errors
- Step-level validation
- API error handling
- Network failure recovery
- Draft conflict resolution

## Implementation Timeline

### Week 1: Foundation
- [ ] Create type definitions
- [ ] Set up wizard configuration
- [ ] Implement dependency engine
- [ ] Create main page structure

### Week 2: Core Wizard
- [ ] Build wizard container
- [ ] Implement first 3 steps
- [ ] Add step navigation
- [ ] Basic validation

### Week 3: Advanced Features
- [ ] Implement remaining steps
- [ ] Add conditional field logic
- [ ] Auto-save functionality
- [ ] Progress tracking

### Week 4: Polish & Integration
- [ ] Human-in-loop interface
- [ ] Final UI/UX polish
- [ ] API integration
- [ ] Testing & bug fixes

## Technical Decisions

### State Management
- **useReducer** for complex wizard state
- **React Hook Form** for form validation
- **Zustand** for global draft persistence (if needed)

### Styling Approach
- **Tailwind CSS** following existing patterns
- **CSS Grid/Flexbox** for responsive layout
- **Framer Motion** for animations
- **Existing component library** for consistency

### Performance Optimizations
- **Lazy loading** of step components
- **Debounced** auto-save
- **Memoized** dependency calculations
- **Virtualized** large option lists

### Accessibility
- **ARIA labels** for all form elements
- **Keyboard navigation** support
- **Screen reader** compatibility
- **High contrast** mode support

## Success Metrics

### User Experience
- [ ] < 5 minutes average completion time
- [ ] > 90% step completion rate
- [ ] < 10% form abandonment
- [ ] > 4.5/5 user satisfaction score

### Technical Performance
- [ ] < 2s initial page load
- [ ] < 500ms step transitions
- [ ] 99% uptime
- [ ] Zero data loss incidents

### Content Quality
- [ ] > 85% generated content approval rate
- [ ] < 20% human review rejection rate
- [ ] > 4/5 content quality score from reviewers

## Risk Mitigation

### Technical Risks
- **Complex Dependencies**: Implement comprehensive testing for conditional logic
- **Performance**: Use React profiling and optimization techniques
- **Data Loss**: Implement robust auto-save with conflict resolution

### UX Risks
- **Cognitive Overload**: Progressive disclosure and smart defaults
- **Mobile Usability**: Responsive design testing on all devices
- **Accessibility**: Regular accessibility audits

### Integration Risks
- **API Changes**: Version API contracts and implement graceful degradation
- **Data Migration**: Backwards compatibility for existing content structures

This implementation plan provides a comprehensive roadmap for creating a sophisticated yet user-friendly content creation wizard that meets all specified requirements while maintaining consistency with the existing codebase.