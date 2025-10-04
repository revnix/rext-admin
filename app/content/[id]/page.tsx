"use client";

import {
  Calendar,
  Clock,
  Copy,
  Download,
  Edit3,
  ExternalLink,
  FileText,
  Hash,
  Share2,
  Trash2,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { DetailPageWrapper } from "@/components/detail-page-wrapper";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DetailCard } from "@/components/ui/detail-card";
import {
  DetailGrid,
  DetailGridItem,
  ThreeColumnGrid,
  TwoColumnGrid,
} from "@/components/ui/detail-grid";
import { Progress } from "@/components/ui/progress";
import { SectionHeader } from "@/components/ui/section-header";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { usePageTitle } from "@/hooks/use-page-title";
import { log } from "@/lib/logger";
import type { ContentStatus } from "@/types/content";
import type { ContentData } from "@/types/data-table";
import type { MetadataItem, SidebarConfig } from "@/types/detail-page";

// Mock content data - in real app this would come from API
const contentData: ContentData[] = [
  {
    id: "1",
    title: "The Future of AI in Content Marketing: 2024 Trends",
    type: "Blog Post",
    contentType: "Article",
    status: "published" as ContentStatus,
    publishedTo: "Company Blog",
    publishDate: "2024-01-22 10:00",
    scheduledDate: null,
    flowName: "AI Blog Post Generator",
    flowId: "flow_001",
    wordCount: 2847,
    readTime: "12 min read",
    engagement: {
      views: 3247,
      likes: 156,
      shares: 43,
    },
    seoScore: 89,
    author: "AI Assistant",
    humanReviewer: "Sarah Johnson",
    keywords: ["AI", "content marketing", "2024 trends", "automation"],
    platforms: ["Website", "LinkedIn"],
    lastModified: "2024-01-22 09:45",
    created: "2024-01-22 08:30",
    content: `# The Future of AI in Content Marketing: 2024 Trends

The landscape of content marketing is rapidly evolving with AI at the forefront of this transformation. As we navigate through 2024, artificial intelligence has become an indispensable tool for content creators, marketers, and businesses looking to scale their content operations while maintaining quality and authenticity.

## Key Trends Shaping AI Content Marketing

### 1. Personalization at Scale
AI-powered personalization engines are now capable of creating highly targeted content for specific audience segments. Machine learning algorithms analyze user behavior, preferences, and engagement patterns to deliver content that resonates with individual users.

### 2. Multi-Modal Content Generation
The integration of text, images, video, and audio through AI systems is creating more engaging and diverse content experiences. This approach allows brands to tell their stories across multiple formats simultaneously.

### 3. Real-Time Content Optimization
AI systems can now analyze content performance in real-time and make immediate adjustments to improve engagement and conversion rates.

## The Impact on Content Strategy

Organizations leveraging AI for content marketing are seeing significant improvements in:
- Content production speed (300% faster)
- Audience engagement (45% increase)
- Cost efficiency (60% reduction in content creation costs)
- SEO performance (25% improvement in search rankings)

## Looking Ahead

As we progress through 2024, the synergy between human creativity and AI efficiency will continue to define the future of content marketing. The most successful brands will be those that embrace this technology while maintaining their unique voice and authenticity.`,
  },
  {
    id: "2",
    title: "Customer Success Story: Revnix Solutions",
    type: "Case Study",
    contentType: "Case Study",
    status: "scheduled" as ContentStatus,
    publishedTo: "",
    publishDate: null,
    scheduledDate: "2024-01-25 14:00",
    flowName: "Case Study Generator",
    flowId: "flow_003",
    wordCount: 1923,
    readTime: "8 min read",
    engagement: {
      views: 0,
      likes: 0,
      shares: 0,
    },
    seoScore: 76,
    author: "AI Assistant",
    humanReviewer: "Mike Chen",
    keywords: ["customer success", "case study", "ROI", "implementation"],
    platforms: ["Website", "Sales Materials"],
    lastModified: "2024-01-21 16:30",
    created: "2024-01-21 15:00",
    content:
      "Discover how Revnix Solutions transformed their content workflow and achieved 300% ROI...",
  },
];

export default function ContentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const contentId = params.id as string;

  const [isDeleting, setIsDeleting] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // Find the current content
  const content = contentData.find((c: ContentData) => c.id === contentId);

  // Update page title and description dynamically
  usePageTitle(
    content?.title || "Content Detail",
    content
      ? `${content.type} content: ${content.title}. ${content.wordCount} words, ${content.readTime} read time.`
      : "Content details and management",
  );

  if (!content) {
    return (
      <DetailPageWrapper
        title="Content Not Found"
        breadcrumbs={[
          { label: "Content", href: "/content" },
          { label: "Content Detail" },
        ]}
        error="Content not found"
      >
        <div />
      </DetailPageWrapper>
    );
  }

  // Handle content actions
  const handleEditContent = () => {
    log.info("Editing content:", content.title);
    // TODO: Navigate to edit page
  };

  const handleCopyContent = async () => {
    try {
      await navigator.clipboard.writeText(content.content);
      log.info("Content copied to clipboard");
    } catch (error) {
      log.error("Failed to copy content:", error);
    }
  };

  const handleShareContent = async () => {
    try {
      await navigator.share({
        title: content.title,
        text: `${content.content.substring(0, 100)}...`,
        url: window.location.href,
      });
    } catch (_error) {
      // Fallback to copy URL
      await navigator.clipboard.writeText(window.location.href);
    }
  };

  const handlePublishNow = async () => {
    setIsPublishing(true);
    try {
      // TODO: Implement publish logic
      log.info("Publishing content:", content.title);
    } catch (error) {
      log.error("Failed to publish content:", error);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDeleteContent = async () => {
    setIsDeleting(true);
    try {
      // TODO: Implement delete logic
      log.info("Deleting content:", content.title);
      router.push("/content");
    } catch (error) {
      log.error("Failed to delete content:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownloadContent = () => {
    const element = document.createElement("a");
    const file = new Blob([content.content], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `${content.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Build breadcrumbs
  const breadcrumbs = [
    { label: "Content", href: "/content" },
    { label: content.title },
  ];

  // Build metadata for the wrapper
  const metadata: MetadataItem[] = [
    {
      label: "Content Type",
      value: <Badge variant="secondary">{content.contentType}</Badge>,
      icon: <FileText className="h-4 w-4" />,
    },
    {
      label: "Word Count",
      value: content.wordCount.toLocaleString(),
      icon: <Hash className="h-4 w-4" />,
    },
    {
      label: "Read Time",
      value: content.readTime,
      icon: <Clock className="h-4 w-4" />,
    },
    {
      label: "SEO Score",
      value: `${content.seoScore}%`,
      icon: <TrendingUp className="h-4 w-4" />,
    },
    {
      label: "Author",
      value: content.author,
      icon: <Users className="h-4 w-4" />,
    },
    {
      label: "Reviewer",
      value: content.humanReviewer,
      icon: <Users className="h-4 w-4" />,
    },
  ];

  // Build header actions for page header
  const headerActions = (
    <div className="flex items-center gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button onClick={handleEditContent} className="gap-2">
            <Edit3 className="h-4 w-4" />
            Edit Content
          </Button>
        </TooltipTrigger>
        <TooltipContent>Edit this content</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={handlePublishNow}
            disabled={content.status === "published" || isPublishing}
            className="gap-2"
          >
            {isPublishing ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <Zap className="h-4 w-4" />
            )}
            {isPublishing ? "Publishing..." : "Publish"}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {content.status === "published"
            ? "Already published"
            : "Publish content now"}
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={handleShareContent}
            variant="outline"
            className="gap-2"
          >
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        </TooltipTrigger>
        <TooltipContent>Share content</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button onClick={handleCopyContent} variant="outline" size="sm">
            <Copy className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Copy content</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button onClick={handleDownloadContent} variant="outline" size="sm">
            <Download className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Download content</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={handleDeleteContent}
            disabled={isDeleting}
            variant="destructive"
            size="sm"
          >
            {isDeleting ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>Delete this content</TooltipContent>
      </Tooltip>
    </div>
  );

  // Build new flexible sidebar configuration
  const sidebarConfig: SidebarConfig = {
    cards: [
      // SEO Score Card (using score type)
      {
        type: "score",
        config: {
          score: content.seoScore,
          title: "SEO Score",
          description: "Search Engine Optimization",
          variant:
            content.seoScore >= 80
              ? "success"
              : content.seoScore >= 60
                ? "default"
                : "warning",
        },
      },
      // Performance Metrics (using stats type)
      {
        type: "stats",
        config: {
          title: "Performance Metrics",
          items: [
            {
              label: "Views",
              value: content.engagement.views.toLocaleString(),
              icon: <TrendingUp className="h-4 w-4" />,
              highlight: true,
            },
            {
              label: "Likes",
              value: content.engagement.likes.toLocaleString(),
            },
            {
              label: "Shares",
              value: content.engagement.shares.toLocaleString(),
            },
          ],
        },
      },
      // Publication Details (using stats type)
      {
        type: "stats",
        config: {
          title: "Publication Details",
          items: [
            {
              label: "Status",
              value: (
                <Badge
                  variant={
                    content.status === "published"
                      ? "default"
                      : content.status === "scheduled"
                        ? "secondary"
                        : "outline"
                  }
                >
                  {content.status}
                </Badge>
              ),
              highlight: true,
            },
            ...(content.publishedTo
              ? [
                  {
                    label: "Published To",
                    value: content.publishedTo,
                  },
                ]
              : []),
            ...(content.publishDate
              ? [
                  {
                    label: "published",
                    value: new Date(content.publishDate).toLocaleDateString(),
                  },
                ]
              : []),
            ...(content.scheduledDate
              ? [
                  {
                    label: "scheduled",
                    value: new Date(content.scheduledDate).toLocaleDateString(),
                  },
                ]
              : []),
            {
              label: "Flow",
              value: content.flowName,
            },
          ],
        },
      },
      // Platforms (using custom type for tags)
      {
        type: "custom",
        config: {
          id: "platforms",
          content: (
            <DetailCard variant="default">
              <div className="p-6">
                <SectionHeader
                  title="Platforms"
                  variant="compact"
                  className="mb-4"
                />
                <div className="flex flex-wrap gap-2">
                  {content.platforms.map((platform) => (
                    <Badge key={platform} variant="outline" className="text-xs">
                      {platform}
                    </Badge>
                  ))}
                </div>
              </div>
            </DetailCard>
          ),
        },
      },
    ],
    order: ["cards", "metadata", "quickActions"],
  };

  return (
    <DetailPageWrapper
      title={content.title}
      breadcrumbs={breadcrumbs}
      status={content.status}
      statusVariant={
        content.status === "published"
          ? "default"
          : content.status === "scheduled"
            ? "secondary"
            : "outline"
      }
      metadata={metadata}
      headerActions={headerActions}
      sidebarConfig={sidebarConfig}
    >
      {/* Main Content - Using standardized components */}
      <div className="space-y-8">
        {/* Content Preview */}
        <DetailCard variant="highlight" gradient>
          <div className="flex items-center justify-between mb-4">
            <SectionHeader
              title="Content Preview"
              icon={<FileText className="w-5 h-5" />}
              variant="spacious"
            />
            {content.publishedTo && (
              <div className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Live on {content.publishedTo}
                </span>
              </div>
            )}
          </div>
          <div className="prose prose-sm max-w-none">
            <div className="bg-white dark:bg-background rounded-lg p-4 border">
              <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans">
                {content.content}
              </pre>
            </div>
          </div>
        </DetailCard>

        {/* Keywords & Analytics - Two Column Layout */}
        <TwoColumnGrid gap="lg">
          {/* Keywords & Tags */}
          {content.keywords && content.keywords.length > 0 && (
            <DetailCard variant="accent" gradient>
              <SectionHeader
                title="Keywords & Tags"
                icon={<Hash className="w-5 h-5" />}
                variant="spacious"
                className="mb-4"
              />
              <div className="flex flex-wrap gap-3">
                {content.keywords.map((keyword) => (
                  <Badge
                    key={keyword}
                    variant="secondary"
                    className="text-sm px-4 py-2 bg-gradient-to-r from-white/90 to-purple-50/90 dark:from-background/90 dark:to-purple-900/20 border border-purple-200/60 dark:border-purple-700/60 hover:border-purple-300/80 dark:hover:border-purple-600/80 hover:shadow-sm transition-all duration-200 font-medium"
                  >
                    <Hash className="w-3 h-3 mr-1.5 text-purple-500" />
                    {keyword}
                  </Badge>
                ))}
              </div>
            </DetailCard>
          )}

          {/* Content Metrics Summary */}
          <DetailCard variant="info" gradient>
            <SectionHeader
              title="Content Metrics"
              icon={<FileText className="w-5 h-5" />}
              variant="spacious"
              className="mb-4"
            />
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Word Count
                </span>
                <span className="font-medium">
                  {content.wordCount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Read Time</span>
                <span className="font-medium">{content.readTime}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">SEO Score</span>
                <div className="flex items-center gap-2">
                  <Progress value={content.seoScore} className="w-16 h-2" />
                  <span className="font-medium">{content.seoScore}%</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Engagement Rate
                </span>
                <span className="font-medium">
                  {content.engagement.views > 0
                    ? `${(((content.engagement.likes + content.engagement.shares) / content.engagement.views) * 100).toFixed(1)}%`
                    : "0%"}
                </span>
              </div>
            </div>
          </DetailCard>
        </TwoColumnGrid>

        {/* Content Analytics */}
        <DetailCard variant="success" gradient>
          <SectionHeader
            title="Content Analytics"
            icon={<TrendingUp className="w-5 h-5" />}
            variant="spacious"
            className="mb-6"
          />
          <ThreeColumnGrid gap="lg">
            {[
              {
                label: "Total Views",
                value: content.engagement.views.toLocaleString(),
                icon: TrendingUp,
                color: "text-green-600 dark:text-green-400",
              },
              {
                label: "Likes",
                value: content.engagement.likes.toLocaleString(),
                icon: Users,
                color: "text-green-600 dark:text-green-400",
              },
              {
                label: "Shares",
                value: content.engagement.shares.toLocaleString(),
                icon: Share2,
                color: "text-green-600 dark:text-green-400",
              },
            ].map((metric) => {
              const IconComponent = metric.icon;
              return (
                <div
                  key={metric.label}
                  className="text-center p-4 bg-white/60 dark:bg-background/60 rounded-lg border border-green-200/50 dark:border-green-800/50"
                >
                  <div className="flex items-center justify-center mb-3">
                    <IconComponent className="w-6 h-6 text-green-600 dark:text-green-400 mr-2" />
                    <div className={`text-3xl font-bold ${metric.color}`}>
                      {metric.value}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground font-medium">
                    {metric.label}
                  </div>
                </div>
              );
            })}
          </ThreeColumnGrid>
        </DetailCard>

        {/* Timeline & Flow Information - Custom Grid Layout */}
        <DetailGrid columns={3} gap="lg" responsive={{ sm: 1, md: 2, lg: 3 }}>
          {/* Timeline */}
          <DetailGridItem span={2}>
            <DetailCard variant="warning" gradient>
              <SectionHeader
                title="Content Timeline"
                icon={<Calendar className="w-5 h-5" />}
                variant="spacious"
                className="mb-4"
              />
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Created</span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(content.created).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Last Modified</span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(content.lastModified).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
                {content.publishDate && (
                  <div className="flex items-center gap-4">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Published</span>
                        <span className="text-sm text-muted-foreground">
                          {new Date(content.publishDate).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                {content.scheduledDate && (
                  <div className="flex items-center gap-4">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Scheduled</span>
                        <span className="text-sm text-muted-foreground">
                          {new Date(content.scheduledDate).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </DetailCard>
          </DetailGridItem>

          {/* Flow Information */}
          <DetailGridItem span={1}>
            <DetailCard variant="default">
              <div className="text-center space-y-4">
                <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200/50 dark:border-amber-800/50">
                  <Zap className="w-6 h-6 mx-auto mb-2 text-amber-600 dark:text-amber-400" />
                  <div className="text-sm font-medium">Generated by</div>
                  <div
                    className="text-xs text-muted-foreground mt-1 truncate"
                    title={content.flowName}
                  >
                    {content.flowName}
                  </div>
                </div>

                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200/50 dark:border-blue-800/50">
                  <Users className="w-6 h-6 mx-auto mb-2 text-blue-600 dark:text-blue-400" />
                  <div className="text-sm font-medium">Author</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {content.author}
                  </div>
                </div>

                <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200/50 dark:border-green-800/50">
                  <Users className="w-6 h-6 mx-auto mb-2 text-green-600 dark:text-green-400" />
                  <div className="text-sm font-medium">Reviewer</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {content.humanReviewer}
                  </div>
                </div>
              </div>
            </DetailCard>
          </DetailGridItem>
        </DetailGrid>
      </div>
    </DetailPageWrapper>
  );
}
