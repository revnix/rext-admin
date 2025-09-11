/**
 * Icon mapping system for TypeForm-style Topic Builder
 *
 * Provides consistent iconography across all question types using Lucide React icons.
 * Maps each option value to an appropriate icon with fallback defaults.
 */

import {
  GraduationCap as Academic,
  ArrowUpRight,
  BarChart3,
  BookMarked,
  BookOpen,
  // Purpose icons
  BookOpenCheck,
  Briefcase,
  // Tone icons
  BriefcaseBusiness,
  // Industry icons
  Building2,
  Calculator,
  Dumbbell,
  // Platform icons
  Facebook,
  FileBarChart,
  // Content type icons
  FileText,
  FlaskConical,
  Globe,
  GraduationCap,
  Headphones,
  Heart,
  // Default/fallback icons
  HelpCircle,
  Home,
  Instagram,
  Landmark,
  Laptop,
  Laugh,
  Lightbulb,
  Linkedin,
  type LucideIcon,
  Mail,
  MessageCircle,
  MessageSquareText,
  Newspaper,
  Plane,
  Presentation,
  Scale,
  ScrollText,
  Search,
  Share2,
  Shirt,
  ShoppingBag,
  ShoppingCart,
  Smile,
  Sparkles,
  // Audience icons
  Target,
  TrendingUp,
  Trophy,
  Twitter,
  UserCircle,
  Users,
  Users2,
  UtensilsCrossed,
  Video,
  Youtube,
  Zap,
} from "lucide-react";

import type { IconMapping, IconResolver } from "@/types/typeform";

// ============================================================================
// INDUSTRY ICON MAPPINGS
// ============================================================================

const industryIcons: Record<string, LucideIcon> = {
  technology: Laptop,
  healthcare: Heart,
  finance: TrendingUp,
  education: GraduationCap,
  travel: Plane,
  food: UtensilsCrossed,
  fashion: Shirt,
  business: Briefcase,
  marketing: TrendingUp,
  science: FlaskConical,
  sports: Trophy,
  lifestyle: Home,
  government: Landmark,
  "real-estate": Building2,
  ecommerce: ShoppingCart,
  hr: Users,
  legal: Scale,
  fitness: Dumbbell,
  other: Building2,
};

// ============================================================================
// CONTENT TYPE ICON MAPPINGS
// ============================================================================

const contentTypeIcons: Record<string, LucideIcon> = {
  "blog-post": FileText,
  "social-media": Share2,
  "video-content": Video,
  podcast: Headphones,
  infographic: BarChart3,
  "ebook-guide": BookOpen,
  "case-study": FileBarChart,
  whitepaper: ScrollText,
  newsletter: Mail,
  presentation: Presentation,
  "press-release": Newspaper,
  other: FileText,
};

// ============================================================================
// PLATFORM ICON MAPPINGS
// ============================================================================

const platformIcons: Record<string, LucideIcon> = {
  facebook: Facebook,
  instagram: Instagram,
  twitter: Twitter,
  linkedin: Linkedin,
  tiktok: Video, // TikTok not available in Lucide, using Video
  youtube: Youtube,
  website: Globe,
  blog: FileText,
  vimeo: Video,
  other: Globe,
};

// ============================================================================
// AUDIENCE ICON MAPPINGS
// ============================================================================

const audienceIcons: Record<string, LucideIcon> = {
  "general-audience": Users2,
  professionals: BriefcaseBusiness,
  students: GraduationCap,
  entrepreneurs: Lightbulb,
  developers: Laptop,
  marketers: TrendingUp,
  executives: Briefcase,
  consumers: ShoppingCart,
  experts: Target,
  beginners: BookOpen,
  other: UserCircle,
};

// ============================================================================
// PURPOSE ICON MAPPINGS
// ============================================================================

const purposeIcons: Record<string, LucideIcon> = {
  "educate-inform": BookOpenCheck,
  "entertain-engage": Zap,
  "inspire-motivate": Sparkles,
  "persuade-convince": MessageSquareText,
  "promote-product": ShoppingBag,
  "drive-seo": Search,
  "thought-leadership": Lightbulb,
  other: ArrowUpRight,
};

// ============================================================================
// TONE ICON MAPPINGS
// ============================================================================

const toneIcons: Record<string, LucideIcon> = {
  "professional-formal": BriefcaseBusiness,
  "casual-conversational": MessageCircle,
  "friendly-warm": Smile,
  "humorous-playful": Laugh,
  "serious-academic": Academic,
  "technical-analytical": Calculator,
  "simple-accessible": BookMarked,
  "inspirational-uplifting": Sparkles,
  other: MessageSquareText,
};

// ============================================================================
// COMPLETE ICON MAPPING
// ============================================================================

export const iconMapping: IconMapping = {
  industries: industryIcons,
  contentTypes: contentTypeIcons,
  platforms: platformIcons,
  audiences: audienceIcons,
  purposes: purposeIcons,
  tones: toneIcons,
  defaults: {
    industry: Building2,
    contentType: FileText,
    platform: Globe,
    audience: Users2,
    purpose: ArrowUpRight,
    tone: MessageCircle,
    other: HelpCircle,
  },
};

// ============================================================================
// ICON RESOLVER FUNCTIONS
// ============================================================================

/**
 * Resolves an icon for a given category and key
 */
export const resolveIcon: IconResolver = (category, key) => {
  const categoryMapping = iconMapping[category];

  if (
    categoryMapping &&
    typeof categoryMapping === "object" &&
    key in categoryMapping
  ) {
    return categoryMapping[key as keyof typeof categoryMapping] as LucideIcon;
  }

  // Return category default if available
  if (category in iconMapping.defaults) {
    return iconMapping.defaults[category as keyof typeof iconMapping.defaults];
  }

  // Final fallback
  return iconMapping.defaults.other;
};

/**
 * Gets an industry icon by industry key
 */
export const getIndustryIcon = (industry: string): LucideIcon => {
  return resolveIcon("industries", industry);
};

/**
 * Gets a content type icon by content type key
 */
export const getContentTypeIcon = (contentType: string): LucideIcon => {
  return resolveIcon("contentTypes", contentType);
};

/**
 * Gets a platform icon by platform key
 */
export const getPlatformIcon = (platform: string): LucideIcon => {
  return resolveIcon("platforms", platform);
};

/**
 * Gets an audience icon by audience key
 */
export const getAudienceIcon = (audience: string): LucideIcon => {
  return resolveIcon("audiences", audience);
};

/**
 * Gets a purpose icon by purpose key
 */
export const getPurposeIcon = (purpose: string): LucideIcon => {
  return resolveIcon("purposes", purpose);
};

/**
 * Gets a tone icon by tone key
 */
export const getToneIcon = (tone: string): LucideIcon => {
  return resolveIcon("tones", tone);
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Checks if an icon exists for a given category and key
 */
export const hasIcon = (category: keyof IconMapping, key: string): boolean => {
  const categoryMapping = iconMapping[category];
  return (
    categoryMapping &&
    typeof categoryMapping === "object" &&
    key in categoryMapping
  );
};

/**
 * Gets all available icons for a category
 */
export const getCategoryIcons = (
  category: keyof IconMapping,
): Record<string, LucideIcon> => {
  const categoryMapping = iconMapping[category];
  if (categoryMapping && typeof categoryMapping === "object") {
    return categoryMapping as Record<string, LucideIcon>;
  }
  return {};
};

/**
 * Gets all available icon keys for a category
 */
export const getCategoryKeys = (category: keyof IconMapping): string[] => {
  return Object.keys(getCategoryIcons(category));
};

// ============================================================================
// DEVELOPMENT UTILITIES
// ============================================================================

/**
 * Validates that all expected keys have icons (development only)
 */
export const validateIconMappings = (
  expectedKeys: Record<string, string[]>,
): void => {
  if (process.env.NODE_ENV !== "development") return;

  Object.entries(expectedKeys).forEach(([category, keys]) => {
    keys.forEach((key) => {
      if (!hasIcon(category as keyof IconMapping, key)) {
        console.warn(`Missing icon mapping for ${category}.${key}`);
      }
    });
  });
};

/**
 * Debug function to list all available icons by category
 */
export const debugIconMappings = (): void => {
  if (process.env.NODE_ENV !== "development") return;

  console.group("🎨 TypeForm Icon Mappings");

  Object.entries(iconMapping).forEach(([category, icons]) => {
    if (category !== "defaults" && typeof icons === "object") {
      console.log(`${category}:`, Object.keys(icons));
    }
  });

  console.groupEnd();
};

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type {
  IconMapping,
  IconResolver,
} from "@/types/typeform";

export default iconMapping;
