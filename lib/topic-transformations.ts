import type { TopicData } from "@/types/data-table";
import type { GeneratedTopic } from "@/types/topic-builder";

/**
 * Transform GeneratedTopic array from API to TopicData array for DataTable display
 * Enhanced to properly map all topic fields for comprehensive UI display
 *
 * @see /docs/field-mapping-documentation.md for complete field mapping rules and transformation logic
 * @see /lib/topic-adapter-utils.ts for enhanced transformation utilities with error handling
 * @param topics - Array of GeneratedTopic objects from backend API
 * @returns Array of TopicData objects ready for DataTable consumption
 *
 * @example
 * ```typescript
 * // Basic usage (maintains backward compatibility)
 * const topics = transformTopicsForDisplay(topics);
 *
 * // For enhanced error handling and performance metrics, use:
 * import { transformTopicsForDisplayEnhanced } from '@/lib/topic-adapter-utils';
 * const result = await transformTopicsForDisplayEnhanced(topics, {
 *   autoFix: true,
 *   includeMetrics: true,
 *   continueOnError: true
 * });
 * ```
 */
export function transformTopicsForDisplay(
  topics: GeneratedTopic[],
): TopicData[] {
  if (!Array.isArray(topics)) {
    console.warn("Invalid topics data received:", topics);
    return [];
  }

  return topics.map((topic, index) => {
    // Validate required fields
    if (!topic.id || !topic.title) {
      console.warn("Topic missing required fields:", topic);
    }

    // Create enhanced description combining angle and why_it_works
    const description = createEnhancedDescription(topic);

    // Determine topic status based on multiple factors
    const status = determineTopicStatus(topic);

    // Calculate priority based on all scoring factors
    const priority = calculatePriority(topic.scores);

    // Create comprehensive category from tags and channel fit
    const category = determineCategory(topic);

    return {
      id: topic.id,
      name: topic.title,
      description,
      category,
      status,
      priority,
      source: "AI Generated",
      tags: enhanceTags(topic),
      created: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      assignee: "AI Assistant",
      estimatedEffort: calculateEstimatedEffort(topic.scores),
      // Enhanced fields for Topicspage compatibility
      score: calculateOverallScore(topic.scores),
      ranking: `#${index + 1}`,
      updated: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      author: "AI Assistant",
      contentType: inferContentType(topic.channel_fit),
    };
  });
}

/**
 * Create enhanced description combining angle and why_it_works
 */
function createEnhancedDescription(topic: GeneratedTopic): string {
  const parts: string[] = [];

  if (topic.angle) {
    parts.push(topic.angle);
  }

  if (topic.description) {
    parts.push(topic.description);
  }

  if (parts.length === 0) {
    parts.push("AI-generated topic topic");
  }

  return parts.join(" • ");
}

/**
 * Determine topic status based on multiple factors
 */
function determineTopicStatus(topic: GeneratedTopic): string {
  if (topic._isBeingSaved) return "saving";
  if (topic.is_saved || topic._optimisticSaved) return "saved";
  return "generated";
}

/**
 * Calculate priority based on all scoring factors with enhanced logic
 */
function calculatePriority(scores: GeneratedTopic["scores"]): string {
  if (!scores || typeof scores !== "object") return "medium";

  const { relevance = 0, trend_level = 0, uniqueness = 0 } = scores;

  // Weighted priority calculation - relevance is most important
  const weightedScore = relevance * 0.5 + trend_level * 0.3 + uniqueness * 0.2;

  if (weightedScore >= 0.8) return "high";
  if (weightedScore >= 0.6) return "medium";
  return "low";
}

/**
 * Determine category from tags and channel fit
 */
function determineCategory(topic: GeneratedTopic): string {
  // Primary category from first tag
  if (topic.tags && topic.tags.length > 0) {
    const primaryTag = topic.tags[0];
    // Capitalize first letter and format nicely
    return (
      primaryTag.charAt(0).toUpperCase() + primaryTag.slice(1).toLowerCase()
    );
  }

  // Fallback to channel fit if no tags
  if (topic.channel_fit && topic.channel_fit.length > 0) {
    const channel = topic.channel_fit[0];
    return `${channel.charAt(0).toUpperCase() + channel.slice(1)} Content`;
  }

  return "General";
}

/**
 * Enhance tags by combining topic tags with audience fit
 */
function enhanceTags(topic: GeneratedTopic): string[] {
  const allTags = new Set<string>();

  // Add topic tags
  if (topic.tags && Array.isArray(topic.tags)) {
    for (const tag of topic.tags) {
      allTags.add(tag);
    }
  }

  // Add channel fit as tags
  if (topic.channel_fit && Array.isArray(topic.channel_fit)) {
    for (const channel of topic.channel_fit.slice(0, 2)) {
      allTags.add(`channel:${channel}`);
    }
  }

  // Add audience fit as tags (limit to avoid clutter)
  if (topic.audience_fit && Array.isArray(topic.audience_fit)) {
    for (const audience of topic.audience_fit.slice(0, 2)) {
      allTags.add(`audience:${audience}`);
    }
  }

  return Array.from(allTags).slice(0, 8); // Limit total tags
}

/**
 * Calculate estimated effort based on topic complexity
 */
function calculateEstimatedEffort(scores: GeneratedTopic["scores"]): string {
  if (!scores || typeof scores !== "object") return "Medium";

  const { uniqueness = 0.5 } = scores;

  // Higher uniqueness = more effort required
  if (uniqueness >= 0.8) return "High";
  if (uniqueness >= 0.4) return "Medium";
  return "Low";
}

/**
 * Calculate overall score with enhanced logic
 */
function calculateOverallScore(scores: GeneratedTopic["scores"]): number {
  if (!scores || typeof scores !== "object") return 50;

  const { relevance = 0, trend_level = 0, uniqueness = 0 } = scores;

  // Weighted scoring - relevance is most important
  const weightedScore = relevance * 0.5 + trend_level * 0.3 + uniqueness * 0.2;

  return Math.round(weightedScore * 100);
}

/**
 * Infer content type from channel fit with enhanced mapping
 */
function inferContentType(channelFit: string[]): string {
  if (!channelFit || !Array.isArray(channelFit) || channelFit.length === 0) {
    return "General Content";
  }

  const primaryChannel = channelFit[0].toLowerCase();

  const channelMap: Record<string, string> = {
    blog: "Blog Post",
    social: "Social Media",
    video: "Video Content",
    youtube: "Video Content",
    email: "Newsletter",
    website: "Web Content",
    podcast: "Podcast",
    infographic: "Infographic",
    linkedin: "Professional Content",
    twitter: "Social Media",
    facebook: "Social Media",
    instagram: "Visual Content",
    tiktok: "Short Form Video",
  };

  // Find matching channel type
  for (const [key, value] of Object.entries(channelMap)) {
    if (primaryChannel.includes(key)) {
      return value;
    }
  }

  // Format the channel name as fallback
  return `${primaryChannel.charAt(0).toUpperCase() + primaryChannel.slice(1)} Content`;
}

// ============================================================================
// ENHANCED UTILITIES INTEGRATION
// ============================================================================

/**
 * Enhanced topic transformation utilities are available for advanced use cases.
 *
 * For applications requiring:
 * - Comprehensive error handling and recovery
 * - Performance metrics and optimization
 * - Batch processing with concurrency control
 * - Zod validation and type safety
 * - Auto-fix capabilities for common data issues
 *
 * Use the utilities from /lib/topic-adapter-utils.ts:
 *
 * @example
 * ```typescript
 * import {
 *   transformTopicToDisplayEnhanced,
 *   transformTopicsForDisplayEnhanced
 * } from '@/lib/topic-adapter-utils';
 *
 * // Single topic transformation with error handling
 * const result = transformTopicToDisplayEnhanced(topic, {
 *   autoFix: true,
 *   includeMetrics: true,
 *   fallbackBehavior: 'lenient'
 * });
 *
 * if (result.success && result.data) {
 *   console.log('Transformed topic:', result.data);
 *   if (result.metrics) {
 *     console.log('Processing time:', result.metrics.durationMs, 'ms');
 *   }
 * } else if (result.error) {
 *   console.error('Transformation failed:', result.error.message);
 *   console.log('Recovery actions:', result.error.recoveryActions);
 * }
 *
 * // Batch transformation with performance optimization
 * const batchResult = await transformTopicsForDisplayEnhanced(topics, {
 *   continueOnError: true,
 *   maxConcurrency: 5,
 *   includeMetrics: true,
 *   autoFix: true
 * });
 *
 * console.log(`Success: ${batchResult.data.length}/${topics.length}`);
 * console.log(`Errors: ${batchResult.errors.length}`);
 * if (batchResult.metrics) {
 *   console.log(`Throughput: ${batchResult.metrics.throughputPerSecond} items/sec`);
 * }
 * ```
 *
 * The functions in this file (transformTopicsForDisplay) maintain backward compatibility
 * and provide a simple interface for basic transformation needs.
 */
