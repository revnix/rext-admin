/**
 * Unit Tests for Topic Builder Utilities
 *
 * Tests for YMYL detection, form validation, and utility functions
 */

import {
  buildPromptFromFormData,
  createInitialFormData,
  detectYMYL,
  formatValidationErrors,
  getAudienceOptions,
  sanitizeInput,
  updateFormDataForContentTypeChange,
  updateFormDataForIndustryChange,
  validateFormStep,
} from "@/lib/topic-builder-utils";
import type { TopicBuilderFormData } from "@/types/topic-builder";

// ============================================================================
// YMYL DETECTION TESTS
// ============================================================================

describe("detectYMYL", () => {
  describe("should return true for YMYL industries", () => {
    test("exact healthcare match", () => {
      expect(detectYMYL("healthcare")).toBe(true);
    });

    test("exact finance match", () => {
      expect(detectYMYL("finance")).toBe(true);
    });

    test("exact legal match", () => {
      expect(detectYMYL("legal")).toBe(true);
    });

    test("case insensitive - uppercase", () => {
      expect(detectYMYL("HEALTHCARE")).toBe(true);
      expect(detectYMYL("FINANCE")).toBe(true);
      expect(detectYMYL("LEGAL")).toBe(true);
    });

    test("case insensitive - mixed case", () => {
      expect(detectYMYL("HealthCare")).toBe(true);
      expect(detectYMYL("Finance")).toBe(true);
      expect(detectYMYL("Legal")).toBe(true);
    });

    test("partial matches", () => {
      expect(detectYMYL("Healthcare Services")).toBe(true);
      expect(detectYMYL("Financial Planning")).toBe(true);
      expect(detectYMYL("Legal Consulting")).toBe(true);
      expect(detectYMYL("Medical Device")).toBe(true);
      expect(detectYMYL("Investment Banking")).toBe(true);
    });

    test("specific YMYL subcategories", () => {
      expect(detectYMYL("mental health")).toBe(true);
      expect(detectYMYL("cryptocurrency")).toBe(true);
      expect(detectYMYL("immigration")).toBe(true);
      expect(detectYMYL("insurance")).toBe(true);
      expect(detectYMYL("pharmacy")).toBe(true);
    });
  });

  describe("should return false for non-YMYL industries", () => {
    test("technology", () => {
      expect(detectYMYL("technology")).toBe(false);
    });

    test("education", () => {
      expect(detectYMYL("education")).toBe(false);
    });

    test("marketing", () => {
      expect(detectYMYL("marketing")).toBe(false);
    });

    test("sports", () => {
      expect(detectYMYL("sports")).toBe(false);
    });

    test("travel", () => {
      expect(detectYMYL("travel")).toBe(false);
    });
  });

  describe("should handle edge cases", () => {
    test("empty string", () => {
      expect(detectYMYL("")).toBe(false);
    });

    test("whitespace only", () => {
      expect(detectYMYL("   ")).toBe(false);
    });

    test("null/undefined inputs", () => {
      expect(detectYMYL(null as unknown as string)).toBe(false);
      expect(detectYMYL(undefined as unknown as string)).toBe(false);
    });

    test("non-string inputs", () => {
      expect(detectYMYL(123 as unknown as string)).toBe(false);
      expect(detectYMYL({} as unknown as string)).toBe(false);
      expect(detectYMYL([] as unknown as string)).toBe(false);
    });

    test("strings with extra whitespace", () => {
      expect(detectYMYL("  healthcare  ")).toBe(true);
      expect(detectYMYL("  technology  ")).toBe(false);
    });
  });
});

// ============================================================================
// AUDIENCE OPTIONS TESTS
// ============================================================================

describe("getAudienceOptions", () => {
  test("returns education-specific audiences", () => {
    const options = getAudienceOptions("education");
    expect(options).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Students", value: "students" }),
        expect.objectContaining({ label: "Teachers", value: "teachers" }),
        expect.objectContaining({ label: "Parents", value: "parents" }),
      ]),
    );
  });

  test("returns healthcare-specific audiences", () => {
    const options = getAudienceOptions("healthcare");
    expect(options).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Patients", value: "patients" }),
        expect.objectContaining({ label: "Doctors", value: "doctors" }),
        expect.objectContaining({ label: "Nurses", value: "nurses" }),
      ]),
    );
  });

  test("returns finance-specific audiences", () => {
    const options = getAudienceOptions("finance");
    expect(options).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Retail Investors",
          value: "retail-investors",
        }),
        expect.objectContaining({
          label: "Financial Advisors",
          value: "financial-advisors",
        }),
      ]),
    );
  });

  test("returns default audiences for unknown industry", () => {
    const options = getAudienceOptions("unknown-industry");
    expect(options).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "General Public",
          value: "general-public",
        }),
        expect.objectContaining({
          label: "Professionals",
          value: "professionals",
        }),
      ]),
    );
  });

  test("handles empty/invalid inputs", () => {
    const options1 = getAudienceOptions("");
    const options2 = getAudienceOptions(null as unknown as string);
    expect(options1).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "General Public",
          value: "general-public",
        }),
      ]),
    );
    expect(options2).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "General Public",
          value: "general-public",
        }),
      ]),
    );
  });
});

// ============================================================================
// FORM VALIDATION TESTS
// ============================================================================

describe("validateFormStep", () => {
  const baseFormData: TopicBuilderFormData = {
    wizardMode: "industry-first",
    industry: "technology",
    content_type: "blog-post",
    demographic_age: [],
    demographic_location: [],
    purpose: ["educate-inform"],
    content_goal: ["tutorial"],
    tone: [],
    num_ideas: 5,
  };

  test("step 1 validation - requires wizard mode", () => {
    const invalidData = {
      ...baseFormData,
      wizardMode: undefined as unknown as TopicBuilderFormData["wizardMode"],
    };
    const result = validateFormStep(1, invalidData);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Please select a wizard mode to continue");
  });

  test("step 2 validation - requires industry", () => {
    const invalidData = {
      ...baseFormData,
      industry: undefined as unknown as TopicBuilderFormData["industry"],
    };
    const result = validateFormStep(2, invalidData);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Please select an industry or domain");
  });

  test("step 2 validation - subject-first requires subject", () => {
    const invalidData = {
      ...baseFormData,
      wizardMode: "subject-first" as const,
      subject: undefined,
    };
    const result = validateFormStep(2, invalidData);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      "Please provide a subject for subject-first mode",
    );
  });

  test("step 4 validation - requires content type", () => {
    const invalidData = {
      ...baseFormData,
      content_type:
        undefined as unknown as TopicBuilderFormData["content_type"],
    };
    const result = validateFormStep(4, invalidData);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Please select a content type");
  });

  test("step 4 validation - social media requires platform", () => {
    const invalidData = {
      ...baseFormData,
      content_type: "social-media" as const,
      platform: undefined,
    };
    const result = validateFormStep(4, invalidData);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      "Please select a platform for this content type",
    );
  });

  test("step 5 validation - requires purpose and content goal", () => {
    const invalidData = { ...baseFormData, purpose: [], content_goal: [] };
    const result = validateFormStep(5, invalidData);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      "Please select at least one content purpose",
    );
    expect(result.errors).toContain(
      "Please select at least one content goal type",
    );
  });

  test("valid form data passes validation", () => {
    const result = validateFormStep(5, baseFormData);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

// ============================================================================
// FORM DATA UPDATE TESTS
// ============================================================================

describe("updateFormDataForIndustryChange", () => {
  const baseFormData: TopicBuilderFormData = {
    wizardMode: "industry-first",
    industry: "technology",
    content_type: "blog-post",
    audience: "existing audience",
    demographic_age: ["25-34"],
    demographic_location: ["us"],
    purpose: [],
    content_goal: [],
    tone: [],
    num_ideas: 5,
  };

  test("updates industry and resets dependent fields", () => {
    const result = updateFormDataForIndustryChange(baseFormData, "healthcare");

    expect(result.industry).toBe("healthcare");
    expect(result.audience).toBeUndefined();
    expect(result.demographic_age).toEqual([]);
    expect(result.demographic_location).toEqual([]);
    expect(result.is_ymyl).toBe(true);
  });

  test("detects YMYL for healthcare industry", () => {
    const result = updateFormDataForIndustryChange(baseFormData, "healthcare");
    expect(result.is_ymyl).toBe(true);
  });

  test("does not set YMYL for non-YMYL industry", () => {
    const result = updateFormDataForIndustryChange(baseFormData, "technology");
    expect(result.is_ymyl).toBe(false);
  });
});

describe("updateFormDataForContentTypeChange", () => {
  const baseFormData: TopicBuilderFormData = {
    wizardMode: "industry-first",
    industry: "technology",
    content_type: "social-media",
    platform: "linkedin",
    demographic_age: [],
    demographic_location: [],
    purpose: [],
    content_goal: [],
    tone: [],
    num_ideas: 5,
  };

  test("preserves platform for social media content", () => {
    const result = updateFormDataForContentTypeChange(
      baseFormData,
      "social-media",
    );
    expect(result.content_type).toBe("social-media");
    expect(result.platform).toBe("linkedin");
  });

  test("removes platform for blog post content", () => {
    const result = updateFormDataForContentTypeChange(
      baseFormData,
      "blog-post",
    );
    expect(result.content_type).toBe("blog-post");
    expect(result.platform).toBeUndefined();
    expect(result.platform_other).toBeUndefined();
  });
});

// ============================================================================
// UTILITY FUNCTION TESTS
// ============================================================================

describe("sanitizeInput", () => {
  test("trims whitespace", () => {
    expect(sanitizeInput("  hello world  ")).toBe("hello world");
  });

  test("normalizes multiple spaces", () => {
    expect(sanitizeInput("hello    world")).toBe("hello world");
  });

  test("handles empty/invalid inputs", () => {
    expect(sanitizeInput("")).toBe("");
    expect(sanitizeInput(null as unknown as string)).toBe("");
    expect(sanitizeInput(undefined as unknown as string)).toBe("");
  });
});

describe("formatValidationErrors", () => {
  test("returns empty string for no errors", () => {
    expect(formatValidationErrors([])).toBe("");
  });

  test("returns single error as-is", () => {
    expect(formatValidationErrors(["Single error"])).toBe("Single error");
  });

  test("formats multiple errors with bullets", () => {
    const errors = ["Error 1", "Error 2", "Error 3"];
    const result = formatValidationErrors(errors);
    expect(result).toBe(
      "Please fix the following issues:\n• Error 1\n• Error 2\n• Error 3",
    );
  });
});

// ============================================================================
// PROMPT GENERATION TESTS
// ============================================================================

describe("buildPromptFromFormData", () => {
  test("generates basic prompt for industry-first flow", () => {
    const formData: TopicBuilderFormData = {
      wizardMode: "industry-first",
      industry: "technology",
      content_type: "blog-post",
      demographic_age: [],
      demographic_location: [],
      purpose: ["educate-inform"],
      content_goal: ["tutorial"],
      tone: ["professional-formal"],
      num_ideas: 5,
    };

    const prompt = buildPromptFromFormData(formData);

    expect(prompt).toContain("Generate 5 engaging content topic ideas");
    expect(prompt).toContain("INDUSTRY: technology");
    expect(prompt).toContain("CONTENT TYPE: blog-post");
    expect(prompt).toContain("CONTENT PURPOSE: educate-inform");
    expect(prompt).toContain("CONTENT GOALS: tutorial");
    expect(prompt).toContain("TONE: professional-formal");
  });

  test("generates prompt for subject-first flow", () => {
    const formData: TopicBuilderFormData = {
      wizardMode: "subject-first",
      subject: "AI in healthcare",
      industry: "healthcare",
      content_type: "blog-post",
      demographic_age: [],
      demographic_location: [],
      purpose: ["educate-inform"],
      content_goal: ["explainer"],
      tone: [],
      num_ideas: 3,
    };

    const prompt = buildPromptFromFormData(formData);

    expect(prompt).toContain("SUBJECT: AI in healthcare");
    expect(prompt).toContain("INDUSTRY: healthcare");
    expect(prompt).toContain("Generate 3 engaging content topic ideas");
  });

  test("includes YMYL warning for sensitive industries", () => {
    const formData: TopicBuilderFormData = {
      wizardMode: "industry-first",
      industry: "healthcare",
      content_type: "blog-post",
      demographic_age: [],
      demographic_location: [],
      purpose: ["educate-inform"],
      content_goal: ["tutorial"],
      tone: [],
      num_ideas: 5,
      is_ymyl: true,
    };

    const prompt = buildPromptFromFormData(formData);

    expect(prompt).toContain("⚠️ YMYL CONTENT");
    expect(prompt).toContain("factual, neutral, and non-advisory");
  });

  test("includes optional fields when provided", () => {
    const formData: TopicBuilderFormData = {
      wizardMode: "industry-first",
      industry: "technology",
      content_type: "blog-post",
      audience: "software developers",
      demographic_age: ["25-34"],
      demographic_location: ["us", "canada"],
      purpose: ["educate-inform"],
      content_goal: ["tutorial"],
      tone: ["technical-analytical"],
      keywords: "machine learning, AI",
      exclude: "basic tutorials",
      region: "us",
      language: "english",
      notes: "Focus on practical examples",
      num_ideas: 5,
    };

    const prompt = buildPromptFromFormData(formData);

    expect(prompt).toContain("TARGET AUDIENCE: software developers");
    expect(prompt).toContain("AGE GROUPS: 25-34");
    expect(prompt).toContain("GEOGRAPHIC FOCUS: us, canada");
    expect(prompt).toContain("KEYWORDS TO INCLUDE: machine learning, AI");
    expect(prompt).toContain("TOPICS TO AVOID: basic tutorials");
    expect(prompt).toContain("TARGET REGION: us");
    expect(prompt).toContain("LANGUAGE: english");
    expect(prompt).toContain("ADDITIONAL CONTEXT: Focus on practical examples");
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe("Industry change integration", () => {
  test("changing to YMYL industry auto-detects and resets fields", () => {
    const initialData = createInitialFormData();
    const updatedData = updateFormDataForIndustryChange(
      initialData,
      "healthcare",
    );

    expect(updatedData.industry).toBe("healthcare");
    expect(updatedData.is_ymyl).toBe(true);
    expect(updatedData.audience).toBeUndefined();
    expect(updatedData.demographic_age).toEqual([]);

    // Validation should pass for step 2
    const validation = validateFormStep(2, updatedData);
    expect(validation.isValid).toBe(true);
  });

  test("changing to non-YMYL industry works correctly", () => {
    const initialData = createInitialFormData();
    const updatedData = updateFormDataForIndustryChange(
      initialData,
      "technology",
    );

    expect(updatedData.industry).toBe("technology");
    expect(updatedData.is_ymyl).toBe(false);
  });
});

describe("Content type change integration", () => {
  test("changing to social media preserves platform requirements", () => {
    const initialData = createInitialFormData();
    const updatedData = updateFormDataForContentTypeChange(
      initialData,
      "social-media",
    );

    expect(updatedData.content_type).toBe("social-media");

    // Should require platform selection
    const validation = validateFormStep(4, updatedData);
    expect(validation.isValid).toBe(false);
    expect(validation.errors).toContain(
      "Please select a platform for this content type",
    );
  });

  test("changing to blog post removes platform requirement", () => {
    const formDataWithPlatform: TopicBuilderFormData = {
      ...createInitialFormData(),
      content_type: "social-media",
      platform: "linkedin",
    };

    const updatedData = updateFormDataForContentTypeChange(
      formDataWithPlatform,
      "blog-post",
    );

    expect(updatedData.content_type).toBe("blog-post");
    expect(updatedData.platform).toBeUndefined();

    // Should pass validation without platform
    const validation = validateFormStep(4, updatedData);
    expect(validation.isValid).toBe(true);
  });
});
