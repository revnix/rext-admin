"use client";

import { CheckCircle, ExternalLink, FileText, Repeat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCurrentWorkspace } from "@/stores/workspace";
import type { GeneratedTopic } from "@/types/topic-builder";
import { QuestionAnswerLayout } from "../layouts/question-answer-layout";

interface SelectedTopicDisplayProps {
  topic: GeneratedTopic;
  onChangeClick: () => void;
}

/**
 * Compact component that displays a selected topic with minimal details
 * and provides actions to change topic or view full details
 */
export function SelectedTopicDisplay({
  topic,
  onChangeClick,
}: SelectedTopicDisplayProps) {
  const currentWorkspace = useCurrentWorkspace();
  const workspaceSlug = currentWorkspace?.slug || "";

  const handleViewDetails = () => {
    window.open(`/workspaces/${workspaceSlug}/topics/${topic.id}`, "_blank");
  };

  return (
    <QuestionAnswerLayout
      question={{
        label: "Select Topic",
        description: "Choose the main topic for your content",
        icon: FileText,
      }}
    >
      <div className="flex items-center justify-between gap-3 p-3 border rounded-lg bg-muted/30">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="font-medium text-sm truncate">{topic.title}</p>
            <p className="text-xs text-muted-foreground">Selected topic</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleViewDetails}
            className="flex items-center gap-1.5"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            View Details
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onChangeClick}
            className="flex items-center gap-1.5"
          >
            <Repeat className="h-3.5 w-3.5" />
            Change
          </Button>
        </div>
      </div>
    </QuestionAnswerLayout>
  );
}
