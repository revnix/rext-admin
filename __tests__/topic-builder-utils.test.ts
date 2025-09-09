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
  getAudienceForIndustry,
  getAudienceOptions,
  sanitizeInput,
  updateFormDataForContentTypeChange,
  updateFormDataForIndustryChange,
  validateFormStep,
  validateFormStepDetailed,
  validateSubjectIndustryRelevance,
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
        expect.objectContaining({
          label: "Healthcare Professionals",
          value: "healthcare-professionals",
        }),
      ]),
    );
  });

  test("returns finance-specific audiences", () => {
    const options = getAudienceOptions("finance");
    expect(options).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Investors", value: "investors" }),
        expect.objectContaining({
          label: "Financial Advisors",
          value: "financial-advisors",
        }),
      ]),
    );
  });

  test("returns default audiences for unknown industry", () => {
    const options = getAudienceOptions("unknown-industry");
    expect(Array.isArray(options)).toBe(true);
    expect(options.length).toBeGreaterThan(0);
  });

  test("handles empty/invalid inputs", () => {
    expect(getAudienceOptions("")).toEqual(expect.any(Array));
    expect(getAudienceOptions(null as unknown as string)).toEqual(
      expect.any(Array),
    );
  });
});

// ============================================================================
// FORM VALIDATION TESTS
// ============================================================================

describe("validateFormStep (boolean function - Task 2.3 requirement)", () => {
  test("step 1 validation - requires wizard mode", () => {
    const invalidData: Partial<TopicBuilderFormData> = {};
    expect(validateFormStep(1, invalidData as TopicBuilderFormData)).toBe(
      false,
    );
  });

  test("step 1 validation - requires industry and wizard mode", () => {
    const validData: Partial<TopicBuilderFormData> = {
      wizardMode: "industry-first",
      industry: "technology",
    };
    expect(validateFormStep(1, validData as TopicBuilderFormData)).toBe(true);
  });

  test("step 1 validation - subject-first requires subject", () => {
    const invalidData: Partial<TopicBuilderFormData> = {
      wizardMode: "subject-first",
      industry: "technology",
    };
    const validData: Partial<TopicBuilderFormData> = {
      wizardMode: "subject-first",
      industry: "technology",
      subject: "AI Development",
    };
    expect(validateFormStep(1, invalidData as TopicBuilderFormData)).toBe(
      false,
    );
    expect(validateFormStep(1, validData as TopicBuilderFormData)).toBe(true);
  });

  test("step 3 validation - requires content type", () => {
    const invalidData: Partial<TopicBuilderFormData> = {
      wizardMode: "industry-first",
      industry: "technology",
    };
    const validData: Partial<TopicBuilderFormData> = {
      wizardMode: "industry-first",
      industry: "technology",
      content_type: "blog-post",
    };
    expect(validateFormStep(3, invalidData as TopicBuilderFormData)).toBe(
      false,
    );
    expect(validateFormStep(3, validData as TopicBuilderFormData)).toBe(true);
  });

  test("step 4 validation - requires purpose and tone", () => {
    const invalidData: Partial<TopicBuilderFormData> = {
      wizardMode: "industry-first",
      industry: "technology",
      content_type: "blog-post",
    };
    const validData: Partial<TopicBuilderFormData> = {
      wizardMode: "industry-first",
      industry: "technology",
      content_type: "blog-post",
      purpose: ["educate-inform"],
      tone: ["professional-formal"],
    };
    expect(validateFormStep(4, invalidData as TopicBuilderFormData)).toBe(
      false,
    );
    expect(validateFormStep(4, validData as TopicBuilderFormData)).toBe(true);
  });

  test("step 6 validation - final generation step", () => {
    const validData: TopicBuilderFormData = {
      wizardMode: "industry-first",
      industry: "technology",
      content_type: "blog-post",
      purpose: ["educate-inform"],
      tone: ["professional-formal"],
      num_ideas: 5,
    };
    expect(validateFormStep(6, validData)).toBe(true);
  });

  test("valid form data passes validation", () => {
    const validData: TopicBuilderFormData = {
      wizardMode: "industry-first",
      industry: "technology",
      content_type: "blog-post",
      purpose: ["educate-inform"],
      tone: ["professional-formal"],
      num_ideas: 5,
    };
    expect(validateFormStep(1, validData)).toBe(true);
    expect(validateFormStep(3, validData)).toBe(true);
    expect(validateFormStep(4, validData)).toBe(true);
    expect(validateFormStep(6, validData)).toBe(true);
  });
});

describe("validateFormStepDetailed (detailed validation results)", () => {
  test("step 1 validation - requires wizard mode", () => {
    const invalidData: Partial<TopicBuilderFormData> = {};
    const result = validateFormStepDetailed(
      1,
      invalidData as TopicBuilderFormData,
    );
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Please select how you'd like to start");
  });

  test("step 1 validation - requires industry", () => {
    const invalidData: Partial<TopicBuilderFormData> = {
      wizardMode: "industry-first",
    };
    const result = validateFormStepDetailed(
      1,
      invalidData as TopicBuilderFormData,
    );
    expect(result.isValid).toBe(false);
    expect(result.errors.some((error) => error.includes("industry"))).toBe(
      true,
    );
  });

  test("step 1 validation - subject-first requires subject", () => {
    const invalidData: Partial<TopicBuilderFormData> = {
      wizardMode: "subject-first",
      industry: "technology",
    };
    const result = validateFormStepDetailed(
      1,
      invalidData as TopicBuilderFormData,
    );
    expect(result.isValid).toBe(false);
    expect(result.errors.some((error) => error.includes("subject"))).toBe(true);
  });

  test("step 3 validation - requires content type", () => {
    const invalidData: Partial<TopicBuilderFormData> = {
      wizardMode: "industry-first",
      industry: "technology",
    };
    const result = validateFormStepDetailed(
      3,
      invalidData as TopicBuilderFormData,
    );
    expect(result.isValid).toBe(false);
  });

  test("step 3 validation - social media requires platform", () => {
    const invalidData: Partial<TopicBuilderFormData> = {
      wizardMode: "industry-first",
      industry: "technology",
      content_type: "social-media",
    };
    const result = validateFormStepDetailed(
      3,
      invalidData as TopicBuilderFormData,
    );
    expect(result.isValid).toBe(false);
    expect(result.errors.some((error) => error.includes("platform"))).toBe(
      true,
    );
  });

  test("step 4 validation - requires purpose and tone", () => {
    const invalidData: Partial<TopicBuilderFormData> = {
      wizardMode: "industry-first",
      industry: "technology",
      content_type: "blog-post",
    };
    const result = validateFormStepDetailed(
      4,
      invalidData as TopicBuilderFormData,
    );
    expect(result.isValid).toBe(false);
  });

  test("step 6 validation - final generation step", () => {
    const validData: TopicBuilderFormData = {
      wizardMode: "industry-first",
      industry: "technology",
      content_type: "blog-post",
      purpose: ["educate-inform"],
      tone: ["professional-formal"],
      num_ideas: 5,
    };
    const result = validateFormStepDetailed(6, validData);
    expect(result.isValid).toBe(true);
  });

  test("valid form data passes validation", () => {
    const validData: TopicBuilderFormData = {
      wizardMode: "industry-first",
      industry: "technology",
      content_type: "blog-post",
      purpose: ["educate-inform"],
      tone: ["professional-formal"],
      num_ideas: 5,
    };
    const result = validateFormStepDetailed(6, validData);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });
});

// ============================================================================
// UTILITY FUNCTION TESTS
// ============================================================================

describe("validateSubjectIndustryRelevance", () => {
  test("returns true for relevant subject-industry combinations", () => {
    expect(
      validateSubjectIndustryRelevance("Machine Learning", "technology"),
    ).toBe(true);
    expect(
      validateSubjectIndustryRelevance("Investment strategies", "finance"),
    ).toBe(true);
    expect(validateSubjectIndustryRelevance("Patient care", "healthcare")).toBe(
      true,
    );
  });

  test("returns false for irrelevant subject-industry combinations", () => {
    expect(
      validateSubjectIndustryRelevance("Cooking recipes", "technology"),
    ).toBe(false);
    expect(validateSubjectIndustryRelevance("Sports training", "finance")).toBe(
      false,
    );
  });

  test("returns true for edge cases", () => {
    expect(validateSubjectIndustryRelevance("", "technology")).toBe(true); // Empty subject
    expect(validateSubjectIndustryRelevance("Generic topic", "")).toBe(true); // Empty industry
  });

  test("handles case insensitive matching", () => {
    expect(
      validateSubjectIndustryRelevance("MACHINE LEARNING", "technology"),
    ).toBe(true);
    expect(
      validateSubjectIndustryRelevance("machine learning", "TECHNOLOGY"),
    ).toBe(true);
  });
});

describe("updateFormDataForIndustryChange", () => {
  test("should reset industry_other when industry is not other", () => {
    const formData: TopicBuilderFormData = {
      wizardMode: "industry-first",
      industry: "other",
      industry_other: "Custom Industry",
      content_type: "blog-post",
      purpose: ["educate-inform"],
      tone: ["professional-formal"],
      num_ideas: 5,
    };

    const result = updateFormDataForIndustryChange(formData, "technology");
    expect(result.industry).toBe("technology");
    expect(result.industry_other).toBeUndefined();
  });

  test("should preserve industry_other when industry is other", () => {
    const formData: TopicBuilderFormData = {
      wizardMode: "industry-first",
      industry: "technology",
      content_type: "blog-post",
      purpose: ["educate-inform"],
      tone: ["professional-formal"],
      num_ideas: 5,
    };

    const result = updateFormDataForIndustryChange(formData, "other");
    expect(result.industry).toBe("other");
    expect(result.industry_other).toBeUndefined(); // Starts undefined
  });
});

describe("updateFormDataForContentTypeChange", () => {
  test("should reset platform when content type is not social-media", () => {
    const formData: TopicBuilderFormData = {
      wizardMode: "industry-first",
      industry: "technology",
      content_type: "social-media",
      platform: "facebook",
      purpose: ["educate-inform"],
      tone: ["professional-formal"],
      num_ideas: 5,
    };

    const result = updateFormDataForContentTypeChange(formData, "blog-post");
    expect(result.content_type).toBe("blog-post");
    expect(result.platform).toBeUndefined();
  });

  test("should preserve platform when content type is social-media", () => {
    const formData: TopicBuilderFormData = {
      wizardMode: "industry-first",
      industry: "technology",
      content_type: "blog-post",
      purpose: ["educate-inform"],
      tone: ["professional-formal"],
      num_ideas: 5,
    };

    const result = updateFormDataForContentTypeChange(formData, "social-media");
    expect(result.content_type).toBe("social-media");
    expect(result.platform).toBeUndefined(); // Starts undefined, will be set by user
  });
});

describe("sanitizeInput", () => {
  test("should remove malicious scripts", () => {
    expect(sanitizeInput('<script>alert("xss")</script>hello')).toBe("hello");
  });

  test("should preserve safe text", () => {
    expect(sanitizeInput("Hello world! This is safe text.")).toBe(
      "Hello world! This is safe text.",
    );
  });

  test("should handle empty and whitespace strings", () => {
    expect(sanitizeInput("")).toBe("");
    expect(sanitizeInput("   ")).toBe("   ");
  });
});

describe("formatValidationErrors", () => {
  test("should format single error", () => {
    expect(formatValidationErrors(["Error 1"])).toBe("Error 1");
  });

  test("should format multiple errors", () => {
    const result = formatValidationErrors(["Error 1", "Error 2"]);
    expect(result).toContain("Error 1");
    expect(result).toContain("Error 2");
  });

  test("should handle empty array", () => {
    expect(formatValidationErrors([])).toBe("");
  });
});

describe("buildPromptFromFormData", () => {
  test("should build prompt for industry-first mode", () => {
    const formData: TopicBuilderFormData = {
      wizardMode: "industry-first",
      industry: "technology",
      content_type: "blog-post",
      purpose: ["educate-inform"],
      tone: ["professional-formal"],
      num_ideas: 5,
    };

    const prompt = buildPromptFromFormData(formData);
    expect(prompt).toContain("technology");
    expect(prompt).toContain("blog-post");
    expect(prompt).toContain("educate-inform");
    expect(prompt).toContain("professional-formal");
  });

  test("should build prompt for subject-first mode", () => {
    const formData: TopicBuilderFormData = {
      wizardMode: "subject-first",
      subject: "Machine Learning",
      industry: "technology",
      content_type: "blog-post",
      purpose: ["educate-inform"],
      tone: ["professional-formal"],
      num_ideas: 5,
    };

    const prompt = buildPromptFromFormData(formData);
    expect(prompt).toContain("Machine Learning");
    expect(prompt).toContain("technology");
    expect(prompt).toContain("blog-post");
  });
});

describe("getAudienceForIndustry", () => {
  test("should return education-specific audiences", () => {
    const audiences = getAudienceForIndustry("education");
    expect(audiences).toContain("students");
    expect(audiences).toContain("teachers");
    expect(audiences).toContain("parents");
  });

  test("should return healthcare-specific audiences", () => {
    const audiences = getAudienceForIndustry("healthcare");
    expect(audiences).toContain("patients");
    expect(audiences).toContain("healthcare-professionals");
  });

  test("should return finance-specific audiences", () => {
    const audiences = getAudienceForIndustry("finance");
    expect(audiences).toContain("investors");
    expect(audiences).toContain("financial-advisors");
  });

  test("should return default audiences for unknown industry", () => {
    const audiences = getAudienceForIndustry("unknown");
    expect(Array.isArray(audiences)).toBe(true);
    expect(audiences.length).toBeGreaterThan(0);
  });

  test("should handle empty industry", () => {
    const audiences = getAudienceForIndustry("");
    expect(Array.isArray(audiences)).toBe(true);
  });
});

describe("createInitialFormData", () => {
  test("should create valid initial form data", () => {
    const initialData = createInitialFormData();

    expect(initialData.wizardMode).toBe("industry-first");
    expect(initialData.num_ideas).toBe(5);
    expect(Array.isArray(initialData.purpose)).toBe(true);
    expect(Array.isArray(initialData.tone)).toBe(true);
  });
});
