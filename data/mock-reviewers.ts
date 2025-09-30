/**
 * Mock Reviewer Data
 *
 * This file contains dummy reviewer data for demonstration purposes.
 * In production, this data would come from the USER management system.
 */

export interface ReviewerUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  department?: string;
  expertise?: string[];
  isOnline?: boolean;
}

/**
 * Comprehensive list of mock reviewers for testing and demonstration
 */
export const MOCK_REVIEWERS: ReviewerUser[] = [
  // Marketing Department
  {
    id: "1",
    name: "Sarah Johnson",
    email: "sarah.johnson@company.com",
    role: "Content Manager",
    department: "Marketing",
    expertise: ["SEO", "Brand Voice", "Content Strategy"],
    isOnline: true,
  },
  {
    id: "2",
    name: "Mike Chen",
    email: "mike.chen@company.com",
    role: "Senior Editor",
    department: "Marketing",
    expertise: ["Copywriting", "Technical Writing", "Proofreading"],
    isOnline: false,
  },
  {
    id: "3",
    name: "Emily Rodriguez",
    email: "emily.rodriguez@company.com",
    role: "Brand Manager",
    department: "Marketing",
    expertise: ["Brand Guidelines", "Marketing Copy", "Visual Identity"],
    isOnline: true,
  },
  {
    id: "4",
    name: "Alex Thompson",
    email: "alex.thompson@company.com",
    role: "Digital Marketing Specialist",
    department: "Marketing",
    expertise: ["Social Media", "Analytics", "Campaign Management"],
    isOnline: true,
  },
  {
    id: "5",
    name: "Jessica Park",
    email: "jessica.park@company.com",
    role: "Content Strategist",
    department: "Marketing",
    expertise: ["Content Planning", "SEO Strategy", "Audience Research"],
    isOnline: false,
  },

  // Legal Department
  {
    id: "6",
    name: "David Park",
    email: "david.park@company.com",
    role: "Legal Counsel",
    department: "Legal",
    expertise: ["Compliance", "Legal Review", "Risk Assessment"],
    isOnline: true,
  },
  {
    id: "7",
    name: "Rachel Kim",
    email: "rachel.kim@company.com",
    role: "Regulatory Affairs Manager",
    department: "Legal",
    expertise: ["Regulatory Compliance", "Documentation Review"],
    isOnline: false,
  },

  // Product Department
  {
    id: "8",
    name: "James Wilson",
    email: "james.wilson@company.com",
    role: "Product Manager",
    department: "Product",
    expertise: [
      "Product Messaging",
      "Feature Documentation",
      "User Experience",
    ],
    isOnline: true,
  },
  {
    id: "9",
    name: "Lisa Chang",
    email: "lisa.chang@company.com",
    role: "Technical Writer",
    department: "Product",
    expertise: ["API Documentation", "User Guides", "Technical Communication"],
    isOnline: true,
  },
  {
    id: "10",
    name: "Robert Taylor",
    email: "robert.taylor@company.com",
    role: "UX Writer",
    department: "Product",
    expertise: ["Microcopy", "UI Text", "User Research"],
    isOnline: false,
  },

  // Sales Department
  {
    id: "11",
    name: "Amanda Foster",
    email: "amanda.foster@company.com",
    role: "Sales Content Manager",
    department: "Sales",
    expertise: [
      "Sales Collateral",
      "Proposal Writing",
      "Customer Communication",
    ],
    isOnline: true,
  },
  {
    id: "12",
    name: "Chris Anderson",
    email: "chris.anderson@company.com",
    role: "Sales Enablement Specialist",
    department: "Sales",
    expertise: [
      "Training Materials",
      "Sales Scripts",
      "Competitive Intelligence",
    ],
    isOnline: true,
  },

  // Customer Success Department
  {
    id: "13",
    name: "Maria Garcia",
    email: "maria.garcia@company.com",
    role: "Customer Success Manager",
    department: "Customer Success",
    expertise: [
      "Customer Communication",
      "Support Documentation",
      "Onboarding",
    ],
    isOnline: false,
  },
  {
    id: "14",
    name: "Kevin Liu",
    email: "kevin.liu@company.com",
    role: "Support Documentation Specialist",
    department: "Customer Success",
    expertise: ["Help Articles", "FAQ Creation", "Process Documentation"],
    isOnline: true,
  },

  // HR Department
  {
    id: "15",
    name: "Nicole Brown",
    email: "nicole.brown@company.com",
    role: "HR Communications Lead",
    department: "HR",
    expertise: [
      "Internal Communications",
      "Policy Documentation",
      "Employee Engagement",
    ],
    isOnline: false,
  },
];

/**
 * Get mock reviewers with optional filtering
 */
export function getMockReviewers(filters?: {
  department?: string;
  isOnline?: boolean;
  maxCount?: number;
}): ReviewerUser[] {
  let reviewers = [...MOCK_REVIEWERS];

  if (filters?.department && filters.department !== "all") {
    reviewers = reviewers.filter((r) => r.department === filters.department);
  }

  if (filters?.isOnline !== undefined) {
    reviewers = reviewers.filter((r) => r.isOnline === filters.isOnline);
  }

  if (filters?.maxCount) {
    reviewers = reviewers.slice(0, filters.maxCount);
  }

  return reviewers;
}

/**
 * Get unique departments from mock reviewers
 */
export function getMockDepartments(): string[] {
  const departments = new Set(
    MOCK_REVIEWERS.map((r) => r.department).filter(Boolean) as string[],
  );
  return Array.from(departments).sort();
}

/**
 * Get mock reviewer by ID
 */
export function getMockReviewerById(id: string): ReviewerUser | undefined {
  return MOCK_REVIEWERS.find((r) => r.id === id);
}

/**
 * Simulate loading delay for mock reviewers (for demo purposes)
 */
export async function loadMockReviewers(
  delay: number = 1000,
): Promise<ReviewerUser[]> {
  await new Promise((resolve) => setTimeout(resolve, delay));
  return MOCK_REVIEWERS;
}
