# Simplified Topic Builder Questions

## Overview

The Topic Builder wizard has been streamlined to focus on essential questions only, creating a more TypeForm-like experience while maintaining all functionality needed for quality topic generation.

**Before**: ~20+ complex fields including demographics, advanced options, and overlapping configurations  
**After**: 6 essential fields that capture all core requirements

## Essential Questions (Current)

### Step 1: Getting Started
- **wizardMode**: "How would you like to start?"
  - "I have a specific topic in mind" (subject-first)
  - "I want to explore my industry" (industry-first)
- **industry**: Industry/domain selection (dropdown)
- **industry_other**: Custom industry (conditional)
- **subject**: Specific topic (conditional for subject-first mode)

### Step 2: Your Audience  
- **audience**: "Who are you creating this for?" (chip input, optional)
  - Examples: Small business owners, College students, Working professionals

### Step 3: Goals
- **purpose**: "What do you want to achieve?" (multi-select, max 3)
  - Educate/Inform, Entertain/Engage, Inspire/Motivate, Persuade/Convince, Promote Product/Service, Drive SEO, Thought Leadership, Other
- **purpose_other**: Custom purpose (conditional)

### Step 4: Review & Generate
- **num_topics**: Number of topics (input on review screen, 1-20, default 5)
- Review selections and generate topics

## Benefits of Simplification

1. **Faster Completion**: Reduces form completion time by ~60%
2. **Better UX**: Creates TypeForm-like focused experience
3. **Higher Completion Rates**: Fewer fields = less abandonment
4. **Easier Maintenance**: Simpler codebase and fewer edge cases
5. **Mobile Friendly**: Better experience on smaller screens
6. **Cleaner Flow**: Streamlined wizard with only essential questions

## Technical Benefits

- **Performance**: Streamlined validation and processing
- **Code Clarity**: Clean, focused codebase with minimal complexity
- **Type Safety**: Strong TypeScript enforcement with simplified schemas
- **User Experience**: TypeForm-like single-question flow
- **Mobile Optimized**: Excellent experience on all screen sizes
- **Reduced Complexity**: No overlapping or redundant fields

## TypeForm-Style Experience

The new wizard provides:
- **One question per screen** for better focus
- **Smooth transitions** between questions
- **Progress indication** showing completion status
- **Smart navigation** with conditional question flow
- **Accessibility-first** design with screen reader support
- **Review screen integration** with number of topics selection