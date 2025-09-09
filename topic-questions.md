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
- **num_ideas**: Number of ideas (slider, 1-20, default 5)

### Step 6: Generate Ideas
- Review and generate (unchanged)

## Removed Fields (Non-Essential)

The following fields were removed to simplify the user experience:

### Demographic Fields
- ~~**audience_size**~~: Not essential for topic generation
- ~~**demographic_age**~~: Demographic details unnecessary for initial topic creation
- ~~**demographic_location**~~: Geographic focus not needed for topic generation
- ~~**reader_level**~~: Can be inferred from content type/platform selection

### Complex Content Configuration
- ~~**content_goal**~~: Too complex and overlaps with purpose field

### Advanced Options (Moved to Later Enhancement)
- ~~**keywords**~~: Advanced option not essential for initial generation
- ~~**exclude**~~: Advanced filtering not needed for core functionality
- ~~**focus**~~: Can be consolidated with subject/notes fields
- ~~**region/language**~~: Not essential for basic topic generation
- ~~**is_ymyl**~~: Advanced content sensitivity flag not needed for most users
- ~~**fresh_vs_evergreen**~~: Advanced preference toggle not required  
- ~~**safe_vs_original**~~: Advanced preference toggle not required

## Benefits of Simplification

1. **Faster Completion**: Reduces form completion time by ~50%
2. **Better UX**: Creates TypeForm-like focused experience
3. **Higher Completion Rates**: Fewer fields = less abandonment
4. **Easier Maintenance**: Simpler codebase and fewer edge cases
5. **Mobile Friendly**: Better experience on smaller screens

## Technical Impact

- **Schemas**: Simplified validation with fewer required fields
- **UI Components**: Cleaner, more focused step interfaces  
- **API Payload**: Reduced data transmission and processing
- **Validation Logic**: Fewer complex validation rules to maintain

## Future Enhancements

Advanced options that were removed can be added back as optional "Pro" features:
- Advanced filtering (keywords, exclude patterns)
- Demographic targeting
- Content sensitivity settings  
- Regional/language preferences
- Content timing preferences

This maintains the core simple experience while allowing power users to access advanced features when needed.