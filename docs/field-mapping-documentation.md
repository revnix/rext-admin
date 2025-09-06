# Field Mapping and Transformation Logic Documentation

## Overview

This document defines the explicit mapping rules and transformation logic to convert backend topic objects (`GeneratedTopic`) to the frontend `IdeaData` interface for seamless display and management in the Ideas page DataTable.

## Data Flow Architecture

```
Backend API Response (GeneratedTopic[])
    ↓
Field Mapping & Transformation Logic 
    ↓
Frontend Display Format (IdeaData[])
    ↓
DataTable UI Components
```

## Interface Definitions

### Source: Backend Topic Response (`GeneratedTopic`)
Located in `/types/topic-builder.ts`, lines 251-283

```typescript
interface GeneratedTopic {
  id: string;
  title: string;
  angle: string;
  description?: string;
  channel_fit: string[];
  audience_fit: string[];
  why_it_works: string;
  scores: {
    relevance: number;    // 0-1 range
    freshness: number;    // 0-1 range
    novelty: number;      // 0-1 range
  };
  tags: string[];
  is_saved?: boolean;
  _optimisticSaved?: boolean;
  _isBeingSaved?: boolean;
}
```

### Target: Frontend IdeaData Interface
Located in `/types/data-table.ts`, lines 46-64

```typescript
interface IdeaData extends BaseTableRow {
  name: string;
  description: string;
  category: string;
  status: string;
  priority: string;
  source: string;
  tags: string[];
  created: string;
  lastModified: string;
  assignee: string;
  estimatedEffort: string;
  // Enhanced fields
  score?: number;
  ranking?: string;
  updated?: string;
  author?: string;
  contentType?: string;
}
```

## Complete Field Mapping Table

| Source Field | Target Field | Transformation Rule | Default Value | Notes |
|-------------|-------------|-------------------|---------------|-------|
| `id` | `id` | **Direct mapping** | Required | Unique identifier, no transformation |
| `title` | `name` | **Direct mapping** | Required | Main topic title becomes idea name |
| `angle` + `description` | `description` | **Enhanced combination** | "AI-generated topic idea" | Combines with " • " separator if both exist |
| `tags[0]` | `category` | **First tag extraction** | "General" | Capitalizes first letter, formats nicely |
| Status flags | `status` | **Status determination** | "generated" | Complex logic based on save state |
| `scores.*` | `priority` | **Weighted calculation** | "medium" | relevance×0.5 + freshness×0.3 + novelty×0.2 |
| Static | `source` | **Fixed value** | "AI Generated" | Always constant value |
| `tags` + extras | `tags` | **Tag enhancement** | `[]` | Original + channel/audience prefixes, max 8 |
| Timestamp | `created` | **ISO timestamp** | Current time | New Date().toISOString() |
| Timestamp | `lastModified` | **ISO timestamp** | Current time | New Date().toISOString() |
| Static | `assignee` | **Fixed value** | "AI Assistant" | Always constant value |
| `scores.novelty` | `estimatedEffort` | **Effort calculation** | "Medium" | Based on novelty complexity |
| `scores.*` | `score` | **Weighted score** | 50 | (weighted calculation) × 100, rounded |
| Array index | `ranking` | **Position ranking** | `undefined` | "#" + (index + 1) |
| Timestamp | `updated` | **Formatted date** | Current date | "MMM DD, YYYY" format |
| Static | `author` | **Fixed value** | "AI Assistant" | Always constant value |
| `channel_fit[0]` | `contentType` | **Channel mapping** | "General Content" | Maps channels to content types |

## Detailed Transformation Logic

### 1. Enhanced Description Creation
**Function**: `createEnhancedDescription(topic: GeneratedTopic): string`

**Logic**:
```typescript
const parts: string[] = [];

if (topic.angle) {
  parts.push(topic.angle);
}

if (topic.description) {
  parts.push(topic.description);
}

if (parts.length === 0) {
  parts.push("AI-generated topic idea");
}

return parts.join(" • ");
```

**Examples**:
- Input: `{angle: "Future prospects", description: "Healthcare innovation"}` → `"Future prospects • Healthcare innovation"`
- Input: `{angle: "Market trends", description: null}` → `"Market trends"`
- Input: `{angle: "", description: ""}` → `"AI-generated topic idea"`

### 2. Status Determination Logic
**Function**: `determineTopicStatus(topic: GeneratedTopic): string`

**Priority Rules**:
1. If `topic._isBeingSaved` → `"saving"`
2. If `topic.is_saved || topic._optimisticSaved` → `"saved"`
3. Default → `"generated"`

**Examples**:
- Topic being saved → `"saving"`
- Topic successfully saved → `"saved"`
- New generated topic → `"generated"`

### 3. Priority Calculation Algorithm
**Function**: `calculatePriority(scores: GeneratedTopic["scores"]): string`

**Weighted Formula**:
```
weightedScore = relevance × 0.5 + freshness × 0.3 + novelty × 0.2
```

**Thresholds**:
- `weightedScore >= 0.8` → `"high"`
- `weightedScore >= 0.6` → `"medium"`  
- `weightedScore < 0.6` → `"low"`

**Examples**:
- `{relevance: 0.9, freshness: 0.8, novelty: 0.7}` → weighted: 0.83 → `"high"`
- `{relevance: 0.6, freshness: 0.7, novelty: 0.5}` → weighted: 0.62 → `"medium"`
- `{relevance: 0.3, freshness: 0.4, novelty: 0.5}` → weighted: 0.37 → `"low"`

### 4. Category Determination Logic
**Function**: `determineCategory(topic: GeneratedTopic): string`

**Hierarchy**:
1. **Primary**: First tag from `topic.tags[0]`, capitalized
2. **Fallback**: First channel from `topic.channel_fit[0]` + " Content"
3. **Default**: `"General"`

**Examples**:
- `tags: ["technology", "ai"]` → `"Technology"`
- `tags: [], channel_fit: ["blog", "social"]` → `"Blog Content"`
- `tags: [], channel_fit: []` → `"General"`

### 5. Tag Enhancement Algorithm
**Function**: `enhanceTags(topic: GeneratedTopic): string[]`

**Enhancement Strategy**:
1. Start with original `topic.tags`
2. Add up to 2 channel tags with `"channel:"` prefix
3. Add up to 2 audience tags with `"audience:"` prefix  
4. Limit total to 8 tags to avoid UI clutter

**Example**:
```typescript
// Input
topic = {
  tags: ["ai", "healthcare"],
  channel_fit: ["blog", "linkedin", "youtube"],
  audience_fit: ["professionals", "students", "researchers"]
}

// Output
["ai", "healthcare", "channel:blog", "channel:linkedin", "audience:professionals", "audience:students"]
```

### 6. Estimated Effort Calculation
**Function**: `calculateEstimatedEffort(scores: GeneratedTopic["scores"]): string`

**Logic Based on Novelty**:
- `novelty >= 0.8` → `"High"` (very novel = more effort)
- `novelty >= 0.4` → `"Medium"` (moderate novelty)
- `novelty < 0.4` → `"Low"` (familiar topic = less effort)

### 7. Overall Score Calculation
**Function**: `calculateOverallScore(scores: GeneratedTopic["scores"]): number`

**Formula**: Same weighted calculation as priority, but scaled to 0-100
```typescript
const weightedScore = relevance × 0.5 + freshness × 0.3 + novelty × 0.2;
return Math.round(weightedScore × 100);
```

**Examples**:
- `{relevance: 0.9, freshness: 0.8, novelty: 0.7}` → `83`
- `{relevance: 0.6, freshness: 0.5, novelty: 0.4}` → `53`

### 8. Content Type Inference
**Function**: `inferContentType(channelFit: string[]): string`

**Channel Mapping Table**:
| Input Channel | Output Content Type |
|--------------|-------------------|
| `"blog"` | `"Blog Post"` |
| `"social"`, `"twitter"`, `"facebook"` | `"Social Media"` |
| `"video"`, `"youtube"` | `"Video Content"` |
| `"email"` | `"Newsletter"` |
| `"linkedin"` | `"Professional Content"` |
| `"instagram"` | `"Visual Content"` |
| `"tiktok"` | `"Short Form Video"` |
| `"podcast"` | `"Podcast"` |
| `"infographic"` | `"Infographic"` |
| Any other | Capitalized + " Content" |

## Handling Missing or Extra Fields

### Missing Field Handling
| Missing Field | Default Behavior | Fallback Value |
|--------------|-----------------|---------------|
| `title` | **Warning logged** | Uses `id` as fallback |
| `angle` | **Silent fallback** | `""` |
| `description` | **Silent fallback** | Uses only `angle` |
| `scores` | **Default object** | `{relevance: 0, freshness: 0, novelty: 0}` |
| `tags` | **Empty array** | `[]` |
| `channel_fit` | **Empty array** | `[]` |
| `audience_fit` | **Empty array** | `[]` |

### Extra Field Handling
- Extra fields in `GeneratedTopic` are **ignored** during transformation
- No errors thrown for unexpected properties
- UI-specific fields (`_optimisticSaved`, `_isBeingSaved`) are processed appropriately

## Error Handling Strategy

### Validation Approach
- **Non-blocking**: Transformation continues with warnings for minor issues
- **Defensive**: Always returns valid `IdeaData` objects
- **Logging**: Records all transformation warnings for debugging

### Error Recovery Actions
1. **Invalid scores**: Default to `{relevance: 0, freshness: 0, novelty: 0}`
2. **Missing title**: Use `id` as fallback with warning
3. **Empty arrays**: Use appropriate defaults (e.g., `["General"]` for tags)
4. **Invalid types**: Cast to string with warning

## Performance Considerations

### Optimization Techniques
- **Batch processing**: Transform arrays efficiently
- **Object pooling**: Reuse date formatter objects
- **Lazy evaluation**: Calculate expensive fields only when needed
- **Caching**: Cache category and content type mappings

### Performance Metrics
- **Target**: < 1ms per topic transformation
- **Batch size**: Optimized for arrays of 50+ topics
- **Memory**: Minimal object creation during transformation

## Integration Points

### Primary Integration
**File**: `/lib/topic-transformations.ts`
**Function**: `transformTopicsToIdeas(topics: GeneratedTopic[]): IdeaData[]`

### Usage in Application
1. **Ideas Page**: `/app/ideas/page.tsx` (lines 33-34)
2. **Topics Hook**: `/hooks/use-topics.ts` (line 24)
3. **Testing**: `/__tests__/lib/topic-transformations.test.ts`

## Testing Strategy

### Test Coverage Requirements
- [ ] Single topic transformation with all fields
- [ ] Batch topic transformation
- [ ] Missing field handling for each field
- [ ] Invalid data type handling
- [ ] Edge cases (empty arrays, null values)
- [ ] Performance benchmarks
- [ ] Priority calculation accuracy
- [ ] Score normalization
- [ ] Tag enhancement logic
- [ ] Content type inference

### Sample Test Cases
```typescript
describe('Field Mapping Transformation', () => {
  it('should transform complete GeneratedTopic to IdeaData', () => {
    const input: GeneratedTopic = {
      id: "1",
      title: "AI in Healthcare",
      angle: "Future prospects",
      description: "Innovation trends",
      channel_fit: ["blog", "linkedin"],
      audience_fit: ["professionals", "students"],
      why_it_works: "Highly relevant and timely",
      scores: { relevance: 0.9, freshness: 0.8, novelty: 0.7 },
      tags: ["ai", "healthcare"]
    };

    const result = transformTopicsToIdeas([input])[0];
    
    expect(result.name).toBe("AI in Healthcare");
    expect(result.description).toBe("Future prospects • Innovation trends");
    expect(result.category).toBe("Ai");
    expect(result.priority).toBe("high");
    expect(result.score).toBe(83);
  });
});
```

## Maintenance Guidelines

### Adding New Field Mappings
1. Update this documentation with new mapping rules
2. Modify transformation functions in `/lib/topic-transformations.ts`
3. Add comprehensive test cases
4. Update TypeScript interfaces if needed
5. Verify DataTable UI handles new fields correctly

### Modifying Existing Mappings
1. **Backward compatibility**: Ensure existing data still transforms correctly
2. **Migration strategy**: Plan for data format changes
3. **Version control**: Document breaking changes in git commits
4. **Testing**: Verify all existing test cases still pass

## Troubleshooting

### Common Issues
1. **Undefined scores**: Check if backend is sending valid score objects
2. **Empty categories**: Verify tags or channel_fit arrays have values
3. **Invalid priorities**: Confirm score values are in 0-1 range
4. **Missing rankings**: Ensure transformation is called with proper array indexing

### Debug Tools
- Enable detailed logging in transformation functions
- Use browser dev tools to inspect transformed data
- Compare input/output objects in test files
- Monitor transformation performance with timing logs

---

**Implementation Reference**: `/lib/topic-transformations.ts`
**Last Updated**: September 2025
**Version**: 1.0