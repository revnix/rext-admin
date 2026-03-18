/**
 * Tools API Namespace
 *
 * Centralized client for platform-level SEO and content assistance tools.
 * All methods use the rigid SDK types for end-to-end safety.
 */

import type {
  SuccessResponseTextMetricsOutput,
  SuccessResponseMetaDescriptionResponse,
  SuccessResponseDict,
  SuccessResponseReadabilityResponse,
  SuccessResponseCanonicalTagResponse,
  SuccessResponseQuestionResponse,
  SuccessResponseBrokenLinkResponse,
  SuccessResponseIdeaGeneratorResponse,
  SuccessResponseRobotsTxtResponse,
  SuccessResponseGrammarCheckerResponse,
  SuccessResponseHookGeneratorResponse,
  SuccessResponseSeoBlogTitleResponse,
} from "@/types/generated/types.gen";
import type {
  TextInput,
  MetaDescriptionRequest,
  SchemaRequest,
  ReadabilityRequest,
  CanonicalTagRequest,
  QuestionRequest,
  BrokenLinkRequest,
  IdeaGeneratorRequest,
  RobotsTxtRequest,
  GrammarCheckerRequest,
  HookGeneratorRequest,
  SeoBlogTitleRequest,
} from "@/types/generated/types.gen";
import type { ApiClient } from "./core";
import { ENDPOINTS } from "./endpoints";

export function createToolsNamespace(client: ApiClient) {
  return {
    /**
     * Get text metrics (count metrics)
     */
    getMetrics: async (
      data: TextInput,
    ): Promise<SuccessResponseTextMetricsOutput> => {
      return client.request<SuccessResponseTextMetricsOutput>(
        ENDPOINTS.TOOLS.METRICS,
        {
          method: "POST",
          body: JSON.stringify(data),
        },
      );
    },

    /**
     * Generate meta description
     */
    generateMetaDescription: async (
      data: MetaDescriptionRequest,
    ): Promise<SuccessResponseMetaDescriptionResponse> => {
      return client.request<SuccessResponseMetaDescriptionResponse>(
        ENDPOINTS.TOOLS.META_DESCRIPTION,
        {
          method: "POST",
          body: JSON.stringify(data),
        },
      );
    },

    /**
     * Generate JSON-LD Schema
     */
    generateSchema: async (
      data: SchemaRequest,
    ): Promise<SuccessResponseDict> => {
      return client.request<SuccessResponseDict>(
        ENDPOINTS.TOOLS.SCHEMA_GENERATOR,
        {
          method: "POST",
          body: JSON.stringify(data),
        },
      );
    },

    /**
     * Check readability
     */
    checkReadability: async (
      data: ReadabilityRequest,
    ): Promise<SuccessResponseReadabilityResponse> => {
      return client.request<SuccessResponseReadabilityResponse>(
        ENDPOINTS.TOOLS.READABILITY,
        {
          method: "POST",
          body: JSON.stringify(data),
        },
      );
    },

    /**
     * Generate canonical tag
     */
    generateCanonical: async (
      data: CanonicalTagRequest,
    ): Promise<SuccessResponseCanonicalTagResponse> => {
      return client.request<SuccessResponseCanonicalTagResponse>(
        ENDPOINTS.TOOLS.CANONICAL,
        {
          method: "POST",
          body: JSON.stringify(data),
        },
      );
    },

    /**
     * Generate FAQ/Questions
     */
    generateQuestions: async (
      data: QuestionRequest,
    ): Promise<SuccessResponseQuestionResponse> => {
      return client.request<SuccessResponseQuestionResponse>(
        ENDPOINTS.TOOLS.QUESTION_GENERATOR,
        {
          method: "POST",
          body: JSON.stringify(data),
        },
      );
    },

    /**
     * Check for broken links
     */
    checkLinks: async (
      data: BrokenLinkRequest,
    ): Promise<SuccessResponseBrokenLinkResponse> => {
      return client.request<SuccessResponseBrokenLinkResponse>(
        ENDPOINTS.TOOLS.LINK_CHECKER,
        {
          method: "POST",
          body: JSON.stringify(data),
        },
      );
    },

    /**
     * Generate content ideas
     */
    generateIdeas: async (
      data: IdeaGeneratorRequest,
    ): Promise<SuccessResponseIdeaGeneratorResponse> => {
      return client.request<SuccessResponseIdeaGeneratorResponse>(
        ENDPOINTS.TOOLS.IDEA_GENERATOR,
        {
          method: "POST",
          body: JSON.stringify(data),
        },
      );
    },

    /**
     * Generate robots.txt
     */
    generateRobotsTxt: async (
      data: RobotsTxtRequest,
    ): Promise<SuccessResponseRobotsTxtResponse> => {
      return client.request<SuccessResponseRobotsTxtResponse>(
        ENDPOINTS.TOOLS.ROBOTS_TXT,
        {
          method: "POST",
          body: JSON.stringify(data),
        },
      );
    },

    /**
     * Check grammar
     */
    checkGrammar: async (
      data: GrammarCheckerRequest,
    ): Promise<SuccessResponseGrammarCheckerResponse> => {
      return client.request<SuccessResponseGrammarCheckerResponse>(
        ENDPOINTS.TOOLS.GRAMMAR_CHECKER,
        {
          method: "POST",
          body: JSON.stringify(data),
        },
      );
    },

    /**
     * Generate social hooks
     */
    generateHooks: async (
      data: HookGeneratorRequest,
    ): Promise<SuccessResponseHookGeneratorResponse> => {
      return client.request<SuccessResponseHookGeneratorResponse>(
        ENDPOINTS.TOOLS.HOOK_GENERATOR,
        {
          method: "POST",
          body: JSON.stringify(data),
        },
      );
    },

    /**
     * Generate SEO Blog Titles
     */
    generateBlogTitles: async (
      data: SeoBlogTitleRequest,
    ): Promise<SuccessResponseSeoBlogTitleResponse> => {
      return client.request<SuccessResponseSeoBlogTitleResponse>(
        ENDPOINTS.TOOLS.SEO_BLOG_TITLES,
        {
          method: "POST",
          body: JSON.stringify(data),
        },
      );
    },
  };
}
