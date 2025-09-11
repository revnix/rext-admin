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
import type {
  ActionButton,
  MetadataItem,
} from "@/components/detail-page-wrapper";
import { DetailPageWrapper } from "@/components/detail-page-wrapper";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { ContentData } from "@/types/data-table";

// Mock content data - in real app this would come from API
const contentData: ContentData[] = [
  {
    id: "1",
    title: "The Future of AI in Content Marketing: 2024 Trends",
    type: "Blog Post",
    contentType: "Article",
    status: "Published",
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
    status: "Scheduled",
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

  if (!content) {
    return (
      <DetailPageWrapper
        title="Content Not Found"
        description="The requested content could not be found"
        breadcrumbs={[
          { label: "Content", href: "/content" },
          { label: "Content Detail" },
        ]}
        backUrl="/content"
        backLabel="Back to Content"
        error="Content not found"
      >
        <div />
      </DetailPageWrapper>
    );
  }

  // Handle content actions
  const handleEditContent = () => {
    console.log("Editing content:", content.title);
    // TODO: Navigate to edit page
  };

  const handleCopyContent = async () => {
    try {
      await navigator.clipboard.writeText(content.content);
      console.log("Content copied to clipboard");
    } catch (error) {
      console.error("Failed to copy content:", error);
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
      console.log("Publishing content:", content.title);
    } catch (error) {
      console.error("Failed to publish content:", error);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDeleteContent = async () => {
    setIsDeleting(true);
    try {
      // TODO: Implement delete logic
      console.log("Deleting content:", content.title);
      router.push("/content");
    } catch (error) {
      console.error("Failed to delete content:", error);
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

  // Build quick actions for sidebar - Content specific actions
  const quickActions: ActionButton[] = [
    {
      label: "Edit Content",
      icon: <Edit3 className="h-4 w-4" />,
      onClick: handleEditContent,
      variant: "default",
      tooltip: "Edit this content",
    },
    {
      label: isPublishing ? "Publishing..." : "Publish Now",
      icon: isPublishing ? undefined : <Zap className="h-4 w-4" />,
      onClick: handlePublishNow,
      variant: "default",
      disabled: content.status === "Published" || isPublishing,
      loading: isPublishing,
      tooltip:
        content.status === "Published"
          ? "Already published"
          : "Publish immediately",
    },
    {
      label: "Share Content",
      icon: <Share2 className="h-4 w-4" />,
      onClick: handleShareContent,
      variant: "outline",
      tooltip: "Share this content",
    },
    {
      label: "Copy Content",
      icon: <Copy className="h-4 w-4" />,
      onClick: handleCopyContent,
      variant: "outline",
      tooltip: "Copy content to clipboard",
    },
    {
      label: "Download",
      icon: <Download className="h-4 w-4" />,
      onClick: handleDownloadContent,
      variant: "outline",
      tooltip: "Download as text file",
    },
    {
      label: isDeleting ? "Deleting..." : "Delete Content",
      icon: isDeleting ? undefined : <Trash2 className="h-4 w-4" />,
      onClick: handleDeleteContent,
      variant: "destructive",
      disabled: isDeleting,
      loading: isDeleting,
      tooltip: "Permanently delete this content",
    },
  ];

  // Build sidebar content
  const sidebarContent = (
    <>
      {/* Content Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Views</span>
              <span className="text-sm font-medium">
                {content.engagement.views.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Likes</span>
              <span className="text-sm font-medium">
                {content.engagement.likes.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Shares</span>
              <span className="text-sm font-medium">
                {content.engagement.shares.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">SEO Score</span>
              <span className="text-sm font-medium">{content.seoScore}%</span>
            </div>
            <Progress value={content.seoScore} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Publication Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Publication Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Status</span>
            <Badge
              variant={
                content.status === "Published"
                  ? "default"
                  : content.status === "Scheduled"
                    ? "secondary"
                    : "outline"
              }
            >
              {content.status}
            </Badge>
          </div>

          {content.publishedTo && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                Published To
              </span>
              <span className="text-sm font-medium">{content.publishedTo}</span>
            </div>
          )}

          {content.publishDate && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Published</span>
              <span className="text-sm font-medium">
                {new Date(content.publishDate).toLocaleDateString()}
              </span>
            </div>
          )}

          {content.scheduledDate && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Scheduled</span>
              <span className="text-sm font-medium">
                {new Date(content.scheduledDate).toLocaleDateString()}
              </span>
            </div>
          )}

          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Flow</span>
            <span className="text-sm font-medium">{content.flowName}</span>
          </div>
        </CardContent>
      </Card>

      {/* Platforms */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Platforms</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {content.platforms.map((platform) => (
              <Badge key={platform} variant="outline" className="text-xs">
                {platform}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );

  return (
    <DetailPageWrapper
      title={content.title}
      subtitle={`${content.type} • ${content.readTime}`}
      description="View, edit, and manage this piece of content."
      breadcrumbs={breadcrumbs}
      backUrl="/content"
      backLabel="Back to Content"
      status={content.status}
      statusVariant={
        content.status === "Published"
          ? "default"
          : content.status === "Scheduled"
            ? "secondary"
            : "outline"
      }
      metadata={metadata}
      quickActions={quickActions}
      sidebar={sidebarContent}
    >
      {/* Main Content */}
      <div className="space-y-8">
        {/* Content Preview */}
        <div className="bg-gradient-to-br from-blue-50/60 via-indigo-50/40 to-purple-50/60 dark:from-blue-950/30 dark:via-indigo-950/20 dark:to-purple-950/30 rounded-xl p-6 border border-blue-200/60 dark:border-blue-800/60">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-foreground flex items-center gap-3">
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Content Preview
            </h3>
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
        </div>

        {/* Keywords & Tags */}
        {content.keywords && content.keywords.length > 0 && (
          <div className="bg-purple-50/30 dark:bg-purple-950/20 rounded-xl p-6 border border-purple-200/50 dark:border-purple-800/50">
            <h3 className="text-xl font-semibold mb-4 text-foreground flex items-center gap-3">
              <Hash className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              Keywords & Tags
            </h3>
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
          </div>
        )}

        {/* Content Analytics */}
        <div className="bg-green-50/50 dark:bg-green-950/20 rounded-xl p-6 border border-green-200/50 dark:border-green-800/50">
          <h3 className="text-xl font-semibold mb-4 text-foreground flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
            Content Analytics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {content.engagement.views.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Total Views</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {content.engagement.likes.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Likes</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {content.engagement.shares.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Shares</div>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-amber-50/40 dark:bg-amber-950/20 rounded-xl p-6 border border-amber-200/60 dark:border-amber-800/60">
          <h3 className="text-xl font-semibold mb-4 text-foreground flex items-center gap-3">
            <Calendar className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            Content Timeline
          </h3>
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
          </div>
        </div>
      </div>
    </DetailPageWrapper>
  );
}
