"use client";

import { FileText, Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { GeneratedTopic } from "@/types/topic-builder";
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
      <Card className={`wizard-card ${hasError ? "wizard-card-error" : ""}`}>
        <CardHeader className="pb-4">
          <CardTitle className="wizard-field-label">
            <FileText className="h-5 w-5 text-primary" />
            Select Topic
          </CardTitle>
          <CardDescription className="wizard-field-description">
            Choose the main topic you want to create content about
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Choose Your Topic</h3>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                Browse and select from our library of approved topics to get
                started with content creation.
              </p>
            </div>

            <Button
              onClick={handleOpenModal}
              size="lg"
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Choose Topic
            </Button>
          </div>

          {/* Validation error */}
          {hasError && errorMessage && (
            <div className="wizard-field-error mt-4">
              <FileText className="h-4 w-4" />
              {errorMessage}
            </div>
          )}
        </CardContent>
      </Card>

      <TopicPickerModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSelectTopic={handleTopicSelect}
        selectedTopicId={undefined}
      />
    </>
  );
}
