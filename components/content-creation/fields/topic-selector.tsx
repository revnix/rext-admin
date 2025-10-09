"use client";

import { FileText, Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { GeneratedTopic } from "@/types/topic-builder";
import { QuestionAnswerLayout } from "../layouts/question-answer-layout";
import { SelectedTopicDisplay } from "./selected-topic-display";
import { TopicPickerModal } from "./topic-picker-modal";

interface TopicSelectorProps {
  selectedTopic?: GeneratedTopic | null;
  onTopicSelect: (topic: GeneratedTopic) => void;
  hasError?: boolean;
  errorMessage?: string;
}

/**
 * Component that handles topic selection with modal picker
 */
export function TopicSelector({
  selectedTopic,
  onTopicSelect,
  hasError = false,
  errorMessage,
}: TopicSelectorProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleTopicSelect = (topic: GeneratedTopic) => {
    onTopicSelect(topic);
    setIsModalOpen(false);
  };

  // If topic is selected, show the detailed display
  if (selectedTopic) {
    return (
      <>
        <SelectedTopicDisplay
          topic={selectedTopic}
          onChangeClick={handleOpenModal}
        />
        <TopicPickerModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSelectTopic={handleTopicSelect}
          selectedTopicId={selectedTopic.id}
        />
      </>
    );
  }

  // If no topic selected, show the choose topic card
  return (
    <>
      <QuestionAnswerLayout
        question={{
          label: "Select Topic",
          description: "Choose the main topic for your content",
          icon: FileText,
        }}
        hasError={hasError}
        error={errorMessage}
      >
        <div className="flex flex-col items-start gap-3">
          <p className="text-sm text-muted-foreground">
            Browse and select from your library of topics to get started
          </p>
          <Button
            onClick={handleOpenModal}
            size="default"
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Choose Topic
          </Button>
        </div>
      </QuestionAnswerLayout>

      <TopicPickerModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSelectTopic={handleTopicSelect}
        selectedTopicId={undefined}
      />
    </>
  );
}
