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
import { DetailPageWrapper } from "@/components/detail-page-wrapper";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DetailCard } from "@/components/ui/detail-card";
import {
  DetailGrid,
  DetailGridItem,
  FourColumnGrid,
} from "@/components/ui/detail-grid";
import { SectionHeader } from "@/components/ui/section-header";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { usePageTitle } from "@/hooks/use-page-title";
import { useTopic } from "@/hooks/use-topics";
import { useTopicDeleteMutation } from "@/hooks/useTopicMutations";
import type { MetadataItem, SidebarConfig } from "@/types/detail-page";

export default function TopicDetailPage() {
  const params = useParams();
  const router = useRouter();
  const topicId = params.id as string;

  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch single topic data using the new endpoint
  const {
    data: topic,
    status,
    error,
    isLoading: isInitialLoading,
  } = useTopic(topicId);

  // Delete mutation
  const deleteMutation = useTopicDeleteMutation();

  // The topic data is already in the correct GeneratedTopic format
  const generatedTopic = topic;

  // Update page title and description dynamically
  usePageTitle(
    generatedTopic?.title || "Topic Detail",
    generatedTopic?.description ||
      generatedTopic?.angle ||
      `Topic details and analytics for ${generatedTopic?.title || "selected topic"}`,
  );

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
    console.log("Using topic for content creation:", generatedTopic?.title);
    // TODO: Navigate to content creation with topic prefilled
  };

  const handleDeleteTopic = async () => {
    if (!generatedTopic) return;
    setIsDeleting(true);
    try {
      await deleteMutation.mutateAsync([generatedTopic.id]);
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
    { label: generatedTopic?.title || "Topic Detail" },
  ];

  // Build metadata for the wrapper using GeneratedTopic structure
  const metadata: MetadataItem[] = generatedTopic
    ? [
        {
          label: "Tags",
          value: (
            <div className="flex flex-wrap gap-1">
              {generatedTopic.tags?.slice(0, 2).map((tag: string) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {(generatedTopic.tags?.length || 0) > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{(generatedTopic.tags?.length || 0) - 2} more
                </Badge>
              )}
            </div>
          ),
          icon: <Hash className="h-4 w-4" />,
        },
        {
          label: "Channel Fit",
          value: (
            <div className="flex flex-wrap gap-1">
              {generatedTopic.channel_fit
                ?.slice(0, 2)
                .map((channel: string) => (
                  <Badge key={channel} variant="outline" className="text-xs">
                    {channel}
                  </Badge>
                ))}
              {(generatedTopic.channel_fit?.length || 0) > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{(generatedTopic.channel_fit?.length || 0) - 2} more
                </Badge>
              )}
            </div>
          ),
          icon: <Globe className="h-4 w-4" />,
        },
        {
          label: "Overall Score",
          value: `${overallScore}%`,
          icon: <TrendingUp className="h-4 w-4" />,
        },
        {
          label: "Saved Status",
          value: (
            <Badge variant={generatedTopic.is_saved ? "default" : "secondary"}>
              {generatedTopic.is_saved ? "Saved" : "Not Saved"}
            </Badge>
          ),
          icon: <Target className="h-4 w-4" />,
        },
      ]
    : [];

  // Build header actions for page header
  const headerActions = (
    <div className="flex items-center gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button onClick={handleUseTopic} className="gap-2">
            <PenTool className="h-4 w-4" />
            Write Content
          </Button>
        </TooltipTrigger>
        <TooltipContent>Use this topic to create new content</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button onClick={handleCopyTopic} variant="outline" className="gap-2">
            <Copy className="h-4 w-4" />
            Copy
          </Button>
        </TooltipTrigger>
        <TooltipContent>Copy topic to clipboard</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={() => console.log("Save to collection")}
            variant="outline"
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            Save
          </Button>
        </TooltipTrigger>
        <TooltipContent>Save topic to collection</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={() => console.log("Edit topic")}
            variant="outline"
            size="sm"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Edit topic details</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={handleDeleteTopic}
            disabled={isDeleting || deleteMutation.isPending}
            variant="destructive"
            size="sm"
          >
            {isDeleting ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <Zap className="h-4 w-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>Delete this topic</TooltipContent>
      </Tooltip>
    </div>
  );

  // Build new flexible sidebar configuration
  const sidebarConfig: SidebarConfig = {
    cards: [
      // Score Card
      {
        type: "score",
        config: {
          score: overallScore,
          title: "Overall Score",
          description: "Quality Assessment",
          variant:
            overallScore >= 80
              ? "success"
              : overallScore >= 60
                ? "default"
                : "warning",
          content: (
            <div className="flex items-center justify-center gap-2">
              <div className="inline-flex h-5 w-5 items-center justify-center rounded-full text-white text-xs font-medium shadow-sm bg-green-500">
                <FileText className="h-3 w-3" />
              </div>
              <span className="text-sm text-muted-foreground">
                Saved to library
              </span>
            </div>
          ),
        },
      },
      // Stats Card
      {
        type: "stats",
        config: {
          title: "Topic Stats",
          items: [
            {
              label: "Status",
              value: (
                <Badge
                  variant={generatedTopic?.is_saved ? "default" : "secondary"}
                >
                  {generatedTopic?.is_saved ? "Saved" : "Not Saved"}
                </Badge>
              ),
              highlight: true,
            },
            {
              label: "Tags",
              value: `${generatedTopic?.tags?.length || 0} tags`,
            },
            {
              label: "Channels",
              value: `${generatedTopic?.channel_fit?.length || 0} channels`,
            },
            {
              label: "Audiences",
              value: `${generatedTopic?.audience_fit?.length || 0} audiences`,
            },
          ],
        },
      },
    ],
    order: ["cards", "metadata", "quickActions"], // Custom order
  };

  return (
    <DetailPageWrapper
      title={generatedTopic?.title || "Topic Detail"}
      breadcrumbs={breadcrumbs}
      status={generatedTopic?.is_saved ? "saved" : "not_saved"}
      statusVariant={generatedTopic?.is_saved ? "default" : "secondary"}
      metadata={metadata}
      headerActions={headerActions}
      sidebarConfig={sidebarConfig}
      isLoading={isInitialLoading}
      error={
        status === "error"
          ? error?.error || "Unknown error"
          : !isInitialLoading && !generatedTopic
            ? "Topic not found"
            : undefined
      }
    >
      {/* Main Content - Enhanced Visual Layout */}
      <div className="space-y-8">
        {/* Hero Section - Topic Overview with Angle */}
        <DetailGrid columns={12} gap="lg" responsive={{ sm: 1, lg: 12 }}>
          {/* Topic Overview - Takes 8 columns on large screens */}
          <DetailGridItem span={12} responsive={{ lg: 8 }} className="flex">
            <DetailCard
              variant="highlight"
              gradient
              className="flex-1 flex flex-col"
            >
              <SectionHeader
                title="Topic Overview"
                icon={<FileText className="w-5 h-5" />}
                variant="spacious"
                className="mb-4"
              />
              <div className="flex-1 flex items-start">
                <p className="text-base leading-relaxed text-muted-foreground">
                  {generatedTopic?.description ||
                    "No description available for this topic."}
                </p>
              </div>
            </DetailCard>
          </DetailGridItem>

          {/* Topic Angle - Takes 4 columns, acts as sidebar */}
          {generatedTopic?.angle && (
            <DetailGridItem span={12} responsive={{ lg: 4 }} className="flex">
              <DetailCard
                variant="info"
                gradient
                className="flex-1 flex flex-col"
              >
                <SectionHeader
                  title="Topic Angle"
                  icon={<Sparkles className="w-5 h-5" />}
                  variant="compact"
                  className="mb-4"
                />
                <div className="flex-1 flex items-start">
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {generatedTopic.angle}
                  </p>
                </div>
              </DetailCard>
            </DetailGridItem>
          )}
        </DetailGrid>

        {/* Why It Works - Full Width Emphasis */}
        {generatedTopic?.why_it_works && (
          <DetailCard variant="success" gradient>
            <SectionHeader
              title="Why This Topic Works"
              icon={<Target className="w-5 h-5" />}
              variant="spacious"
              className="mb-4"
            />
            <p className="text-base leading-relaxed text-muted-foreground">
              {generatedTopic.why_it_works}
            </p>
          </DetailCard>
        )}

        {/* Performance Scores - Prominent Full Width */}
        <DetailCard variant="info" gradient>
          <div className="flex items-start justify-between mb-6">
            <SectionHeader
              title="Performance Scores"
              icon={<TrendingUp className="w-5 h-5" />}
              variant="spacious"
            />
            <div className="text-xs text-muted-foreground bg-white/60 dark:bg-background/60 px-2 py-1 rounded-md border border-blue-200/40 dark:border-blue-700/40">
              Based on your configuration
            </div>
          </div>
          <FourColumnGrid gap="md">
            {[
              {
                label: "Relevance",
                value: Math.round(
                  (generatedTopic?.scores.relevance || 0) * 100,
                ),
                icon: Target,
                color: "text-primary",
              },
              {
                label: "SEO Potential",
                value: Math.round(
                  (generatedTopic?.scores.seo_potential || 0) * 100,
                ),
                icon: TrendingUp,
                color: "text-primary",
              },
              {
                label: "Trend Level",
                value: Math.round(
                  (generatedTopic?.scores.trend_level || 0) * 100,
                ),
                icon: Zap,
                color: "text-primary",
              },
              {
                label: "Uniqueness",
                value: Math.round(
                  (generatedTopic?.scores.uniqueness || 0) * 100,
                ),
                icon: Sparkles,
                color: "text-primary",
              },
              {
                label: "Reader Interest",
                value: Math.round(
                  (generatedTopic?.scores.reader_interest || 0) * 100,
                ),
                icon: Users,
                color: "text-primary",
              },
              {
                label: "Actionable Potential",
                value: Math.round(
                  (generatedTopic?.scores.actionable_potential || 0) * 100,
                ),
                icon: PenTool,
                color: "text-primary",
              },
              {
                label: "Brand Alignment",
                value: Math.round(
                  (generatedTopic?.scores.brand_alignment || 0) * 100,
                ),
                icon: Globe,
                color: "text-primary",
              },
              {
                label: "Controversy",
                value: Math.round(
                  (generatedTopic?.scores.controversy || 0) * 100,
                ),
                icon: Zap,
                color: "text-orange-500",
              },
            ].map((score) => {
              const IconComponent = score.icon;
              return (
                <div
                  key={score.label}
                  className="bg-white/80 dark:bg-background/80 rounded-xl p-4 text-center shadow-sm border border-muted/60 hover:border-muted/80 transition-colors"
                >
                  <div className="flex items-center justify-center mb-2">
                    <IconComponent className={`w-5 h-5 ${score.color} mr-1`} />
                    <div className={`text-2xl font-bold ${score.color}`}>
                      {score.value}%
                    </div>
                  </div>
                  <div className="text-xs font-medium text-muted-foreground">
                    {score.label}
                  </div>
                </div>
              );
            })}
          </FourColumnGrid>
        </DetailCard>

        {/* Keywords & Channel/Audience Fit - Strategic Bottom Section */}
        {((generatedTopic?.tags?.length ?? 0) > 0 ||
          (generatedTopic?.channel_fit?.length ?? 0) > 0 ||
          (generatedTopic?.audience_fit?.length ?? 0) > 0) && (
          <DetailGrid columns={3} gap="lg" responsive={{ sm: 1, md: 2, lg: 3 }}>
            {/* Keywords & Tags - Takes 1 column */}
            <DetailGridItem span={1} className="flex">
              {generatedTopic?.tags && generatedTopic.tags.length > 0 ? (
                <DetailCard
                  variant="accent"
                  gradient
                  className="flex-1 flex flex-col"
                >
                  <SectionHeader
                    title="Keywords & Tags"
                    icon={<Hash className="w-5 h-5" />}
                    variant="compact"
                    className="mb-4"
                  />
                  <div className="flex-1">
                    <div className="flex flex-wrap gap-2">
                      {generatedTopic.tags
                        .slice(0, 6)
                        .map((keyword: string) => (
                          <Badge
                            key={keyword}
                            variant="secondary"
                            className="text-sm px-4 py-2 bg-gradient-to-r from-white/90 to-purple-50/90 dark:from-background/90 dark:to-purple-900/20 border border-purple-200/60 dark:border-purple-700/60 hover:border-purple-300/80 dark:hover:border-purple-600/80 hover:shadow-sm transition-all duration-200 font-medium"
                          >
                            <Hash className="w-3 h-3 mr-1.5 text-purple-500" />
                            {keyword}
                          </Badge>
                        ))}
                      {generatedTopic.tags.length > 6 && (
                        <Badge variant="outline" className="text-sm">
                          +{generatedTopic.tags.length - 6} more
                        </Badge>
                      )}
                    </div>
                  </div>
                </DetailCard>
              ) : (
                <DetailCard variant="default" className="flex-1 flex flex-col">
                  <SectionHeader
                    title="Keywords & Tags"
                    icon={<Hash className="w-5 h-5" />}
                    variant="compact"
                    className="mb-4"
                  />
                  <div className="flex-1 flex items-start">
                    <p className="text-sm text-muted-foreground">
                      No keywords available.
                    </p>
                  </div>
                </DetailCard>
              )}
            </DetailGridItem>

            {/* Channel Fit - Takes 1 column */}
            <DetailGridItem span={1} className="flex">
              {(generatedTopic?.channel_fit?.length ?? 0) > 0 ? (
                <DetailCard
                  variant="info"
                  gradient
                  className="flex-1 flex flex-col"
                >
                  <SectionHeader
                    title="Best Channels"
                    icon={<Globe className="w-5 h-5" />}
                    variant="compact"
                    className="mb-4"
                  />
                  <div className="flex-1">
                    <div className="flex flex-wrap gap-2">
                      {generatedTopic?.channel_fit
                        ?.slice(0, 4)
                        .map((channel: string) => (
                          <Badge
                            key={channel}
                            variant="secondary"
                            className="text-sm px-4 py-2 bg-gradient-to-r from-blue-50/90 to-sky-50/90 dark:from-blue-950/30 dark:to-sky-950/30 border border-blue-200/60 dark:border-blue-700/60 hover:border-blue-300/80 dark:hover:border-blue-600/80 hover:shadow-sm transition-all duration-200 font-medium"
                          >
                            <Zap className="w-3 h-3 mr-1.5 text-blue-600 dark:text-blue-400" />
                            {channel}
                          </Badge>
                        ))}
                      {(generatedTopic?.channel_fit?.length ?? 0) > 4 && (
                        <Badge variant="outline" className="text-sm">
                          +{(generatedTopic?.channel_fit?.length ?? 0) - 4} more
                        </Badge>
                      )}
                    </div>
                  </div>
                </DetailCard>
              ) : (
                <DetailCard variant="default" className="flex-1 flex flex-col">
                  <SectionHeader
                    title="Best Channels"
                    icon={<Globe className="w-5 h-5" />}
                    variant="compact"
                    className="mb-4"
                  />
                  <div className="flex-1 flex items-start">
                    <p className="text-sm text-muted-foreground">
                      No channel data available.
                    </p>
                  </div>
                </DetailCard>
              )}
            </DetailGridItem>

            {/* Audience Fit - Takes 1 column */}
            <DetailGridItem span={1} className="flex">
              {(generatedTopic?.audience_fit?.length ?? 0) > 0 ? (
                <DetailCard variant="default" className="flex-1 flex flex-col">
                  <SectionHeader
                    title="Target Audience"
                    icon={<Users className="w-5 h-5" />}
                    variant="compact"
                    className="mb-4"
                  />
                  <div className="flex-1">
                    <div className="flex flex-wrap gap-2">
                      {generatedTopic?.audience_fit
                        ?.slice(0, 4)
                        .map((audience: string) => (
                          <Badge
                            key={audience}
                            variant="secondary"
                            className="text-sm px-4 py-2 bg-gradient-to-r from-emerald-50/90 to-green-50/90 dark:from-emerald-950/30 dark:to-green-950/30 border border-emerald-200/60 dark:border-emerald-700/60 hover:border-emerald-300/80 dark:hover:border-emerald-600/80 hover:shadow-sm transition-all duration-200 font-medium"
                          >
                            <Target className="w-3 h-3 mr-1.5 text-emerald-600 dark:text-emerald-400" />
                            {audience}
                          </Badge>
                        ))}
                      {(generatedTopic?.audience_fit?.length ?? 0) > 4 && (
                        <Badge variant="outline" className="text-sm">
                          +{(generatedTopic?.audience_fit?.length ?? 0) - 4}{" "}
                          more
                        </Badge>
                      )}
                    </div>
                  </div>
                </DetailCard>
              ) : (
                <DetailCard variant="default" className="flex-1 flex flex-col">
                  <SectionHeader
                    title="Target Audience"
                    icon={<Users className="w-5 h-5" />}
                    variant="compact"
                    className="mb-4"
                  />
                  <div className="flex-1 flex items-start">
                    <p className="text-sm text-muted-foreground">
                      No audience data available.
                    </p>
                  </div>
                </DetailCard>
              )}
            </DetailGridItem>
          </DetailGrid>
        )}
      </div>
    </DetailPageWrapper>
  );
}
