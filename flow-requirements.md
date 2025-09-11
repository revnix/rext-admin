# Flow Requirements

## Overview

I want to create the UIs for
- Creating a Flow. It'll be a wizard-style flow with steps and questions.
- Running a Flow. It'll be a page where we can see the results of the flow.
- All Flows page. The dummy page is already there. This page is currently showing the dummy data. It should show the dummy data from an endpoint atleast. Just like ideas. That endpoint can return the dummy data which we can later replace with the real data.

Below are the requirements for the flow related functionality in detail.

## Features / Improvements in Flow
- Create Flow Page(UI/UX):
    - We need to create the UI of the create flow page. It'll be a wizard-style flow with steps and questions.
    - The questions should be asked in a sequential manner.
    - I think we should ask these questions one by one:
        <!-- Core Flow Configuration -->
        - Select Topic: topicId
        - Select Project: projectId. If enabled, user should be able to select a project from the dropdown.
        - Select Platform: platform. Options: Website, Social Media. This should be pre-filled based on the topic's meta data but user can always override it.
        - Industry: industry. This should be pre-filled based on the topic's meta data but user can always override it.
        <!-- if platform is Social Media -->
        - Select Content Type: contentType. Options: Thread, Carousel, Post, Poll, Video Script. Content Type options should be based on the Platform. 
        - Flow Name: flowName. This can be auto generated based on the Project, Platform, Content Type and Topic Title. Example: "Thread - Topic Title - Project Name". User can always override the auto generated name.
        <!-- Audience and Goals -->
        - Audience Size: audienceSize. Options: Small, Medium, Large, Massive
        - Audience Type: audienceType. Options: Array of audience type values from existing AudienceType. Example: Consumers, Businesses, Enterprises, Students, Professionals, Seniors, Teens, Parents. This should be based on the Industry.
        - Reading Level: readingLevel. Options: Array of reading level values from existing ReadingLevelType. Example: Beginner, Intermediate, Advanced.
        - Goals/Purpose: goals. Options: Array of goals/purpose values. Example: Educate, Entertain, Inspire, Persuade, Promote, Drive SEO, Thought Leadership.
        <!-- Localse & Voice -->
        - Tone: tone. Options: Array of tone values. Example: Professional, Casual, Friendly, Humorous, Serious, Technical, Simple, Inspirational.
        - Region: region. Options: Array of region values. Example: International/Global or Options to choose a country from the dropdown.
        - Language: language. Options: English only for now.







        <!-- SEO & Structure -->
        - Primary Keywords: primaryKeywords. Options: Array of primary keywords.
        - Secondary Keywords: secondaryKeywords. Options: Array of secondary keywords.
        - Search Intent: searchIntent. Options: Array of search intent values. Example: Informational, Navigational, Transactional, Commercial.
        - Content Length: contentLength. Options should be based on the Content Type. Example: Thread - 280 characters, Carousel - 1000 characters, Post - 1000 characters. Also give an option for Custom (user can specify the length)

        - Include TOC: includeTOC. Options: Yes, No. Explanation: If enabled, we'll include a table of contents in the content.
        - Include Summary: includeSummary. Options: Yes, No. Explanation: If enabled, we'll include a summary in the content.
        - Inlcude Key Takeaways: includeKeyTakeaways. Options: Yes, No. Explanation: If enabled, we'll include a key takeaways section in the content.

        - Include CTA Block: includeCTABlock. Options: Yes, No. Explanation: If enabled, we'll include a call to action block in the content.



        <!-- AI Model Configuration -->
        - Select AI Model: aiModel. Options: OpenAI, Anthropic, Google etc
        - Temperature: temperature. Options: 0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0. Explanation: Temperature is a parameter that controls the randomness of the content.
        - Top P: topP. Options: 0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0. Explanation: Top P is a parameter that controls the diversity of the content.
        - Max Output Tokens: maxOutputTokens. Explanation: Max number of tokens to generate. Example: 1000.
        - Frequency Penalty: frequencyPenalty. Explanation: Frequency Penalty is a parameter that controls the frequency of the content.
        - Streaming: streaming. Options: Yes, No. Explanation: If enabled, we'll stream the content.



        <!-- Research & RAG Settings -->
        - enableSimilarArticles: boolean. Options: Yes, No. Explanation: If enabled, we'll fetch similar articles from the internet and use them to generate the content.
        - maxSimilarArticles: number. Options: 1, 2, 3, 4, 5. Explanation: If enabled, we'll fetch the specified number of similar articles from the internet and use them to generate the content.
        - researchDepth: number. Options: Basic, Comprehensive.
        - includeCompetitorAnalysis: boolean. Options: Yes, No
        - Search Query Seeds: searchQuerySeeds. Options: Array of search query seeds. Example: "AI, Content Generation, Flows, RAG, Research, Similar Articles, Competitor Analysis".
        - Retrieval_K: retrievalK. Options: TopN e.g 10. Explanation: We'll fetch the top N similar articles from the internet and use them to generate the content. Example: 10.
        - Date Range: dateRange. Options: Array of date range values. Example: 6M, 1Y, 2Y, 5Y, All Time.
        - Sources Allowed: sourcesAllowed. Options: Array of sources allowed values. Example: Website, Blog, News, Social Media, YouTube, etc.
        - Sources Blocked: sourcesBlocked. Options: Array of sources blocked values. Example: Website, Blog, News, Social Media, YouTube, etc.
        - Include PDFs: includePDFs. Options: Yes, No. Explanation: If enabled, we'll include the PDFs in the content.
        - Include News: includeNews. Options: Yes, No. Explanation: If enabled, we'll include the news in the content.
        - Max Reference Token: max_reference_token. Explanation: Cap for Context Length. Example: 10000.

        <!-- Originality & Safety -->
        - Require Citations for Claims: requireCitationsForClaims. Options: Yes, No. Explanation: If enabled, we'll require citations for claims in the content.
        - Disallow Unverifiable Claims: disallowUnverifiableClaims. Options: Yes, No. Explanation: If enabled, we'll disallow unverifiable claims in the content.
        - Paraphrase Pass: paraphrasePass. Options: Yes, No. Explanation: If enabled, we'll paraphrase the content.
        - Similarity Rewrite Threshold: similarityRewriteThreshold. Options: 0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0. Explanation: Similarity Rewrite Threshold is a parameter that controls the similarity of the content.
        - Source Attribution Required: sourceAttributionRequired. Options: Yes, No. Explanation: If enabled, we'll require source attribution in the content.


        <!-- Output -->
        - format: format. Options: Text, HTML, Markdown, JSON
        - Include Front Matter: includeFrontMatter. Options: Yes, No. Explanation: If enabled, we'll include the front matter in the content. Front Matter is the metadata at the beginning of the content.
        - Front Matter Fields (Record<string, string>): frontMatterFields. Explanation: Front Matter Fields is a parameter that controls the fields in the front matter. Example: {"title": "Title", "description": "Description", "keywords": "Keywords", "author": "Author", "date": "Date", "category": "Category", "tags": "Tags", "image": "Image", "url": "URL", "source": "Source", "source_url": "Source URL", "source_date": "Source Date", "source_author": "Source Author", "source_title": "Source Title", "source_description": "Source Description", "source_keywords": "Source Keywords", "source_image": "Source Image", "source_url": "Source URL", "source_date": "Source Date", "source_author": "Source Author", "source_title": "Source Title", "source_description": "Source Description", "source_keywords": "Source Keywords", "source_image": "Source Image"}.
    


        <!-- Humans in Loop -->
        - enableHumansInTheLoop: boolean. Options: Yes, No. Explanation: If enabled, we'll ask the user to review the content and generate the content.
        - humanReviewers: multi-select. Options: Array of human reviewers. If enabled, when we'll run the flow,we'll stop the flow on certain points and ask the user to review and based on their feedback, we'll continue the flow.
    - When all the questions are answered, we should show these buttons:
        - Save Flow
        - Save & Run Flow
        - Cancel
    - When we click on Save Flow, we should save the flow to the database with the status as not started.
    - When we click on Save & Run Flow, we should save the flow to the database with the status as started/running and then run the flow.
    - When we click on Cancel, we should go back to the all flows page.
    - We should show a success message in sonner when the flow is created/saved.
    - We should show a error message in sonner when the flow is not created/saved.
    - We should add the notification entry in the notification sidebar/drawer if the flow ran successfully or failed.
    - If the humans are not involved in the flow, we should save the generated content to the content database which should show on /content page table with the status as generated.
    - If the humans are involved in the flow, we should wait for their feedback and if they approve then we should continue the flow and generate the content accordingly.



- Suggested Steps:
    - Select Project
    - Pick Topic
    - Audience & Objectives
    - Local & Voice
    - SEO & Structure
    - Retrieval Setup
    - Model & Generation
    - Originality & Safety
    - Preview & Confirm
    - Generate & Post-Run


- Run Flow Page / Flow Details Page (UI/UX):
For flow execution monitoring, we should simplify and abstract the LangGraph
  details for the frontend while still providing meaningful progress updates. Here's what we
  recommend:
What Users Should See (Simplified Progress)

  High-Level Flow Stages

  interface FlowExecutionStage {
    id: string;
    name: string;
    status: "pending" | "running" | "completed" | "failed";
    startTime?: string;
    endTime?: string;
    progress?: number; // 0-100
  }

  const FLOW_STAGES = [
    { id: "initialization", name: "Initializing Flow", description: "Setting up generation 
  parameters" },
    { id: "context_loading", name: "Loading Context", description: "Fetching project memories and 
  topic data" },
    { id: "research", name: "Researching Similar Content", description: "Finding and analyzing top 10
   similar articles" },
    { id: "outline", name: "Creating Outline", description: "Generating content structure and key 
  points" },
    { id: "generation", name: "Generating Content", description: "Creating the main content using 
  selected AI model" },
    { id: "enhancement", name: "Enhancing Content", description: "Adding research insights and 
  polishing" },
    { id: "quality_check", name: "Quality Review", description: "Checking for AI patterns and 
  human-like flow" },
    { id: "finalization", name: "Finalizing", description: "Preparing final output and saving to 
  project memories" }
  ];

  Live Update Interface Design

  1. Progress Bar with Current Stage

  [████████████████████░░░░] 75% - Generating Content
  Estimated time remaining: 2 minutes

  2. Stage List with Status Icons

  ✅ Initializing Flow (completed in 2s)
  ✅ Loading Context (completed in 5s)
  ✅ Researching Similar Content (completed in 45s)
  ⚡ Generating Content (running... 1m 30s)
  ⏳ Enhancing Content (pending)
  ⏳ Quality Review (pending)
  ⏳ Finalizing (pending)

  3. Expandable Stage Details

  Each stage could expand to show:
  - Context Loading: "Loaded 15 project memories, 3 knowledge files"
  - Research: "Found 10 similar articles from domain experts"
  - Generation: "Using GPT-4 with temperature 0.7, generating 1200 words"

  Backend-Frontend Data Flow

  What Backend Should Send

  interface FlowExecutionUpdate {
    flowId: string;
    currentStage: string;
    overallProgress: number;
    stageProgress: number;
    estimatedTimeRemaining: number;

    // Stage-specific data
    stageData?: {
      // Research stage
      articlesFound?: number;
      researchSources?: string[];

      // Generation stage
      wordsGenerated?: number;
      targetWordCount?: number;

      // Quality stage
      qualityScore?: number;
      aiDetectionScore?: number;
    };

    // Error handling
    error?: {
      stage: string;
      message: string;
      retryable: boolean;
    };
  }

  What NOT to Show Users

  Hide These LangGraph Implementation Details:

  - ❌ Node names like "research_agent", "content_generator_node"
  - ❌ Internal state transitions and routing logic
  - ❌ Raw LLM API calls and token counts
  - ❌ Memory vector operations and embedding processes
  - ❌ Internal retry mechanisms and fallback strategies
  - ❌ Database queries and caching operations

  Show Simplified Equivalents Instead:

  - ✅ "Researching similar content" instead of "Executing research_agent_node"
  - ✅ "Using GPT-4" instead of "Calling OpenAI API with 4096 tokens"
  - ✅ "Enhancing with research insights" instead of "Vector similarity search completed"

  Advanced Monitoring Features

  For Power Users (Optional Toggle)

  interface DetailedExecutionLog {
    timestamp: string;
    level: "info" | "warning" | "error";
    stage: string;
    message: string;
    metadata?: Record<string, any>;
  }

  // Example detailed logs
  [
    { timestamp: "2025-01-10T14:30:15Z", level: "info", stage: "research", message: "Retrieved 10 
  articles with avg relevance score 0.85" },
    { timestamp: "2025-01-10T14:30:45Z", level: "info", stage: "generation", message: "Generated 1200
   words using GPT-4-turbo" },
    { timestamp: "2025-01-10T14:31:20Z", level: "warning", stage: "quality", message: "AI detection 
  score: 0.3 (acceptable)" }
  ]

  Real-Time Updates Implementation

  WebSocket/SSE Structure

  // What to send via WebSocket
  interface FlowStreamUpdate {
    type: "stage_started" | "stage_progress" | "stage_completed" | "flow_completed" | "flow_failed";
    flowId: string;
    data: FlowExecutionUpdate;
  }

  UI State Management

  interface FlowMonitoringState {
    isStreaming: boolean;
    currentExecution?: FlowExecutionUpdate;
    executionHistory: FlowExecutionUpdate[];
    showDetailedLogs: boolean; // Toggle for advanced users
  }

  Recommended UI Components

  1. FlowProgressCard: Overall progress and current stage
  2. StageTimeline: Visual timeline of all stages
  3. LiveLogFeed: Optional detailed logs for debugging
  4. ExecutionMetrics: Performance stats and quality scores
  5. ErrorPanel: User-friendly error messages with retry options

  This approach gives users meaningful progress updates without overwhelming them with technical
  LangGraph internals, while still providing enough detail to understand what's happening and debug
  issues when needed.
