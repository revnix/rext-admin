"use client";

import { ArrowLeft, PenTool, Sparkles } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { PageLayout } from "@/components/page-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { GeneratedTopic } from "@/types/topic-builder";

function CreateFlowContent() {
  const searchParams = useSearchParams();
  const [topics, setTopics] = useState<GeneratedTopic[]>([]);
  const [loading, setLoading] = useState(true);

  // Get topic IDs from URL parameters
  const singleTopicId = searchParams.get("topicId");
  const multipleTopicIds = searchParams.get("topicIds");

  const topicIds = singleTopicId
    ? [singleTopicId]
    : multipleTopicIds?.split(",").filter(Boolean) || [];

  useEffect(() => {
    // Simulate loading topics from localStorage or API
    // In a real implementation, you would fetch the topic data
    // from your storage/API using the topicIds

    const loadTopics = async () => {
      try {
        // For now, create mock data based on topic IDs
        const mockTopics: GeneratedTopic[] = topicIds.map((id, index) => ({
          id,
          title: `Topic ${id}: Sample Content Topic`,
          description: `This is a sample description for topic ${id}. It contains detailed information about the content that will be created.`,
          angle: `Unique angle for topic ${id}`,
          why_it_works: `This works because it addresses key pain points and provides valuable insights for topic ${id}.`,
          tags: [`tag${index + 1}`, `content`, `topic-${id}`],
          scores: {
            relevance: 0.8 + index * 0.05,
            seo_potential: 0.75 + index * 0.02,
            trend_level: 0.7 + index * 0.03,
            uniqueness: 0.9 - index * 0.02,
            reader_interest: 0.85 + index * 0.01,
            actionable_potential: 0.8 + index * 0.03,
            brand_alignment: 0.82 + index * 0.02,
            controversy: 0.15 - index * 0.01,
          },
          audience_fit: [`audience-${index + 1}`, `target-group-${id}`],
          channel_fit: [`blog`, `social-media`],
          is_saved: false,
        }));

        setTopics(mockTopics);
      } catch (error) {
        console.error("Failed to load topics:", error);
      } finally {
        setLoading(false);
      }
    };

    if (topicIds.length > 0) {
      loadTopics();
    } else {
      setLoading(false);
    }
  }, [topicIds]);

  const breadcrumbs = [
    { label: "Automation", href: "/flows" },
    { label: "Flows", href: "/flows" },
    { label: "Create" },
  ];

  if (loading) {
    return (
      <PageLayout
        title="Create Content Flow"
        description="Setting up your content creation workflow..."
        breadcrumbs={breadcrumbs}
      >
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading topics...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Create Content Flow"
      description={
        topics.length === 1
          ? "Create content flow from the selected topic"
          : `Create content flow from ${topics.length} selected topics`
      }
      breadcrumbs={breadcrumbs}
    >
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/topics/create">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Topics
              </Link>
            </Button>
            {topicIds.length > 0 && (
              <Badge variant="secondary" className="gap-1">
                <Sparkles className="h-3 w-3" />
                {topics.length} topic{topics.length !== 1 ? "s" : ""} selected
              </Badge>
            )}
          </div>

          <Button className="gap-2">
            <PenTool className="h-4 w-4" />
            Start Creating
          </Button>
        </div>

        <Separator />

        {/* No Topics Selected State */}
        {topicIds.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <PenTool className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">
                  No Topics Selected
                </h3>
                <p className="text-muted-foreground mb-4">
                  Select topics from the topic generation page to create content
                  flows.
                </p>
                <Button asChild>
                  <Link href="/topics/create">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Browse Topics
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Selected Topics Display */}
        {topics.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Selected Topics</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {topics.map((topic) => (
                <Card key={topic.id}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base line-clamp-2">
                      {topic.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {topic.description}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {topic.tags?.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {topic.tags && topic.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{topic.tags.length - 3}
                        </Badge>
                      )}
                    </div>

                    {/* Scores */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>
                        Relevance: {Math.round(topic.scores.relevance * 10)}/10
                      </span>
                      <span>
                        Uniqueness: {Math.round(topic.scores.uniqueness * 10)}
                        /10
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Content Creation Placeholder */}
        {topics.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Content Creation Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <PenTool className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h4 className="text-lg font-semibold mb-2">
                  Content Flow Configuration
                </h4>
                <p className="text-muted-foreground mb-4">
                  This is where the content creation workflow will be
                  configured. Features coming soon include:
                </p>
                <ul className="text-left text-sm text-muted-foreground space-y-1 max-w-md mx-auto">
                  <li>
                    • Content type selection (blog post, social media, etc.)
                  </li>
                  <li>• Tone and style preferences</li>
                  <li>• Target audience customization</li>
                  <li>• AI model selection</li>
                  <li>• Output format options</li>
                  <li>• Scheduling and automation</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PageLayout>
  );
}

export default function CreateFlowPage() {
  return (
    <Suspense
      fallback={
        <PageLayout
          title="Create Content Flow"
          description="Loading content creation interface..."
          breadcrumbs={[
            { label: "Automation", href: "/flows" },
            { label: "Flows", href: "/flows" },
            { label: "Create" },
          ]}
        >
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </div>
        </PageLayout>
      }
    >
      <CreateFlowContent />
    </Suspense>
  );
}
