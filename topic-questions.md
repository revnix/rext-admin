# Simplified Topic Builder Questions

## Overview

The Topic Builder wizard has been streamlined to focus on essential questions only, creating a more TypeForm-like experience while maintaining all functionality needed for quality topic generation.

**Before**: ~20+ complex fields including demographics, advanced options, and overlapping configurations  
**After**: 10 essential fields that capture all core requirements

## Essential Questions (Retained)

### Step 1: Getting Started
- **wizardMode**: "How would you like to start?"
  - "I have a specific topic in mind" (subject-first)
  - "I want to explore my industry" (industry-first)
- **industry**: Industry/domain selection (dropdown)
- **industry_other**: Custom industry (conditional)
- **subject**: Specific topic (conditional for subject-first mode)

### Step 2: Your Audience  
- **audience**: "Who are you creating this for?" (multi-select)
  - Examples: Small business owners, College students, Working professionals

### Step 3: Content Type
- **content_type**: "What type of content will this be?"
  - Blog Post or Article
  - Social Media Post
- **platform**: "Where will you publish this?" (conditional)
  - Facebook, Instagram, Twitter, LinkedIn, TikTok, YouTube

### Step 4: Goals & Style
- **purpose**: "What do you want to achieve?" (multi-select, max 3)
  - Educate/Inform, Entertain/Engage, Inspire/Motivate, Persuade/Convince, Promote Product/Service, Drive SEO, Thought Leadership, Other
- **purpose_other**: Custom purpose (conditional)
- **tone**: "What tone should the content have?" (multi-select, max 3)  
  - Professional/Formal, Casual/Conversational, Friendly/Warm, Humorous/Playful, Serious/Academic, Technical/Analytical, Simple/Accessible, Inspirational/Uplifting, Other
- **tone_other**: Custom tone (conditional)

### Step 5: Advanced Options (Optional)
- **notes**: "Any other requirements?" (large text area, moved to top)
- **num_topics**: Number of topics (slider, 1-20, default 5)

### Step 6: Generate Topics
- Review and generate (unchanged)


## Benefits of Simplification

1. **Faster Completion**: Reduces form completion time by ~50%
2. **Better UX**: Creates TypeForm-like focused experience
3. **Higher Completion Rates**: Fewer fields = less abandonment
4. **Easier Maintenance**: Simpler codebase and fewer edge cases
5. **Mobile Friendly**: Better experience on smaller screens

## Technical Benefits

- **Performance**: Streamlined validation and processing
- **Code Clarity**: Clean, focused codebase
- **Type Safety**: Strong TypeScript enforcement
- **User Experience**: TypeForm-like single-question flow
- **Mobile Optimized**: Excellent experience on all screen sizes

## TypeForm-Style Experience

The new wizard provides:
- **One question per screen** for better focus
- **Smooth transitions** between questions
- **Progress indication** showing completion status
- **Smart navigation** with conditional question flow
- **Accessibility-first** design with screen reader support