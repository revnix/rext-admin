# Feature Requirements Plan - WREXT Admin

## Project Overview

WREXT Admin is a Next.js web application that allows users to generate AI-powered content topics through a wizard-style interface and manage them through a results interface. The application currently features a Topic Builder with TypeForm-style single-question-per-screen flow and a comprehensive results management system.

### Technology Stack
- **Framework**: Next.js 15.5.0 with React 19.1.1
- **Styling**: Tailwind CSS with custom components
- **UI Components**: Radix UI primitives, Lucide React icons
- **State Management**: Zustand for global state, React Hook Form for forms
- **Data Fetching**: TanStack Query (React Query)
- **Validation**: Zod schemas
- **Animations**: Framer Motion
- **Testing**: Jest with Testing Library
- **Code Quality**: Biome for linting and formatting

## Phase 1: Topic Builder UX/UI Improvements

### 1.1 Question Layout & Spacing (Priority: High)

**Current Issues:**
- Excessive vertical spacing between steps and questions
- Questions vertically aligned causing UI density issues
- Inconsistent option sizing and layout

**Requirements:**
- Reduce vertical spacing between wizard steps and question content
- Move "Question x of y" indicator to the top of each question
- Implement responsive spacing that adapts to content length
- Ensure consistent visual hierarchy across all question types

**Acceptance Criteria:**
- [ ] Vertical spacing reduced by 40-60% while maintaining readability
- [ ] Question counter positioned above question title
- [ ] Consistent spacing measurements across all breakpoints
- [ ] Visual regression tests pass for all question types

### 1.2 Option Selection Interface (Priority: High)

**Current Issues:**
- Options text size too small
- Icon sizes inconsistent
- No maximum limit on options per row
- Text overflow issues with long descriptions
- Double border on selected checkboxes

**Requirements:**
- Increase option text size for better readability
- Standardize icon sizes across all option types
- Implement 3-column grid layout for radio/checkbox options
- Add text wrapping for option titles and descriptions
- Fix checkbox styling to show single rounded border
- Add consistent sizing for all option elements

**Acceptance Criteria:**
- [ ] Option text increased to minimum 16px font size
- [ ] All icons standardized to 20px size
- [ ] Maximum 3 options per row on desktop, 1-2 on mobile
- [ ] Text wrapping prevents overflow on all screen sizes
- [ ] Checkbox styling shows single rounded border when selected
- [ ] All option elements have consistent dimensions

### 1.3 Interactive Elements (Priority: Medium)

**Current Issues:**
- Missing cursor pointer on interactive elements
- Inconsistent hover states
- No visual feedback on clickable areas

**Requirements:**
- Add cursor pointer to all interactive elements (buttons, options, suggestions)
- Implement consistent hover states across all clickable elements
- Add subtle visual feedback for better user experience

**Acceptance Criteria:**
- [ ] All interactive elements show pointer cursor on hover
- [ ] Consistent hover animations with 150ms transition
- [ ] Visual feedback maintains accessibility contrast standards

### 1.4 Multi-Select Input Enhancement (Priority: High)

**Current Issues:**
- Enter key moves to next question even when typing in input
- No visual indication of chip input functionality
- Inconsistent behavior between different input types

**Requirements:**
- Modify enter key behavior: first press adds typed text as chip, second press advances
- Add visual cues for chip input functionality
- Maintain consistency with single-select inputs
- Add keyboard navigation support for chip management

**Acceptance Criteria:**
- [ ] Enter key adds text as chip when input has content
- [ ] Second enter press (or enter on empty input) advances to next step
- [ ] Backspace removes last chip when input is empty
- [ ] Visual placeholder text indicates chip functionality
- [ ] Keyboard navigation allows chip selection and deletion

### 1.5 Review Step Consistency (Priority: Medium)

**Current Issues:**
- Inconsistent value display (some as chips, some as text)
- Radio/checkbox selections not formatted consistently
- Poor visual hierarchy in review section

**Requirements:**
- Standardize all values to show as comma-separated text (no chips in review)
- Implement consistent formatting for all input types
- Improve visual hierarchy and readability
- Add clear section dividers

**Acceptance Criteria:**
- [ ] All review values displayed as comma-separated text
- [ ] Consistent typography and spacing across all sections
- [ ] Clear visual separation between different form sections
- [ ] Edit functionality preserves formatting consistency

### 1.6 Edit Navigation Flow (Priority: Medium)

**Current Issues:**
- Users must navigate through all steps after editing
- No quick return to review after making changes
- Poor user experience for minor edits

**Requirements:**
- Add "Save & Return to Review" option when editing
- Implement smart navigation that detects unchanged subsequent steps
- Add breadcrumb navigation for direct step access
- Preserve review state during edit operations

**Acceptance Criteria:**
- [ ] "Save & Return to Review" button available during editing
- [ ] Smart navigation skips unchanged steps when possible
- [ ] Breadcrumb navigation allows direct step access
- [ ] Edit operations don't reset unrelated form data

## Phase 2: Wizard Navigation & Progress Improvements

### 2.1 Step Timeline Redesign (Priority: Medium)

**Current Issues:**
- Step titles too long causing truncation
- Progress bar not integrated with step indicators
- Percentage completion and step numbers unnecessary

**Requirements:**
- Redesign step titles to 1-2 words maximum
- Integrate progress bar behind step circles for timeline effect
- Remove percentage indicators and step numbers
- Maintain clear active/completed state indicators

**Acceptance Criteria:**
- [ ] All step titles are 1-2 words maximum
- [ ] Progress bar visually connects step circles
- [ ] No percentage or step number displays
- [ ] Clear visual distinction between active, completed, and pending steps

### 2.2 Question Defaults & Smart Suggestions (Priority: High)

**Current Issues:**
- No default selections for common choices
- Suggestions not contextually relevant
- Poor user onboarding experience

**Requirements:**
- Set "I want to explore my industry" as default and selected for Question 1
- Set "Who are you creating this for?" as default and selected for Question 2
- Implement contextual suggestions based on previous answers (e.g., target audience based on industry)
- Add smart defaults for common user workflows

**Acceptance Criteria:**
- [ ] Question 1 has "explore industry" pre-selected
- [ ] Question 2 has "who are you creating for" pre-selected
- [ ] Target audience suggestions filtered by selected industry
- [ ] Other contextual suggestions implemented based on user research
- [ ] Default selections improve completion rates

## Phase 3: Results Page Redesign

### 3.1 Topic Card Simplification (Priority: High)

**Current Issues:**
- Too much information displayed by default
- Complex UI with unnecessary features
- Poor visual hierarchy and scanning

**Requirements:**
- Simplify cards to show only: title, circular progress bar, action chips
- Remove default display of: score details, description, keywords, tags
- Implement clean, scannable card design
- Add hover states for better interaction feedback

**Acceptance Criteria:**
- [ ] Cards show only title and overall score as circular progress
- [ ] Action chips clearly visible and accessible
- [ ] Detailed information hidden by default
- [ ] Hover states provide visual feedback
- [ ] Cards maintain consistent sizing and alignment

### 3.2 Action System Redesign (Priority: High)

**Current Issues:**
- Unnecessary action buttons (CMD+C support, bulk export, bulk delete)
- Confusing action hierarchy
- Poor mobile experience

**Requirements:**
- Remove: Edit Settings button, CMD+C support, export functionality, bulk delete
- Remove: Write Content for multiple selection, dropdown actions (Regenerate, Export, Delete)
- Keep only: View Topic, Save Topic, Write Content (individual), Copy Topic
- Implement actions as beautiful chips with icons
- Ensure mobile-responsive design

**Acceptance Criteria:**
- [ ] Only 4 actions available: View, Save, Write, Copy
- [ ] Actions displayed as styled chips with appropriate icons
- [ ] Individual Write Content button on each topic
- [ ] Mobile-optimized action layout
- [ ] Consistent action styling across all topics

### 3.3 Topic Detail Drawer (Priority: High)

**Current Issues:**
- Modal interface not optimal for detailed content
- Limited space for comprehensive topic information
- Poor mobile experience

**Requirements:**
- Convert topic modal to full-height drawer (similar to Upwork job details)
- Implement large width drawer with close button top-right
- Design comprehensive topic detail layout with proper information hierarchy
- Include all topic metadata, scores, and actions in drawer
- Ensure responsive design for mobile devices

**Acceptance Criteria:**
- [ ] Drawer opens from right side with large width (60-70% of screen)
- [ ] Close button positioned in top-right corner
- [ ] All topic details displayed with proper hierarchy
- [ ] Responsive design works on all device sizes
- [ ] Smooth open/close animations

### 3.4 Card Interaction Improvements (Priority: Medium)

**Current Issues:**
- Cards not fully clickable
- No visual indication of clickable areas
- Inconsistent interaction patterns

**Requirements:**
- Make entire topic card clickable to open drawer
- Add hover states with pointer cursor
- Implement subtle hover animations
- Maintain accessibility standards for keyboard navigation

**Acceptance Criteria:**
- [ ] Entire card surface clickable to open topic drawer
- [ ] Pointer cursor on card hover
- [ ] Hover animation enhances user experience
- [ ] Keyboard navigation opens drawer on Enter key
- [ ] Focus states meet accessibility guidelines

### 3.5 Results Management Simplification (Priority: Medium)

**Current Issues:**
- Complex filtering and sorting options
- Too many configuration choices overwhelming users
- Poor default sorting strategy

**Requirements:**
- Remove all filter and sorting controls from UI
- Implement default sorting by overall score (highest first)
- Show score via circular progress bar on each card
- Focus on core functionality: view, save, and generate content

**Acceptance Criteria:**
- [ ] No filter or sort controls visible in UI
- [ ] Topics automatically sorted by overall score (descending)
- [ ] Score visible via circular progress indicator
- [ ] Interface focuses on primary user actions

### 3.6 Generation Controls Update (Priority: Low)

**Current Issues:**
- Confusing "Edit Settings" button text
- Unclear regeneration workflow

**Requirements:**
- Remove "Edit Settings" button entirely
- Update "Regenerate" button text to "Start Over" or "Generate New Topics"
- Ensure clicking regeneration starts completely fresh workflow

**Acceptance Criteria:**
- [ ] "Edit Settings" button removed
- [ ] Clear "Start Over" or similar button for new generation
- [ ] Button click clears all data and returns to wizard beginning
- [ ] User can easily start fresh topic generation process

## Phase 4: Technical Improvements & Performance

### 4.1 Component Architecture Optimization (Priority: Medium)

**Current State:**
- Complex component hierarchy in results page
- Prop drilling in wizard components
- Mixed concerns in some components

**Requirements:**
- Refactor TopicsList component to reduce complexity
- Implement proper separation of concerns
- Optimize prop passing and state management
- Improve component reusability

**Acceptance Criteria:**
- [ ] Component complexity reduced (maximum 200 lines per component)
- [ ] Clear separation between presentation and logic components
- [ ] Reduced prop drilling through better state management
- [ ] Improved component test coverage

### 4.2 State Management Enhancement (Priority: Medium)

**Current State:**
- Zustand store for topic builder
- Local state scattered across components
- Some state management inconsistencies

**Requirements:**
- Consolidate related state management
- Implement proper state persistence strategies
- Add optimistic updates for better UX
- Improve error state handling

**Acceptance Criteria:**
- [ ] Centralized state management for related functionality
- [ ] Proper state persistence for user drafts
- [ ] Optimistic updates for save operations
- [ ] Comprehensive error state handling

### 4.3 Performance Optimization (Priority: Low)

**Current Performance:**
- React Query for data fetching
- Some unnecessary re-renders possible
- Bundle size could be optimized

**Requirements:**
- Implement React.memo for expensive components
- Add proper dependency arrays for hooks
- Optimize bundle splitting for topic builder
- Add performance monitoring

**Acceptance Criteria:**
- [ ] Reduced unnecessary re-renders (measured via React DevTools)
- [ ] Optimized bundle size for topic builder pages
- [ ] Performance metrics tracked and improved
- [ ] Loading states optimized for perceived performance

## Phase 5: Accessibility & Mobile Experience

### 5.1 Accessibility Compliance (Priority: High)

**Current State:**
- Basic accessibility implemented via Radix UI
- Some custom components may lack proper ARIA labels
- Keyboard navigation needs improvement

**Requirements:**
- Ensure WCAG 2.1 AA compliance across all components
- Implement proper focus management in wizard flow
- Add screen reader support for all interactive elements
- Test with assistive technologies

**Acceptance Criteria:**
- [ ] WCAG 2.1 AA compliance verified via automated testing
- [ ] Proper focus management throughout wizard flow
- [ ] Screen reader compatibility confirmed
- [ ] Keyboard navigation supports all functionality

### 5.2 Mobile Experience Enhancement (Priority: High)

**Current Mobile Experience:**
- Responsive design implemented
- Some touch interactions could be improved
- Mobile-specific optimizations needed

**Requirements:**
- Optimize touch targets for mobile devices (minimum 44px)
- Improve mobile drawer experience
- Add swipe gestures where appropriate
- Optimize mobile keyboard experience

**Acceptance Criteria:**
- [ ] All touch targets meet minimum size requirements
- [ ] Mobile drawer provides excellent user experience
- [ ] Swipe gestures implemented where beneficial
- [ ] Mobile keyboard doesn't obstruct important UI elements

## Phase 6: Advanced Features & Enhancements

### 6.1 Topic Management System (Priority: Medium)

**Future Enhancement:**
- Topic favoriting and organization
- Custom topic categories
- Topic history and analytics
- Collaborative topic sharing

**Requirements:**
- Implement topic favoriting system
- Add custom categorization for saved topics
- Create topic usage analytics dashboard
- Add sharing capabilities for team collaboration

### 6.2 AI Enhancement Features (Priority: Low)

**Future Enhancement:**
- AI-powered topic suggestions based on user history
- Content generation integration
- Topic performance prediction
- Automated topic optimization

**Requirements:**
- Develop AI suggestion algorithms
- Integrate content generation APIs
- Implement performance prediction models
- Create optimization recommendation system

## Implementation Timeline

### Sprint 1 (Weeks 1-2): Core UX Issues
- Phase 1.1: Question Layout & Spacing
- Phase 1.2: Option Selection Interface  
- Phase 1.4: Multi-Select Input Enhancement

### Sprint 2 (Weeks 3-4): Navigation & Workflow
- Phase 1.3: Interactive Elements
- Phase 1.5: Review Step Consistency
- Phase 1.6: Edit Navigation Flow
- Phase 2.2: Question Defaults & Smart Suggestions

### Sprint 3 (Weeks 5-6): Results Page Foundation
- Phase 3.1: Topic Card Simplification
- Phase 3.2: Action System Redesign
- Phase 3.5: Results Management Simplification

### Sprint 4 (Weeks 7-8): Results Page Polish
- Phase 3.3: Topic Detail Drawer
- Phase 3.4: Card Interaction Improvements
- Phase 3.6: Generation Controls Update
- Phase 2.1: Step Timeline Redesign

### Sprint 5 (Weeks 9-10): Technical & Performance
- Phase 4.1: Component Architecture Optimization
- Phase 4.2: State Management Enhancement
- Phase 5.1: Accessibility Compliance
- Phase 5.2: Mobile Experience Enhancement

### Sprint 6+ (Future Phases): Advanced Features
- Phase 4.3: Performance Optimization
- Phase 6.1: Topic Management System
- Phase 6.2: AI Enhancement Features

## Success Metrics

### User Experience Metrics
- Wizard completion rate improvement (target: +25%)
- Time to complete wizard reduction (target: -30%)
- User satisfaction scores via feedback forms
- Mobile usability scores improvement

### Technical Metrics
- Page load time improvements
- Bundle size optimization
- Component test coverage (target: 85%+)
- Accessibility compliance score (WCAG 2.1 AA)

### Business Metrics
- Topic generation frequency
- Topic save rates
- User return rates
- Feature adoption rates

## Risk Assessment

### High-Risk Items
- Multi-select input enhancement may require significant testing
- Topic detail drawer implementation needs careful UX consideration
- State management changes could affect existing functionality

### Mitigation Strategies
- Implement comprehensive testing for complex interactions
- Create prototypes for major UI changes before development
- Maintain backward compatibility during state management updates
- Conduct user testing sessions for critical UX changes

## Dependencies

### External Dependencies
- Radix UI component updates may be needed
- Framer Motion version compatibility
- TailwindCSS configuration updates for new components

### Internal Dependencies
- Design system updates for new component variants
- API endpoints may need modifications for enhanced functionality
- Documentation updates for new features

---

*This feature requirements plan is a living document and should be updated as requirements evolve and new insights are gathered during implementation.*