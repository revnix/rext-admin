# TypeForm-like UX Specifications

## Table of Contents
1. [Overview](#overview)
2. [Core Flow Changes](#core-flow-changes)
3. [Visual Design Requirements](#visual-design-requirements)
4. [Interaction Patterns](#interaction-patterns)
5. [Conversational Language Guidelines](#conversational-language-guidelines)
6. [Question Flow Specifications](#question-flow-specifications)
7. [Accessibility Requirements](#accessibility-requirements)
8. [Animation and Micro-interactions](#animation-and-micro-interactions)
9. [Progress Indication System](#progress-indication-system)
10. [Keyboard Navigation](#keyboard-navigation)
11. [Mobile Experience](#mobile-experience)
12. [Performance Considerations](#performance-considerations)

---

## Overview

Transform the current multi-field wizard into a TypeForm-inspired single-question-per-screen experience that reduces cognitive load, increases engagement, and improves completion rates.

### Current State
- Multi-step wizard with sidebar navigation
- Multiple form fields per step
- Traditional form UI patterns
- Desktop-first design

### Target State
- Single question per screen
- Conversational, engaging experience
- Smooth animations and transitions
- Mobile-first responsive design
- Keyboard-driven navigation

---

## Core Flow Changes

### Single-Question-Per-Screen Approach

**Current**: 6 steps with multiple fields per step
**New**: 10+ individual questions in sequence

#### Question Sequence
Updated for industry-first approach to improve user experience:

1. **Industry Selection** - "What industry are you in?" (provides context for all subsequent questions)
2. **Wizard Mode Selection** - "How would you like to approach topic generation for [Industry]?"
3. **Subject Input** (conditional) - "What specific topic in [Industry] do you want content for?"
4. **Industry Other** (conditional) - "Please specify your industry" 
5. **Audience Selection** - "Who is your target audience in [Industry]?"
6. **Content Goals** - "What do you want to achieve?"
7. **Review & Generate** - Final step with topic count selection
8. **Content Purpose** - "What's the goal of your content?"
9. **Content Tone** - "What tone should your content have?"
10. **Number of Topics** - "How many topics would you like?"
11. **Additional Notes** (optional) - "Any other requirements or preferences?"

### Navigation Flow
- **Forward**: Enter key, click Next button, or automatic progression after selection
- **Backward**: Escape key, Backspace, or click Back button
- **Skip**: Allow skipping optional questions
- **Review**: Final confirmation screen before generation

---

## Visual Design Requirements

### Layout Structure

#### Question Container
```
┌─────────────────────────────────────────────┐
│ [Progress Bar]                       3 of 7 │
├─────────────────────────────────────────────┤
│                                             │
│           [Large Question Title]            │
│                                             │
│           [Optional Subtitle]               │
│                                             │
│                                             │
│        [Option Cards / Input Field]         │
│                                             │
│                                             │
│                                             │
│   [Back Button]           [Next Button]     │
│                                             │
└─────────────────────────────────────────────┘
```

#### Typography Hierarchy
- **Question Title**: `text-3xl md:text-4xl font-bold` (32-40px)
- **Question Subtitle**: `text-lg text-muted-foreground` (18px)
- **Option Labels**: `text-base font-medium` (16px)
- **Helper Text**: `text-sm text-muted-foreground` (14px)

#### Color Palette
- **Primary**: Current brand colors from CSS variables
- **Success**: `green-500` for positive feedback
- **Neutral**: `gray-50` to `gray-900` for backgrounds and text
- **Accent**: `blue-500` or `purple-500` for selections and highlights
- **Warning**: `amber-500` for validation messages

#### Spacing and Layout
- **Minimum padding**: 24px between all elements
- **Question title margin-bottom**: 16px
- **Option card gap**: 12px
- **Container max-width**: 640px (centered)
- **Container padding**: 24px on mobile, 48px on desktop

### Option Card Design

#### Visual Specifications
```css
/* Default State */
border-radius: 12px;
padding: 16px 20px;
border: 2px solid gray-200;
background: white;
box-shadow: 0 1px 3px rgba(0,0,0,0.1);
transition: all 200ms ease;

/* Hover State */
transform: scale(1.02);
box-shadow: 0 4px 12px rgba(0,0,0,0.15);
border-color: gray-300;

/* Selected State */
border-color: blue-500;
background: blue-50;
box-shadow: 0 0 0 3px rgba(59,130,246,0.1);

/* Focus State (Accessibility) */
outline: 2px solid blue-500;
outline-offset: 2px;
```

#### Card Content Structure
- **Icon** (left): 24x24px Lucide icon
- **Label** (center): Primary text, font-medium
- **Description** (below): Secondary text, optional
- **Selection Indicator** (right): Checkmark or radio button

---

## Interaction Patterns

### Micro-animations

#### Question Transitions
- **Entry**: Slide in from right with fade
- **Exit**: Slide out to left with fade
- **Duration**: 300ms with ease-in-out easing
- **Stagger**: 100ms delay for multiple elements

```css
/* Framer Motion Variants */
const questionVariants = {
  enter: { x: 300, opacity: 0 },
  center: { x: 0, opacity: 1 },
  exit: { x: -300, opacity: 0 }
};

const transition = {
  type: "tween",
  ease: "easeInOut",
  duration: 0.3
};
```

#### Option Selection
- **Selection**: Scale 1.02 with 200ms duration
- **Deselection**: Scale back to 1.0 with 150ms duration
- **Multi-select**: Staggered animations when multiple options change

#### Button States
- **Hover**: Slight scale increase (1.05) with color transition
- **Press**: Scale decrease (0.98) with 100ms duration
- **Disabled**: Reduced opacity (0.6) with no hover effects

### Loading States
- **Question loading**: Skeleton placeholder with pulse animation
- **Option loading**: Shimmer effect on cards
- **Navigation loading**: Spinner on Next button

---

## Conversational Language Guidelines

### Tone and Voice
- **Friendly and approachable**: Use "you" and "your" throughout
- **Clear and concise**: Avoid jargon and complex terminology
- **Encouraging**: Provide positive reinforcement
- **Helpful**: Offer context and guidance when needed

### Question Formulation Examples

#### Before vs After
| Current | TypeForm-Style |
|---------|----------------|
| "Select industry" | "What industry are you creating content for?" |
| "Target audience" | "Who's your audience?" |
| "Content type" | "What type of content are you creating?" |
| "Enter subject" | "Tell us about your topic" |
| "Select purpose" | "What's the goal of your content?" |
| "Choose tone" | "What tone should your content have?" |

#### Helper Text Examples
- "Don't worry, you can change this later"
- "This helps us personalize your topic suggestions"
- "Pick as many as you'd like"
- "Almost there! Just a few more questions"

### Micro-copy for Interactions
- **Selection feedback**: "Great choice!", "Perfect!", "Nice pick!"
- **Progress encouragement**: "You're doing great!", "Almost there!", "Just a few more!"
- **Error messages**: "Oops, please select an option", "This field needs your input"
- **Success messages**: "All set! Let's generate your topics", "Awesome! Here we go!"

---

## Question Flow Specifications

### Question Types and Components

#### 1. Single Select (Radio)
- **Use for**: Wizard mode, industry, content type
- **Component**: Large clickable cards in grid layout
- **Auto-advance**: Yes, after 500ms delay
- **Visual**: Radio button indicator on card

#### 2. Multi-Select (Checkbox)
- **Use for**: Audience, purpose, tone
- **Component**: Large clickable cards with checkboxes
- **Auto-advance**: No, requires Next button
- **Minimum selections**: 1 (with validation)
- **Maximum selections**: No limit (but recommend 3-5)

#### 3. Text Input
- **Use for**: Subject, industry_other, notes
- **Component**: Large, prominent input field
- **Auto-advance**: No, requires Next button
- **Validation**: Real-time with helpful messages
- **Placeholder**: Conversational and helpful

#### 4. Slider Input
- **Use for**: Number of topics
- **Component**: Large slider with live value display
- **Auto-advance**: No, requires Next button
- **Range**: 1-20 with step of 1
- **Default**: 5

#### 5. Conditional Questions
- **Industry Other**: Show when "Other" selected in industry
- **Platform**: Show when "Social Media" selected in content type
- **Subject**: Show only in "subject-first" wizard mode

### Validation Patterns

#### Real-time Validation
- **On focus out**: Check field validity
- **On input**: Clear previous errors
- **Visual feedback**: Red border and error message below field
- **Error recovery**: Green checkmark when fixed

#### Error Messages
- **Required fields**: "We need this information to continue"
- **Invalid input**: "Please check your input and try again"
- **Minimum selections**: "Please select at least one option"

---

## Accessibility Requirements

### WCAG 2.1 AA Compliance

#### Keyboard Navigation
- **Tab order**: Logical flow through interactive elements
- **Focus indicators**: Clear 2px outline on all focusable elements
- **Skip links**: "Skip to main content" for screen readers
- **Trap focus**: Keep focus within modal/dialog contexts

#### Screen Reader Support
- **ARIA labels**: Descriptive labels for all interactive elements
- **ARIA live regions**: Announce progress and status changes
- **ARIA describedby**: Associate help text with form fields
- **Role attributes**: Proper roles for custom components

#### Visual Accessibility
- **Color contrast**: Minimum 4.5:1 ratio for normal text
- **Focus visibility**: High contrast focus indicators
- **Text scaling**: Support up to 200% zoom
- **Motion preferences**: Respect `prefers-reduced-motion`

### Implementation Checklist
- [ ] All interactive elements are keyboard accessible
- [ ] Focus management between questions works correctly
- [ ] Screen readers announce progress and question changes
- [ ] Color is not the only way to convey information
- [ ] Form validation errors are announced
- [ ] Loading states are accessible

---

## Animation and Micro-interactions

### Animation Library: Framer Motion

#### Core Animation Principles
1. **Purposeful**: Every animation serves a functional purpose
2. **Subtle**: Gentle movements that don't distract
3. **Fast**: Quick transitions to maintain flow
4. **Consistent**: Same timing and easing throughout

#### Question Transition System

```typescript
// Page-level transitions
const pageVariants = {
  initial: { opacity: 0, x: 300 },
  in: { opacity: 1, x: 0 },
  out: { opacity: 0, x: -300 }
};

const pageTransition = {
  type: "tween",
  ease: "anticipate",
  duration: 0.4
};

// Staggered content animations
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 }
};
```

#### Celebration Animations

##### Progress Milestones
- **25% complete**: Subtle pulse on progress bar
- **50% complete**: Brief confetti burst (5-10 particles)
- **75% complete**: Progress bar glow effect
- **100% complete**: Full confetti celebration

##### Success Feedback
```javascript
import confetti from 'canvas-confetti';

// Completion celebration
const celebrate = () => {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 }
  });
};

// Subtle selection feedback
const selectionFeedback = () => {
  confetti({
    particleCount: 3,
    spread: 30,
    scalar: 0.8,
    origin: { x: 0.5, y: 0.5 }
  });
};
```

#### Performance Considerations
- **Use transform properties**: Avoid animating layout properties
- **will-change**: Apply to animating elements
- **Reduced motion**: Respect user preferences
- **Cleanup**: Properly dispose of animation instances

---

## Progress Indication System

### Progress Bar Design

#### Visual Specifications
- **Position**: Top of screen, full width
- **Height**: 4px on mobile, 6px on desktop
- **Background**: `gray-200`
- **Fill**: `blue-500` with gradient
- **Animation**: Smooth width transitions (400ms ease-out)

#### Progress Calculation
```typescript
const calculateProgress = (currentStep: number, totalSteps: number) => {
  return (currentStep / totalSteps) * 100;
};

// Account for conditional questions
const getAdjustedProgress = (formData: FormData, currentStep: number) => {
  const totalQuestions = calculateTotalQuestions(formData);
  return (currentStep / totalQuestions) * 100;
};
```

### Step Indicators

#### Numeric Display
- **Format**: "3 of 7 questions" or "Question 3 of 7"
- **Position**: Top right of container
- **Style**: `text-sm text-muted-foreground`

#### Time Estimation
- **Display**: "About 2 minutes remaining"
- **Calculation**: Based on average time per question type
- **Update**: Recalculate after each step

```typescript
const estimateTimeRemaining = (remainingQuestions: Question[]) => {
  const timePerQuestion = {
    'single-select': 10, // seconds
    'multi-select': 20,
    'text-input': 30,
    'slider': 15
  };
  
  return remainingQuestions.reduce((total, question) => {
    return total + timePerQuestion[question.type];
  }, 0);
};
```

---

## Keyboard Navigation

### Navigation Shortcuts

#### Primary Navigation
- **Enter**: Advance to next question (if valid)
- **Escape**: Go back to previous question
- **Tab**: Navigate between interactive elements
- **Shift + Tab**: Navigate backwards
- **Space**: Select/deselect options

#### Question-Specific Shortcuts
- **Arrow Keys**: Navigate between options (radio/checkbox groups)
- **1-9**: Quick select for numbered options (max 9)
- **Ctrl/Cmd + Enter**: Skip optional questions

#### Implementation with react-hotkeys-hook
```typescript
import { useHotkeys } from 'react-hotkeys-hook';

const useQuestionNavigation = () => {
  useHotkeys('enter', () => handleNext(), { enableOnFormTags: ['input', 'textarea'] });
  useHotkeys('escape', () => handleBack());
  useHotkeys('1,2,3,4,5,6,7,8,9', (event, handler) => {
    const index = parseInt(handler.key) - 1;
    selectOption(index);
  });
};
```

### Focus Management

#### Focus Flow
1. **Question entry**: Focus on first interactive element
2. **Option selection**: Focus on selected option
3. **Validation error**: Focus on error message
4. **Navigation**: Focus on Next/Back buttons

#### Focus Trap
- **Within question**: Keep focus within current question
- **Modal behavior**: Treat each question as a modal-like experience
- **Skip links**: Provide way to skip to main content

---

## Mobile Experience

### Responsive Breakpoints
- **Mobile**: < 768px (sm)
- **Tablet**: 768px - 1023px (md)
- **Desktop**: ≥ 1024px (lg)

### Mobile-Specific Optimizations

#### Layout Adjustments
- **Single column**: All options stack vertically
- **Larger touch targets**: Minimum 44px height
- **Reduced padding**: 16px instead of 24px
- **Bottom navigation**: Next/Back buttons at bottom

#### Touch Interactions
- **Tap feedback**: Brief scale animation on touch
- **Swipe navigation**: Left/right swipes for back/next
- **Pull to refresh**: Not applicable for this flow
- **Long press**: Show option descriptions

#### Virtual Keyboard Handling
- **Input focus**: Scroll question into view
- **Keyboard overlay**: Adjust viewport height
- **Done button**: Custom "Next" button on keyboard

### Progressive Enhancement
```typescript
const useDeviceType = () => {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
    };
    
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);
  
  return { isMobile };
};
```

---

## Performance Considerations

### Optimization Strategies

#### Code Splitting
- **Dynamic imports**: Load question components lazily
- **Route-based splitting**: Split by question flow
- **Component splitting**: Separate heavy components

```typescript
// Lazy load question components
const QuestionComponent = lazy(() => 
  import('./questions/QuestionComponent')
);

// Preload next question
const preloadNext = (nextQuestionType: string) => {
  import(`./questions/${nextQuestionType}Component`);
};
```

#### Animation Performance
- **Use CSS transforms**: Avoid layout thrashing
- **GPU acceleration**: Force composite layers
- **Reduce complexity**: Limit concurrent animations

```css
/* Optimize for animations */
.question-container {
  transform: translateZ(0); /* Force GPU layer */
  will-change: transform, opacity;
}

/* Clean up after animations */
.animation-complete {
  will-change: auto;
}
```

#### Memory Management
- **Clean up animations**: Remove motion listeners
- **Debounce inputs**: Limit validation frequency
- **Lazy loading**: Load content as needed

### Bundle Size Optimization
- **Tree shaking**: Import only needed components
- **Dynamic imports**: Split non-critical code
- **Icon optimization**: Use icon subsets

### Performance Monitoring
```typescript
// Track question completion times
const trackQuestionTime = (questionId: string, startTime: number) => {
  const completionTime = Date.now() - startTime;
  analytics.track('question_completed', {
    question_id: questionId,
    completion_time_ms: completionTime
  });
};

// Monitor animation performance
const monitorFPS = () => {
  // Implementation for FPS monitoring
  // Could use performance.mark() and performance.measure()
};
```

---

## Implementation Priority

### Phase 1: Core Structure (Week 1)
1. Question flow architecture
2. Basic navigation system
3. Progress indication
4. Essential animations

### Phase 2: Interactions (Week 2)
1. Keyboard navigation
2. Focus management
3. Validation system
4. Micro-animations

### Phase 3: Polish (Week 3)
1. Celebration animations
2. Performance optimization
3. Accessibility audit
4. Mobile refinements

---

## Success Metrics

### User Experience Metrics
- **Completion rate**: Target 85%+ (vs current baseline)
- **Time to complete**: Target <3 minutes average
- **Abandonment rate**: Target <15% (measure drop-off points)
- **User satisfaction**: Target 4.5/5 stars

### Technical Metrics
- **Page load time**: <2 seconds
- **Animation frame rate**: 60 FPS maintained
- **Accessibility score**: 100% WCAG 2.1 AA compliance
- **Mobile usability**: 95%+ Google Mobile-Friendly score

### A/B Testing Plan
- **Control group**: Current multi-step wizard (20%)
- **Test group**: New TypeForm experience (80%)
- **Duration**: 2-3 weeks
- **Key metrics**: Completion rate, user satisfaction, topic generation quality

---

This specification document provides the complete foundation for implementing the TypeForm-like experience in the Topic Builder. All subsequent implementation tasks should reference and adhere to these specifications to ensure consistency and quality.