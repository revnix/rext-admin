import { type NextRequest, NextResponse } from "next/server";

// Mock API endpoint for testing the topic generation loading screen
export async function POST(request: NextRequest) {
  try {
    const formData = await request.json();

    // Simulate AI processing time (8-12 seconds to test the loading screen)
    const processingTime = Math.random() * 4000 + 8000; // 8-12 seconds
    await new Promise((resolve) => setTimeout(resolve, processingTime));

    // Mock generated topics based on the form data
    const mockTopics = [
      {
        id: "topic_1",
        title: `${formData.industry} Content Strategy: A Beginner's Guide`,
        angle:
          "Comprehensive introduction covering fundamentals and practical steps",
        description: `Learn the essential strategies for creating effective ${formData.industry.toLowerCase()} content`,
        channel_fit: formData.platform
          ? [formData.platform]
          : ["blog", "social"],
        audience_fit: Array.isArray(formData.audience)
          ? formData.audience
          : [formData.audience || "general"],
        why_it_works:
          "Addresses a common knowledge gap with actionable insights",
        scores: {
          relevance: 0.92,
          freshness: 0.78,
          novelty: 0.65,
        },
        tags: ["beginner", "strategy", formData.industry.toLowerCase()],
        is_saved: false,
      },
      {
        id: "topic_2",
        title: `Top 10 ${formData.industry} Trends to Watch This Year`,
        angle: "Forward-looking analysis of emerging industry developments",
        description: `Stay ahead with the latest trends shaping the ${formData.industry.toLowerCase()} landscape`,
        channel_fit: ["blog", "social", "newsletter"],
        audience_fit: Array.isArray(formData.audience)
          ? formData.audience
          : [formData.audience || "professionals"],
        why_it_works:
          "Trending content that provides valuable industry insights",
        scores: {
          relevance: 0.88,
          freshness: 0.94,
          novelty: 0.72,
        },
        tags: ["trends", "analysis", formData.industry.toLowerCase()],
        is_saved: false,
      },
      {
        id: "topic_3",
        title: `Common ${formData.industry} Mistakes and How to Avoid Them`,
        angle: "Problem-solving approach with practical solutions",
        description: `Identify and overcome the most frequent challenges in ${formData.industry.toLowerCase()}`,
        channel_fit: ["blog", "video", "podcast"],
        audience_fit: Array.isArray(formData.audience)
          ? formData.audience
          : [formData.audience || "beginners"],
        why_it_works: "Addresses pain points with actionable solutions",
        scores: {
          relevance: 0.85,
          freshness: 0.67,
          novelty: 0.58,
        },
        tags: ["mistakes", "solutions", formData.industry.toLowerCase()],
        is_saved: false,
      },
      {
        id: "topic_4",
        title: `${formData.industry} Success Stories: What We Can Learn`,
        angle: "Case study approach with real-world examples",
        description: `Analyze successful ${formData.industry.toLowerCase()} examples and extract key lessons`,
        channel_fit: ["blog", "social", "video"],
        audience_fit: Array.isArray(formData.audience)
          ? formData.audience
          : [formData.audience || "professionals"],
        why_it_works: "People love success stories and learning from examples",
        scores: {
          relevance: 0.9,
          freshness: 0.71,
          novelty: 0.69,
        },
        tags: ["case-study", "success", formData.industry.toLowerCase()],
        is_saved: false,
      },
      {
        id: "topic_5",
        title: `The Future of ${formData.industry}: Predictions and Insights`,
        angle: "Forward-thinking analysis with expert predictions",
        description: `Explore where ${formData.industry.toLowerCase()} is heading and what it means for you`,
        channel_fit: ["blog", "podcast", "social"],
        audience_fit: Array.isArray(formData.audience)
          ? formData.audience
          : [formData.audience || "thought-leaders"],
        why_it_works: "Future-focused content generates engagement and shares",
        scores: {
          relevance: 0.87,
          freshness: 0.89,
          novelty: 0.84,
        },
        tags: ["future", "predictions", formData.industry.toLowerCase()],
        is_saved: false,
      },
    ];

    // Generate the requested number of topics
    const numIdeas = Math.min(formData.num_ideas || 5, mockTopics.length);
    const selectedTopics = mockTopics.slice(0, numIdeas);

    return NextResponse.json({
      topics: selectedTopics,
      request_id: `req_${Date.now()}`,
      generated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Topic generation failed:", error);
    return NextResponse.json(
      { error: "Failed to generate topics. Please try again." },
      { status: 500 },
    );
  }
}
