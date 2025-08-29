"use client";

import {
  BookOpen,
  Copy,
  Edit2,
  Eye,
  FileText,
  Hash,
  MessageSquare,
  Play,
  Plus,
  Star,
  Tag,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { PageLayout } from "@/components/page-layout";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";

export default function PromptTemplatesPage() {
  const breadcrumbs = [
    { label: "Configuration", href: "#" },
    { label: "AI & Prompts", href: "/ai-prompts" },
    { label: "Prompt Templates" },
  ];

  // Comprehensive prompt templates data
  const promptTemplatesData = [
    {
      id: "1",
      name: "Blog Post SEO Content Writer",
      category: "Content Creation",
      subcategory: "Blog Posts",
      status: "Active",
      visibility: "Public",
      usage: 247,
      successRate: "94%",
      avgRating: 4.8,
      lastUsed: "2024-01-22 15:30",
      template: `You are an expert content writer specializing in SEO-optimized blog posts. Write a comprehensive, engaging blog post about {topic}.

Requirements:
- Target keyword: {primary_keyword}
- Word count: {word_count} words
- Tone: {tone}
- Target audience: {target_audience}

Structure:
1. Compelling headline with primary keyword
2. Hook-filled introduction
3. 5-7 main sections with H2/H3 headers
4. Include relevant statistics and examples
5. Strong conclusion with CTA

SEO Guidelines:
- Use primary keyword naturally 5-8 times
- Include 3-5 related keywords: {related_keywords}
- Optimize for featured snippets
- Meta description under 160 characters`,
      variables: ["topic", "primary_keyword", "word_count", "tone", "target_audience", "related_keywords"],
      tags: ["SEO", "Blog", "Content Marketing", "Long-form"],
      description: "Generates SEO-optimized blog posts with proper structure and keyword optimization",
      createdBy: "Sarah Johnson",
      lastModified: "2024-01-20 14:20",
      created: "2024-01-01 09:00",
      flows: ["AI Blog Post Generator", "SEO Content Pipeline"],
      modelCompatibility: ["GPT-4", "Claude-3", "GPT-3.5"],
      estimatedTokens: "750-1000",
    },
    {
      id: "2",
      name: "Social Media Carousel Creator",
      category: "Social Media",
      subcategory: "LinkedIn",
      status: "Active", 
      visibility: "Public",
      usage: 156,
      successRate: "91%",
      avgRating: 4.6,
      lastUsed: "2024-01-22 14:45",
      template: `Create an engaging LinkedIn carousel post about {topic} for {target_audience}.

Format: 5-7 slides with compelling visuals and copy

Slide 1 (Hook):
- Eye-catching title: {main_title}
- Problem/question that grabs attention
- Promise of value

Slides 2-6 (Content):
- Each slide focuses on one key point
- Use bullet points, numbers, or short paragraphs
- Include relevant data/statistics
- Keep text concise (max 50 words per slide)

Final Slide (CTA):
- Summarize key takeaways
- Clear call-to-action
- Engagement prompt (comment/share request)

Style Guidelines:
- Professional yet conversational tone
- Use emojis strategically (2-3 per slide)
- Include relevant hashtags: {hashtags}
- Optimize for mobile viewing`,
      variables: ["topic", "target_audience", "main_title", "hashtags"],
      tags: ["LinkedIn", "Carousel", "B2B", "Visual Content"],
      description: "Creates structured LinkedIn carousel posts with engaging copy and clear CTAs",
      createdBy: "Mike Chen",
      lastModified: "2024-01-18 11:30",
      created: "2023-12-10 16:45",
      flows: ["Social Media Content Pipeline", "LinkedIn Marketing"],
      modelCompatibility: ["GPT-4", "Claude-3"],
      estimatedTokens: "400-600",
    },
    {
      id: "3",
      name: "Product Description Optimizer",
      category: "E-commerce",
      subcategory: "Product Copy",
      status: "Active",
      visibility: "Private",
      usage: 89,
      successRate: "96%",
      avgRating: 4.9,
      lastUsed: "2024-01-22 16:20",
      template: `Write a compelling product description for {product_name} that converts browsers into buyers.

Product Details:
- Product: {product_name}
- Category: {product_category}
- Key Features: {key_features}
- Target Customer: {target_customer}
- Price Point: {price_range}

Structure:
1. Headline (Benefit-driven, includes main keyword)
2. Problem/Pain Point (What customer struggles with)
3. Solution Presentation (How your product solves it)
4. Key Features & Benefits (3-5 most important)
5. Social Proof/Trust Signals
6. Urgency/Scarcity (if applicable)
7. Clear CTA

Writing Guidelines:
- Focus on benefits, not just features
- Use power words and emotional triggers
- Address objections proactively
- Include keywords: {seo_keywords}
- Keep paragraphs short (2-3 sentences max)
- Use bullet points for features
- Maintain {brand_voice} brand voice`,
      variables: ["product_name", "product_category", "key_features", "target_customer", "price_range", "seo_keywords", "brand_voice"],
      tags: ["E-commerce", "Product Copy", "Conversion", "Sales"],
      description: "Generates high-converting product descriptions optimized for sales and SEO",
      createdBy: "Emma Davis",
      lastModified: "2024-01-22 10:15",
      created: "2023-10-15 13:20",
      flows: ["Product Description Generator", "E-commerce Content"],
      modelCompatibility: ["GPT-4", "Claude-3", "GPT-3.5"],
      estimatedTokens: "300-500",
    },
    {
      id: "4",
      name: "Email Newsletter Curator",
      category: "Email Marketing",
      subcategory: "Newsletter",
      status: "Active",
      visibility: "Public",
      usage: 203,
      successRate: "88%",
      avgRating: 4.4,
      lastUsed: "2024-01-22 08:00",
      template: `Create a weekly newsletter for {audience_type} featuring {topic_focus}.

Newsletter Structure:

📧 Subject Line:
- Create 3 compelling subject line options
- Include {primary_focus} theme
- Keep under 50 characters
- A/B test worthy

🎯 Opening:
- Personal greeting
- Brief context/hook about this week's theme
- What subscribers will learn/gain

📰 Main Content (3-4 sections):

Section 1: {main_story_type}
- Feature story or trending topic
- Include key insights and takeaways
- Add relevant data/statistics

Section 2: Quick Hits
- 3-4 brief industry updates
- Bullet format for easy scanning
- Link to sources where appropriate

Section 3: {feature_section}
- Tool/resource recommendation
- How-to tip or tutorial
- Community spotlight or case study

🔗 Call-to-Action:
- Primary CTA: {main_cta}
- Secondary: Social sharing/reply prompt

✨ Closing:
- Personal sign-off
- Teaser for next week
- Unsubscribe reminder (friendly tone)

Tone: {newsletter_tone}
Length: {target_length} words`,
      variables: ["audience_type", "topic_focus", "primary_focus", "main_story_type", "feature_section", "main_cta", "newsletter_tone", "target_length"],
      tags: ["Email", "Newsletter", "Content Curation", "Marketing"],
      description: "Creates structured weekly newsletters with curated content and clear CTAs",
      createdBy: "Alex Rivera",
      lastModified: "2024-01-21 07:30",
      created: "2023-11-20 09:45",
      flows: ["Newsletter Content Creator", "Email Marketing"],
      modelCompatibility: ["GPT-4", "Claude-3", "GPT-3.5"],
      estimatedTokens: "600-900",
    },
    {
      id: "5",
      name: "Twitter Thread Storyteller",
      category: "Social Media",
      subcategory: "Twitter",
      status: "Active",
      visibility: "Public",
      usage: 134,
      successRate: "92%",
      avgRating: 4.7,
      lastUsed: "2024-01-22 13:45",
      template: `Create an engaging Twitter thread about {thread_topic} for {target_audience}.

Thread Structure (10-15 tweets):

🧵 Tweet 1 (Hook):
"🧵 Thread: {hook_statement} 

Why this matters to {audience_segment} (1/X)"

Tweets 2-3 (Problem/Context):
- Set up the situation/problem
- Why it's relevant now
- Personal anecdote or data point

Tweets 4-8 (Main Content):
- Core insights/lessons learned
- Each tweet = one key point
- Use numbers, bullets, or frameworks
- Include relevant examples

Tweets 9-12 (Deep Dive):
- Actionable advice/steps
- Specific tactics readers can apply
- Tools/resources mentioned

Final Tweets (Conclusion + CTA):
- Summarize key takeaways
- Call-to-action (follow, retweet, comment)
- Thread recap/bookmark reminder

Writing Guidelines:
- Each tweet max 280 characters
- Use line breaks for readability
- Include 2-3 relevant hashtags: {hashtags}
- Thread should be {thread_length} tweets total
- Maintain {voice_tone} voice throughout
- Include one compelling statistic/fact per 3-4 tweets`,
      variables: ["thread_topic", "target_audience", "hook_statement", "audience_segment", "hashtags", "thread_length", "voice_tone"],
      tags: ["Twitter", "Thread", "Storytelling", "Engagement"],
      description: "Creates structured Twitter threads with strong hooks and clear narrative flow",
      createdBy: "David Park",
      lastModified: "2024-01-19 16:20",
      created: "2023-12-05 12:30",
      flows: ["Social Media Content Pipeline", "Twitter Marketing"],
      modelCompatibility: ["GPT-4", "Claude-3"],
      estimatedTokens: "500-750",
    },
    {
      id: "6",
      name: "Video Script Template",
      category: "Video Content",
      subcategory: "YouTube",
      status: "Draft",
      visibility: "Private",
      usage: 45,
      successRate: "89%",
      avgRating: 4.3,
      lastUsed: "2024-01-20 14:15",
      template: `Create a {video_length}-minute YouTube video script about {video_topic} for {target_viewers}.

[INTRO - 0:00-0:30]
Hook: Start with compelling question/statement about {main_problem}
Preview: "In this video, you'll learn..."
- Key benefit #1
- Key benefit #2  
- Key benefit #3
Channel intro/branding

[MAIN CONTENT - 0:30-{main_content_end}]
Section 1: Problem Setup ({problem_section_length})
- Define the problem clearly
- Why it matters to viewers
- Common misconceptions

Section 2: Solution Framework ({solution_section_length})
- Introduce your method/approach
- Why this works better
- Preview the steps

Section 3: Step-by-Step Guide ({guide_section_length})
- Step 1: {step_1_focus}
- Step 2: {step_2_focus}
- Step 3: {step_3_focus}
(Include examples, visuals cues, screen recordings)

[CONCLUSION - Last 1-2 minutes]
- Recap key points
- Results viewers can expect
- Clear call-to-action: {main_cta}
- End screen suggestions

Production Notes:
- Tone: {video_tone}
- Include B-roll cues: [SHOW: example screenshot]
- Music cues: [MUSIC: upbeat/calm]
- Text overlays: [TEXT: Key Point]`,
      variables: ["video_length", "video_topic", "target_viewers", "main_problem", "main_content_end", "problem_section_length", "solution_section_length", "guide_section_length", "step_1_focus", "step_2_focus", "step_3_focus", "main_cta", "video_tone"],
      tags: ["YouTube", "Video Script", "Education", "Tutorial"],
      description: "Creates structured YouTube video scripts with clear segments and production notes",
      createdBy: "Lisa Wong",
      lastModified: "2024-01-20 14:15",
      created: "2024-01-15 11:00",
      flows: ["YouTube Script Writer", "Video Content"],
      modelCompatibility: ["GPT-4", "Claude-3"],
      estimatedTokens: "800-1200",
    },
    {
      id: "7",
      name: "Press Release Builder",
      category: "Public Relations",
      subcategory: "Announcements",
      status: "Active",
      visibility: "Private",
      usage: 23,
      successRate: "95%",
      avgRating: 4.8,
      lastUsed: "2024-01-22 10:00",
      template: `Write a professional press release for {announcement_type} by {company_name}.

[HEADER]
FOR IMMEDIATE RELEASE
{company_name} Media Contact:
{contact_name} | {contact_email} | {contact_phone}

[HEADLINE]
{company_name} {main_announcement}
(Subheadline: {additional_context})

[DATELINE]
{city, state} – {current_date} – 

[LEAD PARAGRAPH]
{company_name}, {company_description}, today announced {key_announcement}. This {significance_statement} will {impact_statement} for {target_beneficiaries}.

[BODY PARAGRAPHS]

Paragraph 2: Details & Context
- What exactly is being announced
- Why it matters now
- Key features/benefits
- Market context/timing

Paragraph 3: Executive Quote
"{executive_quote}" said {executive_name}, {executive_title} at {company_name}. "{additional_executive_insight}"

Paragraph 4: Supporting Details
- Technical specifications (if applicable)
- Availability/timeline information
- Pricing details (if relevant)
- Implementation details

Paragraph 5: Industry Impact/Third-Party Quote (if applicable)
"{industry_expert_quote}" said {expert_name}, {expert_title} at {expert_organization}.

[COMPANY BOILERPLATE]
About {company_name}:
{company_boilerplate_description}

[MEDIA CONTACT]
For more information, contact:
{media_contact_info}

###

Writing Guidelines:
- Follow AP Style
- Third-person perspective
- Include key stats/numbers: {key_statistics}
- Optimize for keywords: {pr_keywords}
- Keep paragraphs 2-3 sentences max`,
      variables: ["announcement_type", "company_name", "contact_name", "contact_email", "contact_phone", "main_announcement", "additional_context", "city", "company_description", "key_announcement", "significance_statement", "impact_statement", "target_beneficiaries", "executive_quote", "executive_name", "executive_title", "additional_executive_insight", "industry_expert_quote", "expert_name", "expert_title", "expert_organization", "company_boilerplate_description", "media_contact_info", "key_statistics", "pr_keywords"],
      tags: ["Press Release", "PR", "Corporate Communications", "Media"],
      description: "Generates AP Style press releases with proper formatting and industry standards",
      createdBy: "Marcus Johnson",
      lastModified: "2024-01-18 15:45",
      created: "2024-01-05 09:20",
      flows: ["Press Release Automation", "Corporate Communications"],
      modelCompatibility: ["GPT-4", "Claude-3"],
      estimatedTokens: "600-900",
    },
    {
      id: "8",
      name: "Customer Support Response",
      category: "Customer Service",
      subcategory: "Support Tickets",
      status: "Active",
      visibility: "Private",
      usage: 312,
      successRate: "87%",
      avgRating: 4.2,
      lastUsed: "2024-01-22 16:45",
      template: `Generate a helpful customer support response for the following inquiry.

Customer Details:
- Name: {customer_name}
- Issue Type: {issue_category}
- Priority Level: {priority_level}
- Previous Interactions: {interaction_history}

Customer Message:
"{customer_inquiry}"

Response Guidelines:

1. Greeting & Acknowledgment:
- Thank customer for contacting us
- Acknowledge their specific concern
- Show empathy if frustration is evident

2. Solution/Next Steps:
- Provide clear, step-by-step solution if available
- If complex issue: break into manageable steps
- If escalation needed: explain process transparently
- Include relevant resources/links: {help_resources}

3. Additional Support:
- Offer alternative solutions if applicable
- Proactive suggestions to prevent future issues
- Contact information for further assistance

4. Professional Closing:
- Summarize key action items
- Set appropriate expectations for resolution time
- Invite further questions
- Thank them for their business

Brand Voice Guidelines:
- Tone: {support_tone} (Professional, Friendly, Helpful)
- Company values: {company_values}
- Avoid: Technical jargon, dismissive language
- Include: Specific product knowledge, personalization

Compliance:
- Follow company policy: {policy_guidelines}
- Include required disclaimers if applicable
- Maintain data privacy standards`,
      variables: ["customer_name", "issue_category", "priority_level", "interaction_history", "customer_inquiry", "help_resources", "support_tone", "company_values", "policy_guidelines"],
      tags: ["Customer Support", "Service", "Communication", "Problem Solving"],
      description: "Creates empathetic and helpful customer support responses following company guidelines",
      createdBy: "Jennifer Taylor",
      lastModified: "2024-01-21 13:20",
      created: "2023-07-15 10:30",
      flows: ["Customer Support Automation", "Service Desk"],
      modelCompatibility: ["GPT-4", "Claude-3", "GPT-3.5"],
      estimatedTokens: "400-700",
    }
  ];

  const columns = [
    { key: "name", header: "Template Name", width: "280px" },
    { key: "category", header: "Category", width: "150px" },
    { key: "status", header: "Status", width: "100px" },
    { key: "usage", header: "Usage", width: "100px" },
    { key: "avgRating", header: "Rating", width: "100px" },
    { key: "createdBy", header: "Created By", width: "130px" },
    { key: "created", header: "Created", width: "120px" },
  ];

  const emptyActions = [
    { label: "Create Template", icon: <Plus className="h-4 w-4" />, href: "/prompt-templates/create" },
  ];

  const tableActions = (
    <Button>
      <Plus className="h-4 w-4 mr-2" />
      Create Template
    </Button>
  );

  // Row click handler
  const handleRowClick = (row: Record<string, any>) => {
    console.log("Viewing template:", row.name);
    // In a real app, you'd navigate to `/prompt-templates/${row.id}`
  };

  // Custom row actions specific to prompt templates
  const rowActions = [
    {
      label: "View Template",
      icon: <Eye className="h-4 w-4" />,
      onClick: (row: Record<string, any>) => console.log("View template:", row.name),
    },
    {
      label: "Test Template",
      icon: <Play className="h-4 w-4" />,
      onClick: (row: Record<string, any>) => console.log("Test template:", row.name),
    },
    {
      label: "Duplicate Template",
      icon: <Copy className="h-4 w-4" />,
      onClick: (row: Record<string, any>) => console.log("Duplicate template:", row.name),
    },
    {
      label: "View Analytics",
      icon: <TrendingUp className="h-4 w-4" />,
      onClick: (row: Record<string, any>) => console.log("View analytics:", row.name),
    },
    {
      label: "Add to Favorites",
      icon: <Star className="h-4 w-4" />,
      onClick: (row: Record<string, any>) => console.log("Favorite template:", row.name),
    },
    {
      label: "Edit Template",
      icon: <Edit2 className="h-4 w-4" />,
      onClick: (row: Record<string, any>) => console.log("Edit template:", row.name),
    },
    {
      label: "Export Template",
      icon: <FileText className="h-4 w-4" />,
      onClick: (row: Record<string, any>) => console.log("Export template:", row.name),
    },
    {
      label: "Delete Template",
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (row: Record<string, any>) => console.log("Delete template:", row.name),
      variant: "destructive" as const,
    },
  ];

  return (
    <PageLayout
      title="Prompt Templates"
      description="Create, manage, and optimize AI prompt templates for consistent and effective interactions."
      breadcrumbs={breadcrumbs}
    >
      <DataTable
        columns={columns}
        data={promptTemplatesData}
        emptyTitle="No prompt templates created"
        emptyDescription="Build your first prompt template to improve AI interaction consistency and effectiveness."
        emptyActions={emptyActions}
        emptyIcon={<MessageSquare className="h-8 w-8 text-muted-foreground" />}
        searchPlaceholder="Search templates by name, category, creator..."
        actions={tableActions}
        onRowClick={handleRowClick}
        rowActions={rowActions}
        pageSize={10}
        searchFields={["name", "category", "status", "createdBy", "tags"]}
      />
    </PageLayout>
  );
}
