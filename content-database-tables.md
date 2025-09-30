# Content Database Tables Schema

## 1. **content** (16 columns)

| Column | Type | Example Value |
|--------|------|---------------|
| `id` | UUID PRIMARY KEY | `550e8400-e29b-41d4-a716-446655440000` |
| `workspace_id` | UUID NOT NULL | `789e1234-e89b-12d3-a456-426614174001` |
| `topic_id` | UUID | `123e4567-e89b-12d3-a456-426614174000` |
| `created_by_user_id` | UUID NOT NULL | `a1f4c2d3-e5b6-7a89-0c1d-2e3f4a5b6c7d` |
| `assigned_to_user_id` | UUID | `2b9c6e1f-e6db-4b4c-b8dc-0466bb70f3d2` |
| `author_id` | UUID | `4f8a9b2c-1d5e-4a7b-9c3d-567890abcdef` |
| `title` | TEXT NOT NULL | `10 AI Marketing Strategies That Drive Results in 2024` |
| `slug` | TEXT UNIQUE NOT NULL | `10-ai-marketing-strategies-drive-results-2024` |
| `body_markdown` | TEXT | `# Introduction\n\nAI marketing is transforming...` |
| `body_html` | TEXT | `<h1>Introduction</h1><p>AI marketing is...</p>` |
| `content_format` | TEXT | `Markdown` |
| `status` | TEXT | `generating` |
| `content_language` | TEXT | `English` |
| `created_at` | TIMESTAMPTZ | `2024-01-23T16:30:00Z` |
| `updated_at` | TIMESTAMPTZ | `2024-01-24T09:20:00Z` |
| `deleted_at` | TIMESTAMPTZ | `2024-01-25T10:00:00Z` |

## 2. **content_progress** (8 columns)

| Column | Type | Example Value |
|--------|------|---------------|
| `content_id` | UUID PRIMARY KEY | `550e8400-e29b-41d4-a716-446655440000` |
| `current_step` | TEXT NOT NULL | `researching` |
| `progress_percent` | INTEGER | `75` |
| `status_message` | TEXT | `Finding the best information for your article...` |
| `step_details` | JSONB | `{"sources_found": 15, "articles_analyzed": 8}` |
| `estimated_time_remaining` | INTEGER | `120` |
| `created_at` | TIMESTAMPTZ | `2024-01-23T16:30:00Z` |
| `updated_at` | TIMESTAMPTZ | `2024-01-23T16:32:15Z` |

## 3. **content_metadata** (18 columns)

| Column | Type | Example Value |
|--------|------|---------------|
| `content_id` | UUID PRIMARY KEY | `550e8400-e29b-41d4-a716-446655440000` |
| `content_summary` | TEXT | `Discover proven AI marketing strategies that increase ROI by 40%` |
| `content_type` | TEXT | `Blog Post` |
| `target_platform` | TEXT | `Website` |
| `target_industry` | TEXT | `Marketing Technology` |
| `target_audience` | TEXT[] | `["Marketing Directors", "Content Strategists", "CMOs"]` |
| `audience_size` | TEXT | `Medium` |
| `complexity_level` | TEXT | `Intermediate` |
| `content_tone` | TEXT[] | `["Professional", "Insightful", "Conversational"]` |
| `target_region` | TEXT | `North America` |
| `content_objectives` | TEXT[] | `["Educate Audience", "Drive SEO Traffic", "Generate Leads"]` |
| `source_references` | TEXT[] | `["https://hubspot.com/ai-marketing", "https://marketingland.com/trends"]` |
| `content_word_count` | INTEGER | `2847` |
| `reading_time_minutes` | INTEGER | `12` |
| `content_quality_scores` | JSONB | `{"readability": 0.85, "engagement": 0.78, "seo_relevance": 0.92}` |
| `featured_image_prompt` | TEXT | `Professional marketing team analyzing AI-powered analytics dashboard` |
| `featured_image_alt_text` | TEXT | `Marketing professionals reviewing AI analytics on computer screens` |
| `created_at` | TIMESTAMPTZ | `2024-01-23T16:30:00Z` |
| `updated_at` | TIMESTAMPTZ | `2024-01-24T09:20:00Z` |

## 4. **content_seo_data** (8 columns)

| Column | Type | Example Value |
|--------|------|---------------|
| `content_id` | UUID PRIMARY KEY | `550e8400-e29b-41d4-a716-446655440000` |
| `content_primary_keywords` | TEXT[] NOT NULL | `["AI marketing", "marketing automation", "digital strategy"]` |
| `content_secondary_keywords` | TEXT[] | `["machine learning marketing", "AI tools", "ROI optimization"]` |
| `content_meta_description` | TEXT NOT NULL | `Learn 10 proven AI marketing strategies that boost ROI by 40%. Expert tips for automation, personalization, and growth.` |
| `content_search_intent` | TEXT[] | `["Informational", "Commercial"]` |
| `content_seo_score` | FLOAT | `0.85` |
| `content_readability_score` | FLOAT | `0.72` |
| `created_at` | TIMESTAMPTZ | `2024-01-23T16:30:00Z` |
| `updated_at` | TIMESTAMPTZ | `2024-01-24T09:20:00Z` |

## 5. **content_ai_config** (13 columns)

| Column | Type | Example Value |
|--------|------|---------------|
| `content_id` | UUID PRIMARY KEY | `550e8400-e29b-41d4-a716-446655440000` |
| `ai_model` | TEXT NOT NULL | `claude-3-5-sonnet` |
| `temperature` | NUMERIC(3,2) | `0.70` |
| `max_output_tokens` | INTEGER | `4000` |
| `top_p` | NUMERIC(3,2) | `0.95` |
| `frequency_penalty` | NUMERIC(3,2) | `0.20` |
| `generation_params` | JSONB | `{"creativity": "balanced", "research_depth": "comprehensive"}` |
| `context_sources` | JSONB | `{"urls": ["example.com"], "documents": ["doc1.pdf"]}` |
| `generation_errors` | JSONB | `{"error_type": "timeout", "retry_count": 2}` |
| `generation_warnings` | JSONB | `{"warning": "Limited recent data available"}` |
| `structured_output` | JSONB | `{"sections": [{"title": "Introduction", "content": "..."}], "metadata": {...}}` |
| `generated_at` | TIMESTAMPTZ | `2024-01-23T16:35:00Z` |
| `created_at` | TIMESTAMPTZ | `2024-01-23T16:30:00Z` |

## 6. **content_review** (8 columns)

| Column | Type | Example Value |
|--------|------|---------------|
| `id` | UUID PRIMARY KEY | `123e4567-e89b-12d3-a456-426614174000` |
| `content_id` | UUID NOT NULL UNIQUE | `550e8400-e29b-41d4-a716-446655440000` |
| `content_type` | VARCHAR(50) NOT NULL | `blog` |
| `assigned_reviewers` | UUID[] | `["user-1", "user-2", "user-3"]` |
| `status` | VARCHAR(20) | `pending` |
| `created_by` | UUID NOT NULL | `a1f4c2d3-e5b6-7a89-0c1d-2e3f4a5b6c7d` |
| `created_at` | TIMESTAMP | `2024-01-23T16:30:00Z` |
| `updated_at` | TIMESTAMP | `2024-01-24T09:20:00Z` |

## 7. **content_versions** (7 columns)

| Column | Type | Example Value |
|--------|------|---------------|
| `id` | UUID PRIMARY KEY | `123e4567-e89b-12d3-a456-426614174000` |
| `content_id` | UUID NOT NULL | `550e8400-e29b-41d4-a716-446655440000` |
| `version_number` | INTEGER NOT NULL | `2` |
| `content_data` | JSONB NOT NULL | `{"title": "...", "sections": [...]}` |
| `is_current` | BOOLEAN | `true` |
| `created_at` | TIMESTAMP | `2024-01-23T16:30:00Z` |

## 8. **content_structure** (12 columns)

| Column | Type | Example Value |
|--------|------|---------------|
| `content_id` | UUID PRIMARY KEY | `550e8400-e29b-41d4-a716-446655440000` |
| `content_length` | JSONB | `{"type": "preset", "preset": "Medium"}` |
| `include_toc` | BOOLEAN | `true` |
| `include_summary` | BOOLEAN | `true` |
| `include_cta` | BOOLEAN | `true` |
| `include_key_takeaways` | BOOLEAN | `true` |
| `include_latest_info` | BOOLEAN | `true` |
| `include_examples` | BOOLEAN | `true` |
| `include_statistics` | BOOLEAN | `true` |
| `include_quotes` | BOOLEAN | `false` |
| `competitor_analysis` | BOOLEAN | `false` |
| `created_at` | TIMESTAMPTZ | `2024-01-23T16:30:00Z` |
| `updated_at` | TIMESTAMPTZ | `2024-01-24T09:20:00Z` |

## 9. **content_research_config** (7 columns)

| Column | Type | Example Value |
|--------|------|---------------|
| `content_id` | UUID PRIMARY KEY | `550e8400-e29b-41d4-a716-446655440000` |
| `research_level` | TEXT | `Comprehensive` |
| `fact_checking` | TEXT | `Standard` |
| `content_freshness` | TEXT | `Recent (6 months)` |
| `research_context` | JSONB | `{"sources_used": 15, "validation_level": "high"}` |
| `created_at` | TIMESTAMPTZ | `2024-01-23T16:30:00Z` |
| `updated_at` | TIMESTAMPTZ | `2024-01-24T09:20:00Z` |

## 10. **content_tracking** (7 columns)

| Column | Type | Example Value |
|--------|------|---------------|
| `content_id` | UUID PRIMARY KEY | `550e8400-e29b-41d4-a716-446655440000` |
| `request_id` | UUID | `req-123e4567-e89b-12d3-a456-426614174000` |
| `flow_execution_id` | UUID | `flow-789e1234-e89b-12d3-a456-426614174001` |
| `request_payload` | JSONB | `{"form_data": {...}, "user_selections": {...}}` |
| `topic_snapshot` | JSONB | `{"topic_title": "AI Marketing", "keywords": [...]}` |
| `created_at` | TIMESTAMPTZ | `2024-01-23T16:30:00Z` |
| `updated_at` | TIMESTAMPTZ | `2024-01-24T09:20:00Z` |

---

**Total: 104 columns across 10 tables**