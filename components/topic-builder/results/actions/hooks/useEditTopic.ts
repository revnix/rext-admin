/**
 * Hook for editing a topic
 */

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { classifyError } from "@/lib/error-utils";
import { log } from "@/lib/logger";
import { type TopicEditFormData, topicEditFormSchema } from "@/types/forms";
import type { GeneratedTopic } from "@/types/topic-builder";
import type { ActionResult } from "../types";

export function useEditTopic(topic: GeneratedTopic) {
  const [isEditing, setIsEditing] = useState(false);

  const editForm = useForm<TopicEditFormData>({
    resolver: zodResolver(topicEditFormSchema),
    defaultValues: {
      title: topic.title,
      angle: topic.angle || "",
      description: topic.description || "",
      why_it_works: topic.why_it_works || "",
      tags: topic.tags?.join(", ") || "",
    },
  });

  const editTopic = async (
    formData: TopicEditFormData,
    onEdit?: (
      topicId: string,
      updates: Partial<GeneratedTopic>,
    ) => Promise<void> | void,
  ): Promise<ActionResult> => {
    if (!onEdit) {
      return {
        success: false,
        message: "No edit handler provided",
      };
    }

    setIsEditing(true);

    try {
      const updates: Partial<GeneratedTopic> = {
        title: formData.title,
        angle: formData.angle,
        description: formData.description,
        why_it_works: formData.why_it_works,
        tags: formData.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      };

      await onEdit(topic.id, updates);

      // Reset form after successful submission
      editForm.reset();

      return {
        success: true,
        message: "Topic updated successfully!",
      };
    } catch (error) {
      log.error(`Failed to update topic ${topic.id}:`, error);
      const classifiedError = classifyError(error);

      return {
        success: false,
        error: classifiedError,
        message: "Failed to update topic",
      };
    } finally {
      setIsEditing(false);
    }
  };

  return {
    editTopic,
    isEditing,
    editForm,
    errors: editForm.formState.errors,
  };
}
