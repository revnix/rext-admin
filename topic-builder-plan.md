# Topic Builder Implementation Plan

## Overview
This plan outlines the complete replacement of the existing general idea builder with a comprehensive content topic generation tool. The new topic builder will use a hybrid wizard approach combining both "topic-first" and "industry-first" flows to generate AI-powered content topic ideas.

## Architecture Analysis

### Current State
- **Existing Component**: `/app/ideas/create/page.tsx` - General business idea builder (5 steps)
- **Tech Stack**: Next.js 15 App Router, React 19, TypeScript, Tailwind CSS 4, shadcn/ui 3
- **UI Components Available**: MultiSelect, SelectWithCustom, Input, Textarea, Button, Card, Progress, etc.
- **Type Organization**: Inline interfaces (no dedicated types folder observed)

### Target Replacement
- Replace general idea builder with content topic generation wizard
- Implement hybrid flow supporting both variations from requirements
- Add AI integration for topic generation
- Create result display with topic management features

## Implementation Plan

### Phase 1: Type Definitions & Core Architecture

#### Task 1.1: Create Type Definitions
**File**: `types/topic-builder.ts` (following user rule to move types to types folder)

```typescript
// Core interfaces for the topic builder
export interface TopicBuilderFormData {
  // Flow type
  flowType: 'subject-first' | 'industry-first'
  
  // Subject-first specific fields
  subject?: string
  
  // Industry/Domain (required for both flows)
  industry: string
  industry_other?: string
  
  // Content type and platform
  content_type: string
  content_type_other?: string
  platform?: string
  platform_other?: string
  
  // Audience and targeting
  audience?: string
  audience_size?: string
  demographic_age: string[]
  demographic_location: string[]
  reader_level?: string
  
  // Content goals and style
  purpose: string[]
  purpose_other?: string
  content_goal: string[]
  tone: string[]
  tone_other?: string
  
  // Advanced options
  keywords?: string
  exclude?: string
  focus?: string // Industry-first flow specific
  num_ideas: number
  notes?: string
  
  // Region and language
  region?: string
  language?: string
  
  // YMYL auto-detection
  is_ymyl?: boolean
  
  // Content preferences
  fresh_vs_evergreen?: 'fresh' | 'evergreen' | 'balanced'
  safe_vs_original?: 'safe' | 'original' | 'balanced'
}

export interface GeneratedTopic {
  id: string
  title: string
  angle: string
  description?: string
  channel_fit: string[]
  audience_fit: string[]
  why_it_works: string
  scores: {
    relevance: number
    freshness: number
    novelty: number
  }
  tags: string[]
  is_saved?: boolean
}

export interface TopicGenerationRequest {
  formData: TopicBuilderFormData
  timestamp: string
}

export interface TopicGenerationResponse {
  topics: GeneratedTopic[]
  request_id: string
  generated_at: string
}
```

#### Task 1.2: Create Utility Functions
**File**: `lib/topic-builder-utils.ts`

```typescript
// Utility functions for topic builder
export const detectYMYL = (industry: string): boolean => {
  const ymylIndustries = ['healthcare', 'finance', 'legal', 'medical']
  return ymylIndustries.some(ymyl => 
    industry.toLowerCase().includes(ymyl)
  )
}

export const getAudienceOptionsForIndustry = (industry: string): MultiSelectOption[] => {
  // Dynamic audience options based on industry
}

export const buildPromptFromFormData = (formData: TopicBuilderFormData): string => {
  // Convert form data to AI prompt
}

export const validateFormStep = (step: number, formData: TopicBuilderFormData): boolean => {
  // Validation logic for each step
}
```

### Phase 2: Core Components Development

#### Task 2.1: Create Topic Builder Wizard Component
**File**: `app/ideas/create/page.tsx` (replace existing)

**Features:**
- 8-step wizard with progress indicator
- Hybrid flow selection at start
- Dynamic step content based on flow type
- Form validation and error handling
- Advanced options in collapsible sections
- Responsive design

**Steps Structure:**
1. **Flow Selection** - Choose between subject-first or industry-first
2. **Industry/Domain** - Industry selection (or subject + industry for subject-first)
3. **Audience & Targeting** - Target audience, demographics, reader level
4. **Content Format & Platform** - Content type, platform selection
5. **Content Goals & Style** - Purpose, content goals, tone preferences
6. **Advanced Options** (Collapsible) - Keywords, constraints, region/language
7. **Review & Preferences** - Summary review, final preferences
8. **Generate Topics** - AI generation with loading state

#### Task 2.2: Create Individual Step Components
**File**: `components/topic-builder/` (new directory)

- `FlowSelectionStep.tsx` - Initial flow choice
- `IndustryStep.tsx` - Industry/domain selection
- `AudienceStep.tsx` - Audience targeting
- `ContentFormatStep.tsx` - Content type and platform
- `ContentGoalsStep.tsx` - Goals and style preferences
- `AdvancedOptionsStep.tsx` - Keywords, constraints, preferences
- `ReviewStep.tsx` - Summary and final review
- `GenerationStep.tsx` - AI generation interface

#### Task 2.3: Create Topic Results Components
**File**: `components/topic-builder/results/`

- `TopicCard.tsx` - Individual topic display card
- `TopicsList.tsx` - List of generated topics
- `TopicFilters.tsx` - Sort/filter by relevance, freshness, novelty
- `TopicActions.tsx` - Save, edit, regenerate actions
- `BatchActions.tsx` - Select multiple, bulk save

### Phase 3: State Management & Data Flow

#### Task 3.1: Implement Form State Management
**Approach**: React useState with custom hooks for complex state logic

**File**: `hooks/use-topic-builder.ts`

```typescript
export const useTopicBuilder = () => {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<TopicBuilderFormData>(initialFormData)
  const [generatedTopics, setGeneratedTopics] = useState<GeneratedTopic[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  
  // Form management functions
  const updateFormData = (field: keyof TopicBuilderFormData, value: any) => {
    // Update logic with dependency handling
  }
  
  const validateCurrentStep = () => {
    // Validation logic
  }
  
  const generateTopics = async () => {
    // AI generation logic
  }
  
  return {
    // State and functions
  }
}
```

#### Task 3.2: Create Option Data Provider
**File**: `data/topic-builder-options.ts`

```typescript
// All dropdown/select options organized by category
export const industryOptions: MultiSelectOption[] = [
  { label: "Technology / IT", value: "technology" },
  { label: "Healthcare / Medical", value: "healthcare" },
  // ... comprehensive list
]

export const getAudienceOptions = (industry: string): MultiSelectOption[] => {
  // Dynamic options based on industry
}
```

### Phase 4: AI Integration & Backend

#### Task 4.1: Create API Route for Topic Generation
**File**: `app/api/generate-topics/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { TopicBuilderFormData, GeneratedTopic } from '@/types/topic-builder'

export async function POST(request: NextRequest) {
  try {
    const formData: TopicBuilderFormData = await request.json()
    
    // Build AI prompt from form data
    const prompt = buildPromptFromFormData(formData)
    
    // Call AI service (OpenAI/Groq based on tech stack)
    const response = await generateTopicsWithAI(prompt, formData.num_ideas)
    
    // Parse and format response
    const topics: GeneratedTopic[] = parseAIResponse(response)
    
    return NextResponse.json({
      topics,
      request_id: generateRequestId(),
      generated_at: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate topics' },
      { status: 500 }
    )
  }
}
```

#### Task 4.2: Implement AI Service
**File**: `lib/ai-service.ts`

```typescript
// AI service for topic generation
export const generateTopicsWithAI = async (
  prompt: string, 
  numIdeas: number
): Promise<string> => {
  // Integration with OpenAI/Groq API
  // Following tech stack requirements
}

export const parseAIResponse = (response: string): GeneratedTopic[] => {
  // Parse AI response into structured format
}
```

### Phase 5: Enhanced UI Components

#### Task 5.1: Create Custom UI Components
**File**: `components/ui/` (additions)

- `toggle-group.tsx` - For fresh vs evergreen, safe vs original toggles
- `chip-selector.tsx` - For audience chips with industry-based suggestions
- `collapsible-section.tsx` - For advanced options
- `step-indicator.tsx` - Custom step progress indicator

#### Task 5.2: Create Topic Builder Specific Components
**File**: `components/topic-builder/ui/`

- `FlowSelector.tsx` - Visual flow selection component
- `IndustryCombobox.tsx` - Searchable industry selector with YMYL detection
- `DependentSelect.tsx` - Platform selector that shows based on content type
- `ScoreDisplay.tsx` - Visual representation of topic scores
- `TopicPreview.tsx` - Preview card for generated topics

### Phase 6: Data Persistence & Management

#### Task 6.1: Implement Local Storage for Draft Saving
**File**: `hooks/use-local-storage.ts`

```typescript
export const useLocalStorage = <T>(key: string, initialValue: T) => {
  // Local storage hook for saving drafts
}
```

#### Task 6.2: Create Topic Management System
**File**: `lib/topic-management.ts`

```typescript
// Functions for managing saved topics
export const saveTopicToLibrary = (topic: GeneratedTopic) => {
  // Save to ideas library
}

export const exportTopics = (topics: GeneratedTopic[], format: 'json' | 'csv') => {
  // Export functionality
}
```

### Phase 7: Testing Strategy

#### Task 7.1: Unit Tests
**Framework**: Jest + React Testing Library

**Test Files:**
- `__tests__/topic-builder-utils.test.ts` - Utility functions
- `__tests__/use-topic-builder.test.ts` - Custom hooks
- `__tests__/api/generate-topics.test.ts` - API route testing

**Test Coverage:**
- Form validation logic
- YMYL detection
- Dependent field updates
- Prompt generation
- Topic parsing

#### Task 7.2: Component Tests
**Test Files:**
- `__tests__/components/topic-builder/` - All wizard step components
- `__tests__/components/topic-builder/results/` - Results components

**Test Scenarios:**
- Form state management
- Step navigation
- Conditional rendering
- User interactions
- Error states

#### Task 7.3: Integration Tests
**Test Files:**
- `__tests__/integration/topic-builder-flow.test.ts`

**Test Scenarios:**
- Complete wizard flow (both variations)
- AI integration workflow
- Topic generation and display
- Topic saving functionality

#### Task 7.4: E2E Tests (Optional)
**Framework**: Playwright (if budget allows)

**Test Scenarios:**
- Full user journey from wizard to topic generation
- Cross-browser compatibility
- Mobile responsiveness

### Phase 8: Documentation & Polish

#### Task 8.1: Component Documentation
**Files:**
- Update component JSDoc comments
- Create Storybook stories (if implemented)
- Add prop type documentation

#### Task 8.2: User Experience Enhancements
- Loading states and skeletons
- Error boundaries
- Toast notifications for actions
- Keyboard navigation support
- Screen reader accessibility

#### Task 8.3: Performance Optimization
- Code splitting for wizard steps
- Lazy loading of non-critical components
- Memoization of expensive operations
- API response caching

## Technical Implementation Details

### Form Validation Strategy
```typescript
const validationRules = {
  step1: (data) => data.flowType && (data.industry || data.subject),
  step2: (data) => data.industry && data.audience?.length > 0,
  step3: (data) => data.content_type && data.purpose.length > 0,
  // ... validation for each step
}
```

### Dependency Management
```typescript
const handleIndustryChange = (industry: string) => {
  setFormData(prev => ({
    ...prev,
    industry,
    is_ymyl: detectYMYL(industry),
    audience: [], // Reset dependent fields
    demographic_age: [],
    demographic_location: []
  }))
}
```

### AI Prompt Template
```typescript
const promptTemplate = `
Generate ${numIdeas} content topic ideas for the ${industry} industry.

Target Audience: ${audience.join(', ')}
Content Type: ${contentType}
Platform: ${platform}
Goal: ${purpose.join(', ')}
Tone: ${tone.join(', ')}

${keywords ? `Focus Keywords: ${keywords}` : ''}
${exclude ? `Avoid: ${exclude}` : ''}

Return as JSON array with: title, angle, why_it_works, scores (relevance, freshness, novelty), tags
`
```

## Migration Strategy

### Step 1: Backup Current Implementation
- Create backup of existing `/app/ideas/create/page.tsx`
- Document current functionality for reference

### Step 2: Gradual Replacement
- Implement new topic builder in parallel path
- A/B test with small user group
- Gradually migrate users to new system

### Step 3: Data Migration
- If existing ideas need to be preserved, create migration script
- Update navigation and routing
- Update any references to old idea builder

## Timeline Estimation

### Phase 1-2: Core Development (2 weeks)
- Type definitions and utilities
- Basic wizard structure
- Core step components

### Phase 3-4: Advanced Features (2 weeks)
- State management implementation
- AI integration
- Advanced UI components

### Phase 5-6: Polish & Integration (1 week)
- Enhanced UI components
- Data persistence
- Integration with existing system

### Phase 7: Testing & QA (1 week)
- Comprehensive testing
- Bug fixes and optimizations
- Performance tuning

### Phase 8: Documentation & Deployment (0.5 week)
- Documentation completion
- Final polishing
- Production deployment

**Total Estimated Time: 6.5 weeks**

## Success Metrics

### Functional Requirements
- ✅ Complete wizard flow for both variations
- ✅ AI-powered topic generation
- ✅ Dynamic form dependencies
- ✅ Advanced options in collapsible sections
- ✅ Topic management and saving
- ✅ Responsive design

### Performance Requirements
- Page load time < 2 seconds
- Topic generation < 10 seconds
- Form interactions < 100ms response time
- Mobile-first responsive design

### User Experience Requirements
- Intuitive step-by-step flow
- Clear progress indication
- Helpful tooltips and examples
- Error states with clear messaging
- Accessibility compliance (WCAG 2.1 AA)

## Risk Assessment & Mitigation

### Technical Risks
**Risk**: AI API rate limits or failures
**Mitigation**: Implement retry logic, fallback options, and caching

**Risk**: Complex form state management
**Mitigation**: Thorough testing, gradual rollout, fallback to simpler version

**Risk**: Performance issues with large option lists
**Mitigation**: Virtualization, lazy loading, search optimization

### User Experience Risks
**Risk**: Wizard too complex for casual users
**Mitigation**: Smart defaults, optional steps, guided tour

**Risk**: Generated topics not meeting expectations
**Mitigation**: Multiple generation attempts, refinement options, feedback collection

## Deployment Strategy

### Development Environment
- Feature branch development
- Local testing with mock AI responses
- Comprehensive unit and integration testing

### Staging Environment
- Full AI integration testing
- User acceptance testing
- Performance testing under load

### Production Deployment
- Blue-green deployment strategy
- Feature flags for gradual rollout
- Monitoring and analytics implementation
- Rollback plan in case of issues

## Post-Launch Considerations

### Monitoring & Analytics
- Track wizard completion rates
- Monitor AI generation success rates
- Collect user feedback on generated topics
- Performance monitoring and optimization

### Future Enhancements
- Topic templates and saved configurations
- Collaborative topic generation
- Integration with content calendar
- Advanced AI models for better generation
- Topic performance analytics

This comprehensive plan ensures a robust, scalable, and user-friendly topic builder that meets all specified requirements while following the established tech stack and architectural patterns.

