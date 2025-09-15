# Flow Creation Wizard Analysis

## Overview
Analysis of flow requirements to create a streamlined, user-friendly wizard for content flow creation with simplified steps and optimal question ordering.

## Wizard Steps Structure

### Number of Steps: 7 Steps
1. **Project & Topic Selection**
2. **Content Configuration**
3. **Audience & Goals**
4. **Voice & Localization**
5. **SEO & Structure**
6. **AI & Research Settings**
7. **Review & Launch**

## Step-by-Step Question Mapping

### Step 1: Project & Topic Selection
**Questions (3)**
1. **Select Project** - `projectId`
   - **Type:** Dropdown
   - **Options:** Load from projects API
   - **Dependencies:** None
   - **Required:** Yes

2. **Select Topic** - `topicId`
   - **Type:** Dropdown/Search
   - **Options:** Load from topics API
   - **Dependencies:** None
   - **Required:** Yes

3. **Flow Name** - `flowName`
   - **Type:** Text Input
   - **Auto-generated:** Based on Project + Topic + Content Type
   - **Dependencies:** Project + Topic selected
   - **Required:** Yes
   - **Example:** "Thread - AI Content Strategy - Marketing Project"

### Step 2: Content Configuration
**Questions (3)**
1. **Select Platform** - `platform`
   - **Type:** Radio buttons
   - **Options:** Website, Social Media
   - **Dependencies:** None (pre-filled from topic metadata)
   - **Required:** Yes

2. **Select Content Type** - `contentType`
   - **Type:** Radio buttons
   - **Options:**
     - If Social Media: Thread, Carousel, Post, Poll, Video Script
     - If Website: Article, Blog Post, Landing Page
   - **Dependencies:** Platform selection
   - **Required:** Yes

3. **Industry** - `industry`
   - **Type:** Dropdown
   - **Options:** Technology, Healthcare, Finance, Education, Marketing, etc.
   - **Dependencies:** None (pre-filled from topic metadata)
   - **Required:** Yes

### Step 3: Audience & Goals
**Questions (4)**
1. **Audience Size** - `audienceSize`
   - **Type:** Radio buttons
   - **Options:** Small (1K-10K), Medium (10K-100K), Large (100K-1M), Massive (1M+)
   - **Dependencies:** None
   - **Required:** Yes

2. **Audience Type** - `audienceType`
   - **Type:** Multi-select checkboxes
   - **Options:** Consumers, Businesses, Enterprises, Students, Professionals, Seniors, Teens, Parents
   - **Dependencies:** Industry selection (filters relevant options)
   - **Required:** Yes

3. **Reading Level** - `readingLevel`
   - **Type:** Radio buttons
   - **Options:** Beginner, Intermediate, Advanced
   - **Dependencies:** Audience Type
   - **Required:** Yes

4. **Goals/Purpose** - `goals`
   - **Type:** Multi-select checkboxes
   - **Options:** Educate, Entertain, Inspire, Persuade, Promote, Drive SEO, Thought Leadership
   - **Dependencies:** Platform + Content Type
   - **Required:** Yes

### Step 4: Voice & Localization
**Questions (3)**
1. **Tone** - `tone`
   - **Type:** Multi-select checkboxes
   - **Options:** Professional, Casual, Friendly, Humorous, Serious, Technical, Simple, Inspirational
   - **Dependencies:** Audience Type + Reading Level
   - **Required:** Yes

2. **Region** - `region`
   - **Type:** Dropdown
   - **Options:** International/Global, United States, United Kingdom, Canada, Australia, etc.
   - **Dependencies:** None
   - **Required:** Yes

3. **Language** - `language`
   - **Type:** Dropdown
   - **Options:** English (only for now)
   - **Dependencies:** None
   - **Required:** Yes

### Step 5: SEO & Structure
**Questions (6)**
1. **Content Length** - `contentLength`
   - **Type:** Radio buttons + Custom input
   - **Options:**
     - Thread: Short (5-10 tweets), Medium (10-15), Long (15-25), Custom
     - Article: Short (500-800 words), Medium (800-1500), Long (1500-3000), Custom
   - **Dependencies:** Content Type
   - **Required:** Yes

2. **Primary Keywords** - `primaryKeywords`
   - **Type:** Tag input
   - **Options:** Free text input with suggestions
   - **Dependencies:** Topic + Industry
   - **Required:** No

3. **Search Intent** - `searchIntent`
   - **Type:** Multi-select checkboxes
   - **Options:** Informational, Navigational, Transactional, Commercial
   - **Dependencies:** Goals/Purpose
   - **Required:** No

4. **Include Table of Contents** - `includeTOC`
   - **Type:** Toggle
   - **Options:** Yes, No
   - **Dependencies:** Content Length (show only for longer content)
   - **Required:** No

5. **Include Summary** - `includeSummary`
   - **Type:** Toggle
   - **Options:** Yes, No
   - **Dependencies:** Content Length
   - **Required:** No

6. **Include Call-to-Action** - `includeCTABlock`
   - **Type:** Toggle
   - **Options:** Yes, No
   - **Dependencies:** Goals includes "Promote" or "Persuade"
   - **Required:** No

### Step 6: AI & Research Settings
**Questions (4)**
1. **AI Model** - `aiModel`
   - **Type:** Dropdown
   - **Options:** OpenAI GPT-4, Anthropic Claude, Google Gemini
   - **Dependencies:** None
   - **Required:** Yes

2. **Research Depth** - `researchDepth`
   - **Type:** Radio buttons
   - **Options:** Basic (5-10 sources), Comprehensive (10-20 sources)
   - **Dependencies:** None
   - **Required:** Yes

3. **Enable Similar Articles** - `enableSimilarArticles`
   - **Type:** Toggle
   - **Options:** Yes, No
   - **Dependencies:** None
   - **Required:** No

4. **Advanced Settings** - Collapsible section
   - **Temperature:** 0.7 (default, slider 0.0-1.0)
   - **Max Articles:** 10 (if similar articles enabled)
   - **Citation Requirements:** Toggle for requiring citations

### Step 7: Review & Launch
**Questions (1)**
1. **Human Review** - `enableHumansInTheLoop`
   - **Type:** Toggle + Multi-select
   - **Options:**
     - Enable: Yes, No
     - Reviewers: Load from team members API
   - **Dependencies:** None
   - **Required:** No

## Question Dependencies Map

```
Project Selection → Auto-generate Flow Name
Topic Selection → Auto-generate Flow Name, Pre-fill Platform/Industry
Platform Selection → Filter Content Type options
Content Type → Determine Content Length options
Industry → Filter Audience Type options
Audience Type → Suggest appropriate Tone options
Reading Level → Adjust Tone suggestions
Goals/Purpose → Show/hide CTA option, affect Search Intent
Content Length → Show/hide TOC and Summary options
Enable Similar Articles → Show Max Articles setting
```

## Optimal Question Order Rationale

1. **Start with fundamentals** (Project/Topic) that affect everything downstream
2. **Content basics** (Platform/Type) that determine available options
3. **Know your audience** before setting voice/tone
4. **Voice follows audience** understanding
5. **SEO/Structure** after content basics are established
6. **Technical settings** near the end when users are committed
7. **Final review** with human oversight options

## Simplified Question Texts & Options

### Simplified Language
- "Select Project" instead of "Select Project: projectId"
- "Who's your audience?" instead of "Audience Type: audienceType"
- "How should it sound?" instead of "Tone: tone"
- "How long should it be?" instead of "Content Length: contentLength"
- "Want AI research help?" instead of "Enable Similar Articles: enableSimilarArticles"

### Reduced Options
- Audience Size: Small, Medium, Large (removed "Massive")
- Content Length: Short, Medium, Long, Custom (specific word counts in help text)
- Tone: Max 3-4 selections instead of 8+ options
- Goals: Group related goals (Educate + Inform, Promote + Persuade)

## UI/UX Best Practices

### Navigation
- **Progress indicator** showing current step (e.g., "Step 3 of 7")
- **Back/Next buttons** with validation
- **Save Draft** option on each step
- **Skip optional sections** with clear indicators

### Visual Design
- **Single column layout** for focus
- **Card-based steps** with clear boundaries
- **Conditional fields** slide in smoothly
- **Help tooltips** for complex options
- **Preview pane** showing auto-generated values

### Interaction Patterns
- **Smart defaults** based on previous selections
- **Progressive disclosure** for advanced options
- **Real-time validation** with helpful error messages
- **Auto-save** every 30 seconds
- **Keyboard navigation** support

### Mobile Considerations
- **Touch-friendly** button sizes (44px minimum)
- **Swipe gestures** for step navigation
- **Collapsible sections** for advanced options
- **Sticky action buttons** at bottom

## Complete Questions List with Details

| Step | # | Question | Type | Required | Dependencies | Options/Examples | Notes |
|------|---|----------|------|----------|--------------|------------------|--------|
| 1 | 1.1 | Select Project | Dropdown | Yes | None | Load from API | - |
| 1 | 1.2 | Select Topic | Search/Dropdown | Yes | None | Load from API | - |
| 1 | 1.3 | Flow Name | Text | Yes | Project + Topic | Auto: "{ContentType} - {Topic} - {Project}" | Editable |
| 2 | 2.1 | Platform | Radio | Yes | None | Website, Social Media | Pre-filled from topic |
| 2 | 2.2 | Content Type | Radio | Yes | Platform | SM: Thread/Carousel/Post/Poll/Video; Web: Article/Blog/Landing | - |
| 2 | 2.3 | Industry | Dropdown | Yes | None | Tech, Healthcare, Finance, Education, Marketing | Pre-filled from topic |
| 3 | 3.1 | Audience Size | Radio | Yes | None | Small (1K-10K), Medium (10K-100K), Large (100K+) | Simplified from 4 to 3 |
| 3 | 3.2 | Audience Type | Multi-select | Yes | Industry | Consumers, Businesses, Students, Professionals | Industry-filtered |
| 3 | 3.3 | Reading Level | Radio | Yes | Audience Type | Beginner, Intermediate, Advanced | - |
| 3 | 3.4 | Goals | Multi-select | Yes | Platform + Type | Educate, Entertain, Promote, Drive SEO | Grouped options |
| 4 | 4.1 | Tone | Multi-select | Yes | Audience + Reading | Professional, Casual, Friendly, Technical (max 3) | Smart suggestions |
| 4 | 4.2 | Region | Dropdown | Yes | None | Global, US, UK, Canada, Australia | - |
| 4 | 4.3 | Language | Dropdown | Yes | None | English | Future: more languages |
| 5 | 5.1 | Content Length | Radio + Custom | Yes | Content Type | Short/Medium/Long + Custom input | Type-specific ranges |
| 5 | 5.2 | Primary Keywords | Tag Input | No | Topic + Industry | Free text with suggestions | AI-suggested |
| 5 | 5.3 | Search Intent | Multi-select | No | Goals | Informational, Commercial, Transactional | Conditional |
| 5 | 5.4 | Include TOC | Toggle | No | Content Length | Yes/No | Show for Medium/Long |
| 5 | 5.5 | Include Summary | Toggle | No | Content Length | Yes/No | Show for Medium/Long |
| 5 | 5.6 | Include CTA | Toggle | No | Goals | Yes/No | Show if "Promote" goal |
| 6 | 6.1 | AI Model | Dropdown | Yes | None | GPT-4, Claude, Gemini | Default: GPT-4 |
| 6 | 6.2 | Research Depth | Radio | Yes | None | Basic (5-10 sources), Comprehensive (10-20) | - |
| 6 | 6.3 | Enable Research | Toggle | No | None | Yes/No | Default: Yes |
| 6 | 6.4 | Advanced Settings | Collapsible | No | None | Temperature, Max Articles, Citations | Collapsed by default |
| 7 | 7.1 | Human Review | Toggle + Multi | No | None | Enable + Select Reviewers | Team members API |

## Implementation Notes

### Technical Considerations
- **State management** for wizard progress and form data
- **Validation schema** for each step
- **Auto-save** mechanism with conflict resolution
- **Analytics** tracking for drop-off points
- **A/B testing** framework for question variations

### Performance Optimizations
- **Lazy load** dropdown options
- **Debounced** auto-complete searches
- **Prefetch** likely next step data
- **Cache** user selections locally

### Accessibility
- **Screen reader** compatible
- **High contrast** mode support
- **Keyboard-only** navigation
- **ARIA labels** for all form elements

## Success Metrics
- **Completion rate** by step
- **Time per step** averages
- **Drop-off points** identification
- **User satisfaction** surveys
- **Generated content quality** scores