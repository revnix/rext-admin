"use client";

import {
  Copy,
  Edit2,
  FileText,
  Globe,
  Hash,
  PenTool,
  Save,
  Sparkles,
  Target,
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CircularProgress } from "@/components/ui/progress";
import { useTopics } from "@/hooks/use-topics";
import { useTopicDeleteMutation } from "@/hooks/useTopicMutations";
import type { TopicData } from "@/types/data-table";
import type { GeneratedTopic } from "@/types/topic-builder";

export default function TopicDetailPage() {
  const params = useParams();
  const router = useRouter();
  const topicId = params.id as string;

  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch topics data to find the specific topic
  const { data: topics = [], status, error, isInitialLoading } = useTopics();

  // Delete mutation
  const deleteMutation = useTopicDeleteMutation();

  // Find the current topic
  const topic = topics.find((t: TopicData) => t.id === topicId);

  // Transform topic data to match GeneratedTopic structure from drawer
  const generateTopicFromData = (
    topicData: TopicData,
  ): GeneratedTopic | null => {
    if (!topicData) return null;
    return {
      id: topicData.id,
      title: topicData.name,
      angle: topicData.description || topicData.name,
      description: topicData.description,
      channel_fit: ["Blog", "Social Media", "Email", "Newsletter"],
      audience_fit: [
        "Content Creators",
        "Marketers",
        "Business Owners",
        "Entrepreneurs",
      ],
      why_it_works:
        "This topic combines high engagement potential with practical value, making it perfect for building thought leadership while driving meaningful discussions with your target audience.",
      scores: {
        relevance: topicData.score || 0.85,
        seo_potential: 0.78,
        trend_level: 0.82,
        uniqueness: 0.8,
        reader_interest: 0.88,
        actionable_potential: 0.75,
        brand_alignment: 0.83,
        controversy: 0.25,
      },
      tags: topicData.tags || [
        "content marketing",
        "strategy",
        "engagement",
        "audience",
        "growth",
      ],
      is_saved: true,
      _optimisticSaved: false,
      _isBeingSaved: false,
    };
  };

  const generatedTopic = topic ? generateTopicFromData(topic) : null;

  // Calculate overall score
  const overallScore = generatedTopic
    ? Math.round(
        ((generatedTopic.scores.relevance +
          generatedTopic.scores.seo_potential +
          generatedTopic.scores.trend_level +
          generatedTopic.scores.uniqueness +
          generatedTopic.scores.reader_interest +
          generatedTopic.scores.actionable_potential +
          generatedTopic.scores.brand_alignment +
          generatedTopic.scores.controversy) /
          8) *
          100,
      )
    : 0;

  // Handle topic actions
  const handleCopyTopic = async () => {
    if (!generatedTopic) return;
    try {
      await navigator.clipboard.writeText(
        `${generatedTopic.title}\n\n${generatedTopic.description || generatedTopic.angle}\n\nWhy it works: ${generatedTopic.why_it_works}`,
      );
    } catch (error) {
      console.error("Failed to copy topic:", error);
    }
  };

  const handleUseTopic = () => {
    console.log("Using topic for content creation:", topic?.name);
    // TODO: Navigate to content creation with topic prefilled
  };

  const handleDeleteTopic = async () => {
    if (!topic) return;
    setIsDeleting(true);
    try {
      await deleteMutation.mutateAsync([topic.id]);
      router.push("/topics");
    } catch (error) {
      console.error("Failed to delete topic:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Build breadcrumbs
  const breadcrumbs = [
    { label: "Library", href: "#" },
    { label: "Topics", href: "/topics" },
    { label: topic?.name || "Topic Detail" },
  ];

  // Build metadata for the wrapper
  const metadata: MetadataItem[] = topic
    ? [
        {
          label: "Category",
          value: <Badge variant="secondary">{topic.category}</Badge>,
          icon: <Hash className="h-4 w-4" />,
        },
        {
          label: "Content Type",
          value: <Badge variant="outline">{topic.contentType}</Badge>,
          icon: <Globe className="h-4 w-4" />,
        },
        {
          label: "Priority",
          value: topic.priority ? (
            <Badge
              variant={
                topic.priority === "high"
                  ? "destructive"
                  : topic.priority === "medium"
                    ? "default"
                    : "secondary"
              }
              className="capitalize"
            >
              {topic.priority}
            </Badge>
          ) : (
            <span className="text-muted-foreground">Not set</span>
          ),
          icon: <Target className="h-4 w-4" />,
        },
        {
          label: "Score",
          value: `${Math.round((topic.score || 0) * 100)}%`,
          icon: <TrendingUp className="h-4 w-4" />,
        },
        {
          label: "Created",
          value: new Date(topic.updated || Date.now()).toLocaleDateString(),
        },
        {
          label: "Ranking",
          value: `#${topic.ranking || "N/A"}`,
        },
      ]
    : [];

  // Build quick actions for sidebar
  const quickActions: ActionButton[] = [
    {
      label: "Write Content",
      icon: <PenTool className="h-4 w-4" />,
      onClick: handleUseTopic,
      variant: "default",
      tooltip: "Create content with this topic",
    },
    {
      label: "Save to Collection",
      icon: <Save className="h-4 w-4" />,
      onClick: () => console.log("Save to collection"),
      variant: "outline",
      tooltip: "Add to a content collection",
    },
    {
      label: "Copy Topic",
      icon: <Copy className="h-4 w-4" />,
      onClick: handleCopyTopic,
      variant: "outline",
      tooltip: "Copy topic details to clipboard",
    },
    {
      label: "Edit Topic",
      icon: <Edit2 className="h-4 w-4" />,
      onClick: () => console.log("Edit topic"),
      variant: "outline",
      tooltip: "Edit topic details",
    },
    {
      label: isDeleting ? "Deleting..." : "Delete Topic",
      icon: isDeleting ? undefined : <Zap className="h-4 w-4" />,
      onClick: handleDeleteTopic,
      variant: "destructive",
      disabled: isDeleting || deleteMutation.isPending,
      loading: isDeleting,
      tooltip: "Permanently delete this topic",
    },
  ];

  // Build sidebar content
  const sidebarContent = (
    <>
      {/* Overall Score Card */}
      <Card>
        <CardHeader className="text-center pb-4">
          <div className="flex items-center justify-center mb-4">
            <CircularProgress
              value={overallScore}
              size="lg"
              className="text-primary"
            />
          </div>
          <CardTitle className="text-lg">Overall Score</CardTitle>
          <CardDescription>
            <div className="text-2xl font-bold text-primary mt-1">
              {overallScore}%
            </div>
            <div className="text-sm text-muted-foreground">
              Quality Assessment
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0 text-center">
          <div className="flex items-center justify-center gap-2">
            <div className="inline-flex h-5 w-5 items-center justify-center rounded-full text-white text-xs font-medium shadow-sm bg-green-500">
              <FileText className="h-3 w-3" />
            </div>
            <span className="text-sm text-muted-foreground">
              Saved to library
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Topic Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Topic Stats</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Created</span>
            <span className="text-sm font-medium">
              {new Date(topic?.updated || Date.now()).toLocaleDateString()}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Ranking</span>
            <Badge variant="outline">#{topic?.ranking || "N/A"}</Badge>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              Used in Content
            </span>
            <span className="text-sm font-medium">0 times</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Category</span>
            <Badge variant="secondary" className="text-xs">
              {topic?.category}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </>
  );

  return (
    <DetailPageWrapper
      title={topic?.name || "Topic Detail"}
      subtitle={generatedTopic?.angle}
      description="View and manage this topic's details, or use it to create new content."
      breadcrumbs={breadcrumbs}
      backUrl="/topics"
      backLabel="Back to Topics"
      status={topic?.status}
      statusVariant={
        topic?.status === "published"
          ? "default"
          : topic?.status === "draft"
            ? "secondary"
            : "outline"
      }
      metadata={metadata}
      quickActions={quickActions}
      sidebar={sidebarContent}
      isLoading={isInitialLoading}
      error={status === "error" ? error : topic ? undefined : "Topic not found"}
    >
      {/* Main Content - Only the core sections from drawer */}
      <div className="space-y-8">
        {/* Topic Overview - From drawer */}
        <div className="bg-gradient-to-br from-blue-50/60 via-indigo-50/40 to-purple-50/60 dark:from-blue-950/30 dark:via-indigo-950/20 dark:to-purple-950/30 rounded-xl p-6 border border-blue-200/60 dark:border-blue-800/60">
          <h3 className="text-xl font-semibold text-foreground flex items-center gap-3 mb-4">
            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Topic Overview
          </h3>
          <p className="text-base leading-relaxed text-muted-foreground">
            {generatedTopic?.description ||
              generatedTopic?.angle ||
              "No description available for this topic."}
          </p>
        </div>

        {/* Why It Works - From drawer */}
        {generatedTopic?.why_it_works && (
          <div className="bg-green-50/50 dark:bg-green-950/20 rounded-xl p-6 border border-green-200/50 dark:border-green-800/50">
            <h3 className="text-xl font-semibold mb-4 text-foreground flex items-center gap-3">
              <Target className="w-5 h-5 text-green-600 dark:text-green-400" />
              Why This Topic Works
            </h3>
            <p className="text-base leading-relaxed text-muted-foreground">
              {generatedTopic.why_it_works}
            </p>
          </div>
        )}

        {/* Performance Scores - From drawer */}
        <div className="bg-blue-50/30 dark:bg-blue-950/20 rounded-xl p-6 border border-blue-200/50 dark:border-blue-800/50">
          <div className="flex items-start justify-between mb-6">
            <h3 className="text-xl font-semibold text-foreground flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Performance Scores
            </h3>
            <div className="text-xs text-muted-foreground bg-white/60 dark:bg-background/60 px-2 py-1 rounded-md border border-blue-200/40 dark:border-blue-700/40">
              Based on your configuration
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white/80 dark:bg-background/80 rounded-xl p-4 text-center shadow-sm border border-muted/60 hover:border-muted/80 transition-colors">
              <div className="flex items-center justify-center mb-2">
                <Target className="w-5 h-5 text-primary mr-1" />
                <div className="text-2xl font-bold text-primary">
                  {Math.round((generatedTopic?.scores.relevance || 0) * 100)}%
                </div>
              </div>
              <div className="text-xs font-medium text-muted-foreground">
                Relevance
              </div>
            </div>
            <div className="bg-white/80 dark:bg-background/80 rounded-xl p-4 text-center shadow-sm border border-muted/60 hover:border-muted/80 transition-colors">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="w-5 h-5 text-primary mr-1" />
                <div className="text-2xl font-bold text-primary">
                  {Math.round(
                    (generatedTopic?.scores.seo_potential || 0) * 100,
                  )}
                  %
                </div>
              </div>
              <div className="text-xs font-medium text-muted-foreground">
                SEO Potential
              </div>
            </div>
            <div className="bg-white/80 dark:bg-background/80 rounded-xl p-4 text-center shadow-sm border border-muted/60 hover:border-muted/80 transition-colors">
              <div className="flex items-center justify-center mb-2">
                <Zap className="w-5 h-5 text-primary mr-1" />
                <div className="text-2xl font-bold text-primary">
                  {Math.round((generatedTopic?.scores.trend_level || 0) * 100)}%
                </div>
              </div>
              <div className="text-xs font-medium text-muted-foreground">
                Trend Level
              </div>
            </div>
            <div className="bg-white/80 dark:bg-background/80 rounded-xl p-4 text-center shadow-sm border border-muted/60 hover:border-muted/80 transition-colors">
              <div className="flex items-center justify-center mb-2">
                <Sparkles className="w-5 h-5 text-primary mr-1" />
                <div className="text-2xl font-bold text-primary">
                  {Math.round((generatedTopic?.scores.uniqueness || 0) * 100)}%
                </div>
              </div>
              <div className="text-xs font-medium text-muted-foreground">
                Uniqueness
              </div>
            </div>
            <div className="bg-white/80 dark:bg-background/80 rounded-xl p-4 text-center shadow-sm border border-muted/60 hover:border-muted/80 transition-colors">
              <div className="flex items-center justify-center mb-2">
                <Users className="w-5 h-5 text-primary mr-1" />
                <div className="text-2xl font-bold text-primary">
                  {Math.round(
                    (generatedTopic?.scores.reader_interest || 0) * 100,
                  )}
                  %
                </div>
              </div>
              <div className="text-xs font-medium text-muted-foreground">
                Reader Interest
              </div>
            </div>
            <div className="bg-white/80 dark:bg-background/80 rounded-xl p-4 text-center shadow-sm border border-muted/60 hover:border-muted/80 transition-colors">
              <div className="flex items-center justify-center mb-2">
                <PenTool className="w-5 h-5 text-primary mr-1" />
                <div className="text-2xl font-bold text-primary">
                  {Math.round(
                    (generatedTopic?.scores.actionable_potential || 0) * 100,
                  )}
                  %
                </div>
              </div>
              <div className="text-xs font-medium text-muted-foreground">
                Actionable Potential
              </div>
            </div>
            <div className="bg-white/80 dark:bg-background/80 rounded-xl p-4 text-center shadow-sm border border-muted/60 hover:border-muted/80 transition-colors">
              <div className="flex items-center justify-center mb-2">
                <Globe className="w-5 h-5 text-primary mr-1" />
                <div className="text-2xl font-bold text-primary">
                  {Math.round(
                    (generatedTopic?.scores.brand_alignment || 0) * 100,
                  )}
                  %
                </div>
              </div>
              <div className="text-xs font-medium text-muted-foreground">
                Brand Alignment
              </div>
            </div>
            <div className="bg-white/80 dark:bg-background/80 rounded-xl p-4 text-center shadow-sm border border-muted/60 hover:border-muted/80 transition-colors">
              <div className="flex items-center justify-center mb-2">
                <Zap className="w-5 h-5 text-orange-500 mr-1" />
                <div className="text-2xl font-bold text-orange-500">
                  {Math.round((generatedTopic?.scores.controversy || 0) * 100)}%
                </div>
              </div>
              <div className="text-xs font-medium text-muted-foreground">
                Controversy
              </div>
            </div>
          </div>
        </div>

        {/* Keywords & Tags - From drawer */}
        {generatedTopic?.tags && generatedTopic.tags.length > 0 && (
          <div className="bg-purple-50/30 dark:bg-purple-950/20 rounded-xl p-6 border border-purple-200/50 dark:border-purple-800/50">
            <h3 className="text-xl font-semibold mb-4 text-foreground flex items-center gap-3">
              <Hash className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              Keywords & Tags
            </h3>
            <div className="flex flex-wrap gap-3">
              {generatedTopic.tags.map((keyword) => (
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

        {/* Channel and Audience Fit - From drawer */}
        {((generatedTopic?.channel_fit?.length ?? 0) > 0 ||
          (generatedTopic?.audience_fit?.length ?? 0) > 0) && (
          <div className="bg-gradient-to-br from-amber-50/40 via-orange-50/30 to-rose-50/40 dark:from-amber-950/20 dark:via-orange-950/15 dark:to-rose-950/20 rounded-xl p-6 border border-amber-200/60 dark:border-amber-800/60">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {(generatedTopic?.channel_fit?.length ?? 0) > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-foreground flex items-center gap-3">
                    <Globe className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    Best Channels
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {generatedTopic?.channel_fit?.map((channel) => (
                      <div
                        key={channel}
                        className="bg-white/90 dark:bg-background/90 rounded-lg px-3 py-2 text-sm border-2 border-slate-300/80 dark:border-slate-600/80 hover:border-slate-400 dark:hover:border-slate-500 hover:shadow-md transition-all duration-200 font-medium text-foreground"
                      >
                        {channel}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(generatedTopic?.audience_fit?.length ?? 0) > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-foreground flex items-center gap-3">
                    <Users className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    Target Audience
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {generatedTopic?.audience_fit?.map((audience) => (
                      <div
                        key={audience}
                        className="bg-white/90 dark:bg-background/90 rounded-lg px-3 py-2 text-sm border-2 border-slate-300/80 dark:border-slate-600/80 hover:border-slate-400 dark:hover:border-slate-500 hover:shadow-md transition-all duration-200 font-medium text-foreground"
                      >
                        {audience}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DetailPageWrapper>
  );
}
