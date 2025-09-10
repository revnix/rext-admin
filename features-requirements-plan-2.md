# Feature Requirements Plan

## Project Overview

**Wrext Admin** is a Next.js 15 web application designed for generating, managing, and utilizing AI-powered topics for content creation. The application currently features a topic builder wizard, data management through tables, and basic CRUD operations for topics.

### Current Technology Stack
- **Framework**: Next.js 15.5.0 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 with Tailwind PostCSS
- **UI Components**: Radix UI primitives with custom components
- **State Management**: Zustand for client state, TanStack Query for server state
- **Form Handling**: React Hook Form with Zod validation
- **Icons**: Lucide React
- **Testing**: Jest with Testing Library
- **Code Quality**: Biome (ESLint + Prettier alternative)
- **Animation**: Tailwind Animate CSS

### Current Features Analysis
1. **Topic Builder Wizard**: 6-step wizard for generating AI topics
2. **Data Tables**: Reusable table component with search, pagination, and actions
3. **Task Management**: Task Master integration for project management
4. **Dashboard**: Basic metrics and quick actions
5. **Authentication Pages**: Login, signup, forgot password
6. **API Integration**: Topic generation and management endpoints

---

## Feature Requirements & Improvements

### 1. Topic Builder Enhancement

#### 1.1 Audience Step Improvements
**Priority**: High  
**Effort**: 2-3 days

**Current Issues**:
- Pre-selects first two audience options automatically
- Geographic focus field is unnecessary

**Requirements**:
- Remove automatic pre-selection of audience options
- Remove geographic focus field from audience step
- Improve UX with better visual indicators for selection states
- Add field validation with clear error messages

**Implementation**:
```typescript
// Update AudienceStep component
- Remove defaultValue assignments for audience selection
- Remove geographic focus field and related validation
- Update form schema in topic-builder types
- Test audience selection without pre-selection
```

#### 1.2 Content Type Step Restructure
**Priority**: High  
**Effort**: 1-2 days

**Current Issues**:
- Content type options need to be restructured for better categorization

**Requirements**:
- Restructure content type options to include:
  - Blog Post or Article
  - Social Media Post with sub-options:
    - Facebook
    - Instagram  
    - Twitter
    - LinkedIn
    - TikTok
    - YouTube

**Implementation**:
```typescript
// Update ContentFormatStep component
interface ContentTypeOption {
  id: string;
  label: string;
  subcategories?: Array<{
    id: string;
    label: string;
    platform: string;
  }>;
}

const contentTypes: ContentTypeOption[] = [
  { id: 'blog', label: 'Blog Post or Article' },
  { 
    id: 'social', 
    label: 'Social Media Post',
    subcategories: [
      { id: 'facebook', label: 'Facebook', platform: 'facebook' },
      // ... other platforms
    ]
  }
];
```

#### 1.3 Goals & Style Step Enhancement
**Priority**: Medium  
**Effort**: 2 days

**Current Issues**:
- "Other" option shows same input field for all questions
- Poor UX for custom inputs

**Requirements**:
- Create unique input fields for each "Other" option
- Implement conditional rendering based on question context
- Add proper labels and placeholders for each custom input
- Improve validation for custom inputs

**Implementation**:
```typescript
// Update GoalsStep component
const [customInputs, setCustomInputs] = useState<Record<string, string>>({
  customGoal: '',
  customStyle: '',
  customTone: ''
});

const handleCustomInput = (field: string, value: string) => {
  setCustomInputs(prev => ({ ...prev, [field]: value }));
};
```

#### 1.4 Fine Tuning Step Redesign
**Priority**: High  
**Effort**: 2-3 days

**Current Issues**:
- Contains unnecessary fields (Content Language, Target Region)
- Poor naming and field organization
- Missing topic count selector

**Requirements**:
- Remove Content Language and Target Region fields
- Rename step from "Fine Tuning" to "Content Preferences"
- Reorder fields with "Any other requirements?" at the top with larger text area
- Add topic count slider (5-50 topics)
- Improve field labels and help text
- Add better visual hierarchy

**Implementation**:
```typescript
// Update AdvancedStep component
interface AdvancedFormData {
  additionalRequirements: string; // Moved to top, larger field
  keywords: string[];
  toneModifiers: string[];
  numTopics: number; // New slider field (5-50)
  // Remove: contentLanguage, targetRegion
}

// Add slider component for topic count
<Slider
  value={[formData.numTopics]}
  onValueChange={([value]) => updateFormData({ numTopics: value })}
  min={5}
  max={50}
  step={5}
  className="w-full"
/>
```

#### 1.5 Review Step UI/UX Overhaul
**Priority**: High  
**Effort**: 3-4 days

**Current Issues**:
- Shows data in 3 columns layout
- Poor visual hierarchy and scanability

**Requirements**:
- Replace 3-column layout with responsive grid layout
- Create field cards with:
  - Relevant icons for each field type
  - Clear field names/labels
  - Field values prominently displayed
  - Easy-to-scan visual design
- Add edit buttons for quick field modifications
- Improve mobile responsiveness

**Implementation**:
```typescript
// Create new ReviewFieldCard component
interface ReviewFieldCard {
  icon: ReactNode;
  label: string;
  value: string | string[];
  onEdit?: () => void;
}

const fieldMappings = [
  { key: 'industry', icon: <Building />, label: 'Industry' },
  { key: 'audience', icon: <Users />, label: 'Target Audience' },
  { key: 'contentType', icon: <FileText />, label: 'Content Type' },
  // ... other mappings
];
```

#### 1.6 Generation Loading Experience
**Priority**: Medium  
**Effort**: 2 days

**Current Issues**:
- Loading popup needs modernization
- Missing cancellation functionality
- No cancellation confirmation

**Requirements**:
- Redesign loading modal with modern, futuristic aesthetic
- Add functional cancel button with confirmation dialog
- Implement generation cancellation API
- Add progress indicators and estimated time
- Improve loading animations

**Implementation**:
```typescript
// Update AILoadingScreen component
const handleCancel = async () => {
  const confirmed = await showConfirmDialog({
    title: 'Cancel Topic Generation?',
    message: 'This will stop the current generation process. Are you sure?',
    confirmText: 'Yes, Cancel',
    cancelText: 'Continue Generating'
  });
  
  if (confirmed) {
    await cancelGeneration();
    onCancel();
  }
};
```

### 2. Results Page Implementation

#### 2.1 Dedicated Results Page
**Priority**: High  
**Effort**: 4-5 days

**Current Issues**:
- Results show in same topic builder page
- No dedicated layout for results viewing
- Missing temporary session management

**Requirements**:
- Create new results page at `/topics/create/results/[temporaryId]`
- Implement temporary session storage for unsaved results
- Create dedicated results layout with better visual hierarchy
- Add breadcrumb navigation
- Implement session recovery from localStorage

**Implementation**:
```typescript
// Create new page: app/topics/create/results/[temporaryId]/page.tsx
interface ResultsPageProps {
  params: { temporaryId: string };
}

// Implement session management
interface ResultsSession {
  id: string;
  topics: GeneratedTopic[];
  formData: TopicBuilderFormData;
  createdAt: Date;
  expiresAt: Date;
}
```

#### 2.2 Modern Topic Cards
**Priority**: High  
**Effort**: 3 days

**Current Issues**:
- Topic cards need modern, minimalistic design
- Missing expand functionality for details
- No quick actions on cards

**Requirements**:
- Redesign topic cards with minimalistic, modern aesthetic
- Add expand button for detailed topic view
- Create modal/popup for expanded topic details including:
  - Full topic description
  - Keywords and metadata
  - Scoring breakdown
  - SEO recommendations
- Add quick action buttons (save, edit, use for content)
- Implement card animations and interactions

**Implementation**:
```typescript
// Create new TopicCard component
interface TopicCardProps {
  topic: GeneratedTopic;
  onExpand: (topic: GeneratedTopic) => void;
  onSave: (topicId: string) => void;
  onUseForContent: (topicId: string) => void;
}

// Create TopicDetailsModal component
interface TopicDetailsModalProps {
  topic: GeneratedTopic;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  onEdit: () => void;
  onUseForContent: () => void;
}
```

#### 2.3 Bulk Operations & Content Creation
**Priority**: Medium  
**Effort**: 2-3 days

**Current Issues**:
- Missing bulk selection and operations
- No content creation workflow integration

**Requirements**:
- Add checkbox selection for multiple topics
- Implement bulk save functionality
- Add "Write Content" button for individual topics
- Route to `/flows/create` with topic ID parameter
- Add bulk export options (JSON, CSV)
- Create selection management state

**Implementation**:
```typescript
// Add selection state management
interface SelectionState {
  selectedTopics: Set<string>;
  isAllSelected: boolean;
}

// Content creation navigation
const handleUseForContent = (topicId: string) => {
  router.push(`/flows/create?topicId=${topicId}`);
};
```

### 3. Universal Data Table Component

#### 3.1 Enhanced Table Features
**Priority**: High  
**Effort**: 4-5 days

**Current Issues**:
- Current table lacks search functionality in some pages
- Inconsistent table implementations across pages
- Missing advanced features

**Requirements**:
- Enhance existing DataTable component to be truly universal
- Add robust search functionality across all searchable columns
- Implement working pagination with customizable page sizes
- Add loading skeleton states
- Create action button system for table-level operations
- Support for row-level actions (view, edit, delete, copy, etc.)
- Make table responsive for mobile devices

**Implementation**:
```typescript
// Enhanced DataTable interface
interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  searchable?: boolean;
  searchPlaceholder?: string;
  searchFields?: string[];
  pageSize?: number;
  actions?: ReactNode;
  rowActions?: RowAction<T>[];
  loading?: boolean;
  error?: Error | null;
  onRowClick?: (row: T) => void;
  emptyState?: EmptyStateConfig;
}

// Add advanced search across multiple fields
const useTableSearch = <T>(data: T[], searchFields: string[]) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    
    return data.filter(item =>
      searchFields.some(field =>
        String(item[field as keyof T])
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      )
    );
  }, [data, searchTerm, searchFields]);
  
  return { searchTerm, setSearchTerm, filteredData };
};
```

#### 3.2 Table Standardization Across Pages
**Priority**: Medium  
**Effort**: 3 days

**Current Issues**:
- Inconsistent table implementations
- Different styling and functionality per page

**Requirements**:
- Replace all existing table implementations with enhanced DataTable
- Standardize column definitions and row actions
- Implement consistent loading and error states
- Create page-specific table configurations
- Add proper TypeScript definitions for each data type

**Pages to Update**:
- `/topics` - topics table (already partially implemented)
- `/content` - Content items table
- `/tasks` - Task management table
- `/users` - User management table
- `/integrations` - Integrations status table

### 4. User Experience Improvements

#### 4.1 Loading States & Error Handling
**Priority**: Medium  
**Effort**: 2-3 days

**Requirements**:
- Standardize loading skeleton components
- Implement comprehensive error boundary system
- Add retry mechanisms for failed operations
- Create user-friendly error messages
- Add offline state handling

#### 4.2 Mobile Responsiveness
**Priority**: Medium  
**Effort**: 3-4 days

**Requirements**:
- Audit all components for mobile responsiveness
- Implement mobile-first table design
- Add touch-friendly interactions
- Optimize topic builder for mobile
- Test across different device sizes

#### 4.3 Performance Optimization
**Priority**: Medium  
**Effort**: 2-3 days

**Requirements**:
- Implement proper code splitting
- Optimize large component bundles
- Add loading states for heavy operations
- Implement proper caching strategies
- Optimize image loading and assets

### 5. API & Backend Improvements

#### 5.1 Session Management API
**Priority**: High  
**Effort**: 2-3 days

**Requirements**:
- Create session management for temporary results
- Implement session cleanup for expired results
- Add session recovery functionality
- Create session-based topic management

#### 5.2 Topic Management API Enhancement
**Priority**: Medium  
**Effort**: 2 days

**Requirements**:
- Add bulk operations support
- Implement topic editing functionality
- Add topic archiving/soft delete
- Create topic export functionality
- Add search and filtering capabilities

### 6. Developer Experience

#### 6.1 Component Documentation
**Priority**: Low  
**Effort**: 1-2 days

**Requirements**:
- Create Storybook setup for component documentation
- Document all reusable components
- Add usage examples and props documentation
- Create design system documentation

#### 6.2 Testing Coverage
**Priority**: Medium  
**Effort**: 3-4 days

**Requirements**:
- Add comprehensive unit tests for core components
- Create integration tests for critical user flows
- Add E2E tests for topic builder workflow
- Implement visual regression testing

---

## Implementation Roadmap

### Phase 1 (Weeks 1-2): Core Topic Builder Fixes
- Topic Builder Audience Step improvements
- Content Type step restructure  
- Goals & Style step enhancement
- Fine Tuning step redesign
- Review step UI overhaul

### Phase 2 (Weeks 3-4): Results Page & Topic Cards
- Dedicated results page implementation
- Modern topic card design
- Topic details modal
- Bulk operations functionality

### Phase 3 (Weeks 5-6): Universal Table Component
- Enhanced DataTable component
- Table standardization across all pages
- Loading states and error handling
- Mobile responsiveness improvements

### Phase 4 (Weeks 7-8): Polish & Performance
- Generation loading experience enhancement
- Performance optimization
- API improvements
- Testing coverage
- Documentation

---

## Success Metrics

1. **User Experience**:
   - Reduced topic builder completion time by 30%
   - Increased mobile usage by 50%
   - Decreased error rates by 40%

2. **Feature Adoption**:
   - 80% of users complete topic builder workflow
   - 60% of generated topics are saved
   - 40% of saved topics are used for content creation

3. **Technical**:
   - 90%+ test coverage for core components
   - Page load times under 2 seconds
   - Zero critical accessibility violations

4. **Business Impact**:
   - Increased user engagement time by 25%
   - Improved topic-to-content conversion rate
   - Reduced support tickets related to UX issues

---

This comprehensive plan addresses all the requirements mentioned in the features-improvements-notes.md file while adding additional improvements for better user experience, maintainability, and scalability.