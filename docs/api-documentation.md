# API Documentation

## Overview

This document describes the current API structure for the Topic Builder, including request/response formats and validation requirements.

## Topic Generation API

### POST /api/generate-topics

Generates AI-powered topic ideas based on user preferences.

#### Request Format

```typescript
interface TopicGenerationRequest {
  wizardMode: "subject-first" | "industry-first";
  industry: string;
  industry_other?: string;
  subject?: string;
  audience?: string[];
  content_type: string;
  content_type_other?: string;
  platform?: string;
  platform_other?: string;
  purpose: string[];
  purpose_other?: string;
  tone: string[];
  tone_other?: string;
  notes?: string;
  num_ideas: number;
  timestamp: string;
}
```

#### Example Request

```json
{
  "wizardMode": "industry-first",
  "industry": "technology",
  "audience": ["developers", "startup-founders"],
  "content_type": "blog-post",
  "purpose": ["educate-inform", "thought-leadership"],
  "tone": ["professional-formal", "technical-analytical"],
  "notes": "Focus on emerging AI trends and practical applications",
  "num_ideas": 5,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### Response Format

```typescript
interface TopicGenerationResponse {
  topics: GeneratedTopic[];
  request_id: string;
  generated_at: string;
}

interface GeneratedTopic {
  id: string;
  title: string;
  angle: string;
  description?: string;
  channel_fit: string[];
  audience_fit: string[];
  why_it_works: string;
  scores: {
    relevance: number;    // 0-1
    freshness: number;    // 0-1
    novelty: number;      // 0-1
  };
  tags: string[];
}
```

#### Example Response

```json
{
  "topics": [
    {
      "id": "topic-001",
      "title": "The Future of AI-Powered Development Tools",
      "angle": "How AI is transforming the developer workflow in 2024",
      "description": "Comprehensive guide to the latest AI tools revolutionizing software development",
      "channel_fit": ["blog", "linkedin"],
      "audience_fit": ["developers", "tech-leads"],
      "why_it_works": "Addresses current needs in developer productivity with practical focus",
      "scores": {
        "relevance": 0.95,
        "freshness": 0.88,
        "novelty": 0.72
      },
      "tags": ["AI", "development", "productivity", "tools"]
    }
  ],
  "request_id": "req-abc123",
  "generated_at": "2024-01-15T10:30:45.000Z"
}
```

## Topic Management API

### POST /api/save-topic

Save a generated topic to the user's library.

#### Request Format

```typescript
interface SaveTopicRequest {
  title: string;
  angle: string;
  channel_fit: string[];
  audience_fit: string[];
  why_it_works: string;
  scores: {
    relevance: number;
    freshness: number;
    novelty: number;
  };
  tags: string[];
}
```

### GET /api/topics

Retrieve saved topics from the user's library.

#### Query Parameters
- `limit?: number` - Maximum number of topics to return (default: 20)
- `offset?: number` - Number of topics to skip (default: 0)
- `search?: string` - Search term to filter topics

#### Response Format

```typescript
interface TopicsResponse {
  topics: SavedTopic[];
  total: number;
  offset: number;
  limit: number;
}

interface SavedTopic {
  id: string;
  title: string;
  angle: string;
  channel_fit: string[];
  audience_fit: string[];
  why_it_works: string;
  scores: TopicScores;
  tags: string[];
  saved_at: string;
  is_favorite?: boolean;
}
```

## Validation Rules

### Field Requirements

#### Required Fields
- `wizardMode`: Must be "subject-first" or "industry-first"
- `industry`: Must be non-empty string
- `content_type`: Must be non-empty string
- `purpose`: Must be non-empty array
- `tone`: Must be non-empty array
- `num_ideas`: Must be number between 1-20
- `timestamp`: Must be valid ISO date string

#### Conditional Fields
- `subject`: Required when `wizardMode` is "subject-first"
- `platform`: Required when `content_type` is "social-media"
- `industry_other`: Required when `industry` is "other"
- `content_type_other`: Required when `content_type` is "other"
- `purpose_other`: Required when `purpose` includes "other"
- `tone_other`: Required when `tone` includes "other"

#### Optional Fields
- `audience`: Array of audience types
- `notes`: Additional requirements or notes
- Platform-specific "other" fields

### Field Constraints

#### String Fields
- `industry`: Must be from predefined list or "other"
- `content_type`: Must be "blog-post" or "social-media"
- `platform`: Must be from predefined platform list when required

#### Array Fields
- `purpose`: Maximum 3 items, must be from predefined list
- `tone`: Maximum 3 items, must be from predefined list
- `audience`: No maximum limit

#### Numeric Fields
- `num_ideas`: Integer between 1 and 20 (inclusive)

## Error Responses

### Validation Errors (400)

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "purpose",
      "message": "Purpose is required"
    },
    {
      "field": "num_ideas",
      "message": "Must be between 1 and 20"
    }
  ]
}
```

### Authentication Errors (401)

```json
{
  "error": "Unauthorized",
  "message": "Invalid API key"
}
```

### Rate Limiting (429)

```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Try again later.",
  "retry_after": 60
}
```

### Server Errors (500)

```json
{
  "error": "Internal server error",
  "message": "Topic generation service temporarily unavailable"
}
```

## Authentication

All API endpoints require authentication via API key in the request headers:

```http
Authorization: Bearer your_api_key_here
Content-Type: application/json
```

## Rate Limits

- **Topic Generation**: 10 requests per minute per API key
- **Topic Management**: 100 requests per minute per API key

## Response Codes

- `200` - Success
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid API key)
- `429` - Rate limit exceeded
- `500` - Internal server error
- `503` - Service unavailable

## TypeScript Integration

Import the API types directly from the codebase:

```typescript
import type {
  TopicBuilderFormData,
  TopicGenerationRequest,
  TopicGenerationResponse,
  GeneratedTopic
} from "@/types/topic-builder";

import type {
  BackendTopicGenerationPayload
} from "@/types/backend";
```

## Testing

Example test using the API:

```typescript
import { TopicBuilderFormDataSchema } from "@/types/schemas";

const testPayload = {
  wizardMode: "industry-first" as const,
  industry: "technology",
  content_type: "blog-post",
  purpose: ["educate-inform"],
  tone: ["professional-formal"],
  num_ideas: 3,
  timestamp: new Date().toISOString()
};

// Validate payload
const validation = TopicBuilderFormDataSchema.safeParse(testPayload);
if (!validation.success) {
  console.error("Validation failed:", validation.error);
}

// Make API call
const response = await fetch('/api/generate-topics', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`
  },
  body: JSON.stringify(testPayload)
});

const result = await response.json();
```