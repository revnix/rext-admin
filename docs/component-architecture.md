# Component Architecture for TypeForm-like Topic Builder

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Component Hierarchy](#component-hierarchy)
3. [Core Components](#core-components)
4. [Question Components](#question-components)
5. [State Management](#state-management)
6. [Data Flow](#data-flow)
7. [Props Interfaces](#props-interfaces)
8. [Animation Integration](#animation-integration)
9. [Accessibility Patterns](#accessibility-patterns)
10. [Testing Strategy](#testing-strategy)

---

## Architecture Overview

### Design Principles
1. **Single Responsibility**: Each component has one clear purpose
2. **Composability**: Components can be easily combined and reused
3. **Accessibility First**: WCAG 2.1 AA compliance built-in
4. **Performance Optimized**: Lazy loading and efficient re-renders
5. **Type Safety**: Full TypeScript support with strict types

### Current vs New Architecture

#### Current Structure (Multi-step Wizard)
```
TopicBuilderPage
├── WizardSidebar (step navigation)
├── StepContainer
│   ├── IndustryStep (multiple fields)
│   ├── AudienceStep (multiple fields)
│   ├── ContentFormatStep (multiple fields)
│   ├── GoalsStep (multiple fields)
│   ├── AdvancedStep (multiple fields)
│   └── ReviewStep (summary)
└── Navigation (Next/Back buttons)
```

#### New Structure (Single-question Flow)
```
TopicBuilderWizard
├── ProgressIndicator
├── QuestionContainer
│   ├── QuestionTransition (Framer Motion wrapper)
│   │   └── CurrentQuestion (dynamic component)
│   │       ├── QuestionHeader (title, description)
│   │       ├── QuestionContent (options, inputs)
│   │       └── QuestionFooter (navigation, help)
│   └── WizardNavigation
└── WizardProvider (context + state)
```

---

## Component Hierarchy

### Directory Structure
```
components/topic-builder/wizard/
├── index.ts                          # Export all components
├── WizardProvider.tsx                # Context provider for wizard state
├── TopicBuilderWizard.tsx           # Main wizard container
├── ProgressIndicator.tsx            # Progress bar and step counter
├── QuestionContainer.tsx            # Question layout wrapper
├── QuestionTransition.tsx           # Animation wrapper
├── WizardNavigation.tsx             # Next/Back/Skip buttons
│
├── question-parts/                  # Reusable question parts
│   ├── QuestionHeader.tsx           # Title and description
│   ├── QuestionContent.tsx          # Content area wrapper
│   ├── QuestionFooter.tsx           # Help text and navigation
│   ├── OptionCard.tsx               # Clickable option cards
│   ├── TextInput.tsx                # Styled text input
│   ├── SliderInput.tsx              # Number slider
│   └── ValidationMessage.tsx        # Error/success messages
│
├── questions/                       # Individual question components
│   ├── WizardModeQuestion.tsx       # How to start selection
│   ├── IndustryQuestion.tsx         # Industry selection
│   ├── SubjectQuestion.tsx          # Topic subject input
│   ├── AudienceQuestion.tsx         # Audience selection
│   ├── ContentTypeQuestion.tsx      # Content type selection
│   ├── PlatformQuestion.tsx         # Platform selection (conditional)
│   ├── PurposeQuestion.tsx          # Content purpose
│   ├── ToneQuestion.tsx             # Content tone
│   ├── NumIdeasQuestion.tsx         # Number of ideas slider
│   └── NotesQuestion.tsx            # Additional notes (optional)
│
└── hooks/                          # Custom hooks
    ├── useWizardNavigation.ts      # Navigation logic
    ├── useQuestionValidation.ts    # Validation hooks
    ├── useKeyboardNavigation.ts    # Keyboard shortcuts
    └── useWizardProgress.ts        # Progress calculation
```

---

## Core Components

### 1. WizardProvider
Central state management and context provider.

```typescript
interface WizardProviderProps {
  children: React.ReactNode;
  initialData?: Partial<TopicBuilderFormData>;
  onComplete?: (data: TopicBuilderFormData) => void;
  onCancel?: () => void;
}

interface WizardContextValue {
  // State
  formData: TopicBuilderFormData;
  currentQuestion: number;
  questionHistory: number[];
  isValid: boolean;
  isSubmitting: boolean;
  
  // Actions
  updateFormData: (field: keyof TopicBuilderFormData, value: any) => void;
  goToNextQuestion: () => void;
  goToPreviousQuestion: () => void;
  goToQuestion: (questionIndex: number) => void;
  validateCurrentQuestion: () => boolean;
  resetWizard: () => void;
  
  // Computed
  totalQuestions: number;
  progress: number;
  canGoNext: boolean;
  canGoBack: boolean;
  estimatedTimeRemaining: number;
}
```

### 2. TopicBuilderWizard
Main container component that orchestrates the entire wizard flow.

```typescript
interface TopicBuilderWizardProps {
  initialData?: Partial<TopicBuilderFormData>;
  onComplete: (data: TopicBuilderFormData) => Promise<void>;
  onCancel?: () => void;
  className?: string;
}

export const TopicBuilderWizard: React.FC<TopicBuilderWizardProps> = ({
  initialData,
  onComplete,
  onCancel,
  className
}) => {
  return (
    <WizardProvider initialData={initialData} onComplete={onComplete} onCancel={onCancel}>
      <div className={cn("wizard-container", className)}>
        <ProgressIndicator />
        <QuestionContainer />
        <WizardNavigation />
      </div>
    </WizardProvider>
  );
};
```

### 3. QuestionContainer
Handles the current question display and transitions.

```typescript
interface QuestionContainerProps {
  className?: string;
}

export const QuestionContainer: React.FC<QuestionContainerProps> = ({ className }) => {
  const { currentQuestion, formData } = useWizardContext();
  const CurrentQuestionComponent = getQuestionComponent(currentQuestion, formData);
  
  return (
    <div className={cn("question-container", className)}>
      <QuestionTransition>
        <CurrentQuestionComponent />
      </QuestionTransition>
    </div>
  );
};
```

### 4. ProgressIndicator
Shows progress bar and step information.

```typescript
interface ProgressIndicatorProps {
  showTimeEstimate?: boolean;
  showStepCounter?: boolean;
  className?: string;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  showTimeEstimate = true,
  showStepCounter = true,
  className
}) => {
  const { progress, currentQuestion, totalQuestions, estimatedTimeRemaining } = useWizardContext();
  
  return (
    <div className={cn("progress-indicator", className)}>
      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="progress-info">
        {showStepCounter && (
          <span className="step-counter">
            Question {currentQuestion + 1} of {totalQuestions}
          </span>
        )}
        {showTimeEstimate && (
          <span className="time-estimate">
            About {Math.ceil(estimatedTimeRemaining / 60)} min remaining
          </span>
        )}
      </div>
    </div>
  );
};
```

---

## Question Components

### Base Question Interface
All question components implement this interface:

```typescript
interface BaseQuestionProps {
  onNext?: () => void;
  onBack?: () => void;
  onSkip?: () => void;
  autoAdvance?: boolean;
  className?: string;
}

interface QuestionConfig {
  id: string;
  type: QuestionType;
  title: string;
  description?: string;
  required: boolean;
  conditional?: (data: TopicBuilderFormData) => boolean;
  validation?: (value: any, data: TopicBuilderFormData) => ValidationResult;
  autoAdvance?: boolean;
  helpText?: string;
}

type QuestionType = 
  | 'single-select'
  | 'multi-select'
  | 'text-input'
  | 'slider'
  | 'conditional';
```

### Question Component Example

```typescript
// questions/IndustryQuestion.tsx
interface IndustryQuestionProps extends BaseQuestionProps {}

export const IndustryQuestion: React.FC<IndustryQuestionProps> = ({
  onNext,
  autoAdvance = true,
  className
}) => {
  const { formData, updateFormData } = useWizardContext();
  const { validateField } = useQuestionValidation();
  
  const handleSelect = (industry: Industry) => {
    updateFormData('industry', industry);
    
    if (autoAdvance && validateField('industry')) {
      setTimeout(onNext, 500); // Delay for visual feedback
    }
  };
  
  return (
    <div className={cn("question-layout", className)}>
      <QuestionHeader
        title="What industry are you creating content for?"
        description="This helps us understand your domain and suggest relevant topics"
      />
      
      <QuestionContent>
        <div className="options-grid">
          {INDUSTRY_OPTIONS.map((option) => (
            <OptionCard
              key={option.value}
              selected={formData.industry === option.value}
              onClick={() => handleSelect(option.value)}
              icon={option.icon}
              label={option.label}
              description={option.description}
            />
          ))}
        </div>
      </QuestionContent>
      
      <QuestionFooter
        helpText="Don't see your industry? Select 'Other' and specify it in the next step"
      />
    </div>
  );
};
```

### Question Registration System

```typescript
// questions/index.ts
interface QuestionDefinition {
  component: React.ComponentType<BaseQuestionProps>;
  config: QuestionConfig;
}

export const QUESTION_DEFINITIONS: Record<string, QuestionDefinition> = {
  wizardMode: {
    component: WizardModeQuestion,
    config: {
      id: 'wizardMode',
      type: 'single-select',
      title: 'How would you like to start?',
      required: true,
      autoAdvance: true
    }
  },
  industry: {
    component: IndustryQuestion,
    config: {
      id: 'industry',
      type: 'single-select',
      title: 'What industry are you creating content for?',
      required: true,
      autoAdvance: true
    }
  },
  subject: {
    component: SubjectQuestion,
    config: {
      id: 'subject',
      type: 'text-input',
      title: 'Tell us about your topic',
      required: true,
      conditional: (data) => data.wizardMode === 'subject-first',
      autoAdvance: false
    }
  },
  // ... other questions
};

export const getQuestionSequence = (formData: TopicBuilderFormData): string[] => {
  return Object.keys(QUESTION_DEFINITIONS).filter(questionId => {
    const config = QUESTION_DEFINITIONS[questionId].config;
    return !config.conditional || config.conditional(formData);
  });
};
```

---

## State Management

### Wizard State Structure

```typescript
interface WizardState {
  // Form data
  formData: TopicBuilderFormData;
  
  // Navigation state
  currentQuestion: number;
  questionHistory: number[];
  questionSequence: string[];
  
  // Validation state
  fieldErrors: Record<string, string>;
  touchedFields: Set<string>;
  isValid: boolean;
  
  // UI state
  isSubmitting: boolean;
  isTransitioning: boolean;
  direction: 'forward' | 'backward';
  
  // Configuration
  autoAdvance: boolean;
  skipOptional: boolean;
}
```

### State Actions

```typescript
type WizardAction = 
  | { type: 'UPDATE_FORM_DATA'; field: keyof TopicBuilderFormData; value: any }
  | { type: 'GO_TO_NEXT_QUESTION' }
  | { type: 'GO_TO_PREVIOUS_QUESTION' }
  | { type: 'GO_TO_QUESTION'; index: number }
  | { type: 'SET_FIELD_ERROR'; field: string; error: string }
  | { type: 'CLEAR_FIELD_ERROR'; field: string }
  | { type: 'SET_SUBMITTING'; isSubmitting: boolean }
  | { type: 'SET_TRANSITIONING'; isTransitioning: boolean }
  | { type: 'RESET_WIZARD' };

const wizardReducer = (state: WizardState, action: WizardAction): WizardState => {
  switch (action.type) {
    case 'UPDATE_FORM_DATA':
      return {
        ...state,
        formData: { ...state.formData, [action.field]: action.value },
        touchedFields: new Set([...state.touchedFields, action.field])
      };
    
    case 'GO_TO_NEXT_QUESTION':
      return {
        ...state,
        currentQuestion: Math.min(state.currentQuestion + 1, state.questionSequence.length - 1),
        questionHistory: [...state.questionHistory, state.currentQuestion],
        direction: 'forward'
      };
    
    // ... other cases
    
    default:
      return state;
  }
};
```

---

## Data Flow

### 1. Initialization Flow
```
TopicBuilderWizard -> WizardProvider -> Initialize State -> Load First Question
```

### 2. Navigation Flow
```
User Input -> Update Form Data -> Validate -> Update UI State -> 
Transition Animation -> Load Next Question -> Update Progress
```

### 3. Validation Flow
```
Field Change -> Real-time Validation -> Update Error State -> 
Visual Feedback -> Enable/Disable Navigation
```

### 4. Completion Flow
```
Final Question -> Validate All Data -> Show Loading -> Call onComplete -> 
Handle Response -> Show Success/Error
```

---

## Props Interfaces

### Common Props Patterns

```typescript
// Base component props
interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

// Interactive component props
interface InteractiveProps extends BaseComponentProps {
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
}

// Form field props
interface FormFieldProps extends BaseComponentProps {
  name: string;
  value?: any;
  onChange: (value: any) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

// Option selection props
interface OptionProps extends InteractiveProps {
  selected?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  description?: string;
  value: any;
}
```

### Specific Component Props

```typescript
// OptionCard.tsx
interface OptionCardProps extends OptionProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'compact' | 'detailed';
  showSelection?: boolean;
  animateOnSelect?: boolean;
}

// TextInput.tsx
interface TextInputProps extends FormFieldProps {
  type?: 'text' | 'textarea';
  placeholder?: string;
  maxLength?: number;
  rows?: number;
  autoFocus?: boolean;
  onEnterKey?: () => void;
}

// SliderInput.tsx
interface SliderInputProps extends FormFieldProps {
  min: number;
  max: number;
  step?: number;
  showValue?: boolean;
  formatValue?: (value: number) => string;
  marks?: { value: number; label: string }[];
}
```

---

## Animation Integration

### Framer Motion Integration

```typescript
// QuestionTransition.tsx
interface QuestionTransitionProps {
  children: React.ReactNode;
  direction: 'forward' | 'backward';
}

const questionVariants = {
  enter: (direction: 'forward' | 'backward') => ({
    x: direction === 'forward' ? 300 : -300,
    opacity: 0
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1
  },
  exit: (direction: 'forward' | 'backward') => ({
    zIndex: 0,
    x: direction === 'forward' ? -300 : 300,
    opacity: 0
  })
};

export const QuestionTransition: React.FC<QuestionTransitionProps> = ({ 
  children, 
  direction 
}) => {
  return (
    <AnimatePresence mode="wait" custom={direction}>
      <motion.div
        key={currentQuestionId}
        custom={direction}
        variants={questionVariants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{
          x: { type: "spring", stiffness: 300, damping: 30 },
          opacity: { duration: 0.2 }
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};
```

### Animation Hooks

```typescript
// hooks/useQuestionAnimations.ts
export const useQuestionAnimations = () => {
  const [isAnimating, setIsAnimating] = useState(false);
  
  const startTransition = useCallback(() => {
    setIsAnimating(true);
  }, []);
  
  const endTransition = useCallback(() => {
    setIsAnimating(false);
  }, []);
  
  const celebrateSelection = useCallback((element?: HTMLElement) => {
    // Canvas confetti animation
    if (element) {
      const rect = element.getBoundingClientRect();
      confetti({
        particleCount: 10,
        spread: 30,
        origin: {
          x: (rect.left + rect.width / 2) / window.innerWidth,
          y: (rect.top + rect.height / 2) / window.innerHeight
        }
      });
    }
  }, []);
  
  return {
    isAnimating,
    startTransition,
    endTransition,
    celebrateSelection
  };
};
```

---

## Accessibility Patterns

### ARIA Implementation

```typescript
// Accessible Question Component
export const AccessibleQuestion: React.FC<QuestionProps> = ({
  title,
  description,
  required,
  error,
  children
}) => {
  const questionId = useId();
  const descriptionId = useId();
  const errorId = useId();
  
  return (
    <section 
      role="group"
      aria-labelledby={questionId}
      aria-describedby={`${descriptionId} ${error ? errorId : ''}`}
      aria-required={required}
      aria-invalid={!!error}
    >
      <h2 id={questionId} className="question-title">
        {title}
        {required && <span aria-label="required"> *</span>}
      </h2>
      
      {description && (
        <p id={descriptionId} className="question-description">
          {description}
        </p>
      )}
      
      {children}
      
      {error && (
        <div 
          id={errorId}
          role="alert"
          aria-live="polite"
          className="error-message"
        >
          {error}
        </div>
      )}
    </section>
  );
};
```

### Keyboard Navigation

```typescript
// hooks/useKeyboardNavigation.ts
export const useKeyboardNavigation = () => {
  const { goToNextQuestion, goToPreviousQuestion, canGoNext, canGoBack } = useWizardContext();
  
  useHotkeys('enter', () => {
    if (canGoNext) goToNextQuestion();
  }, { enableOnFormTags: true });
  
  useHotkeys('escape', () => {
    if (canGoBack) goToPreviousQuestion();
  });
  
  useHotkeys('1,2,3,4,5,6,7,8,9', (event, handler) => {
    const optionIndex = parseInt(handler.key) - 1;
    // Handle quick selection
  });
};
```

---

## Testing Strategy

### Component Testing Approach

```typescript
// __tests__/components/questions/IndustryQuestion.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { IndustryQuestion } from '../IndustryQuestion';
import { WizardProvider } from '../WizardProvider';

const renderWithProvider = (props = {}) => {
  return render(
    <WizardProvider>
      <IndustryQuestion {...props} />
    </WizardProvider>
  );
};

describe('IndustryQuestion', () => {
  it('renders question title and options', () => {
    renderWithProvider();
    
    expect(screen.getByRole('heading')).toHaveTextContent(
      'What industry are you creating content for?'
    );
    expect(screen.getAllByRole('button')).toHaveLength(
      INDUSTRY_OPTIONS.length
    );
  });
  
  it('handles selection and auto-advance', async () => {
    const onNext = jest.fn();
    renderWithProvider({ onNext, autoAdvance: true });
    
    const technologyOption = screen.getByRole('button', { name: /technology/i });
    fireEvent.click(technologyOption);
    
    expect(technologyOption).toHaveAttribute('aria-selected', 'true');
    
    // Wait for auto-advance delay
    await waitFor(() => {
      expect(onNext).toHaveBeenCalled();
    }, { timeout: 1000 });
  });
  
  it('supports keyboard navigation', () => {
    renderWithProvider();
    
    const firstOption = screen.getAllByRole('button')[0];
    firstOption.focus();
    
    fireEvent.keyDown(firstOption, { key: 'ArrowDown' });
    
    const secondOption = screen.getAllByRole('button')[1];
    expect(secondOption).toHaveFocus();
  });
});
```

### Integration Testing

```typescript
// __tests__/integration/wizard-flow.test.tsx
describe('Wizard Flow Integration', () => {
  it('completes full wizard flow', async () => {
    const onComplete = jest.fn();
    render(<TopicBuilderWizard onComplete={onComplete} />);
    
    // Step through each question
    // 1. Select wizard mode
    fireEvent.click(screen.getByRole('button', { name: /industry-first/i }));
    
    // 2. Select industry
    fireEvent.click(screen.getByRole('button', { name: /technology/i }));
    
    // 3. Select audience
    fireEvent.click(screen.getByRole('button', { name: /developers/i }));
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    
    // ... continue through all steps
    
    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          wizardMode: 'industry-first',
          industry: 'technology',
          audience: ['developers']
        })
      );
    });
  });
});
```

### Accessibility Testing

```typescript
// __tests__/accessibility/wizard-a11y.test.tsx
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('Wizard Accessibility', () => {
  it('has no accessibility violations', async () => {
    const { container } = render(
      <TopicBuilderWizard onComplete={jest.fn()} />
    );
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
  
  it('manages focus correctly during navigation', () => {
    render(<TopicBuilderWizard onComplete={jest.fn()} />);
    
    // Test focus management between questions
    const firstQuestion = screen.getByRole('group');
    expect(firstQuestion).toHaveFocus();
    
    // Navigate to next question
    fireEvent.click(screen.getByRole('button', { name: /technology/i }));
    
    // Verify focus moved to next question
    waitFor(() => {
      const nextQuestion = screen.getByRole('group');
      expect(nextQuestion).toHaveFocus();
    });
  });
});
```

---

## Performance Considerations

### Lazy Loading Strategy

```typescript
// Lazy load question components
const QUESTION_COMPONENTS = {
  wizardMode: lazy(() => import('./questions/WizardModeQuestion')),
  industry: lazy(() => import('./questions/IndustryQuestion')),
  subject: lazy(() => import('./questions/SubjectQuestion')),
  // ... other components
};

// Preload next question
const useQuestionPreloading = () => {
  const { currentQuestion, questionSequence } = useWizardContext();
  
  useEffect(() => {
    const nextQuestionId = questionSequence[currentQuestion + 1];
    if (nextQuestionId && QUESTION_COMPONENTS[nextQuestionId]) {
      // Preload next component
      QUESTION_COMPONENTS[nextQuestionId]();
    }
  }, [currentQuestion, questionSequence]);
};
```

### Memory Management

```typescript
// Clean up animations and listeners
export const useCleanupEffects = () => {
  useEffect(() => {
    return () => {
      // Clean up any running animations
      // Remove event listeners
      // Cancel pending requests
    };
  }, []);
};
```

---

This component architecture provides a solid foundation for implementing the TypeForm-like experience while maintaining code quality, accessibility, and performance standards.