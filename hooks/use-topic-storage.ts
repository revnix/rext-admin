"use client";

import { useCallback, useEffect, useState } from "react";
import { log } from "@/lib/logger";
import type { GeneratedTopic } from "@/types/topic-builder";

const SAVED_TOPICS_KEY = "saved-topics";

interface UseTopicStorageReturn {
  savedTopics: GeneratedTopic[];
  saveTopic: (topic: GeneratedTopic) => void;
  removeTopic: (id: string) => void;
  updateTopic: (id: string, updates: Partial<GeneratedTopic>) => void;
  exportTopics: (format: "json" | "csv") => void;
  clearAllTopics: () => void;
  isTopicSaved: (id: string) => boolean;
  saveTopics: (topics: GeneratedTopic[]) => void;
  getTopicById: (id: string) => GeneratedTopic | undefined;
  error: string | null;
  clearError: () => void;
}

export const useTopicStorage = (): UseTopicStorageReturn => {
  const [savedTopics, setSavedTopics] = useState<GeneratedTopic[]>([]);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const loadTopicsFromStorage = useCallback((): GeneratedTopic[] => {
    if (typeof window === "undefined") return [];

    try {
      const stored = localStorage.getItem(SAVED_TOPICS_KEY);
      if (stored) {
        const topics: GeneratedTopic[] = JSON.parse(stored);
        return Array.isArray(topics) ? topics : [];
      }
    } catch (error) {
      log.warn("Failed to load saved topics from localStorage:", error);
      setError("Failed to load saved topics. Storage may be corrupted.");
    }

    return [];
  }, []);

  const saveTopicsToStorage = useCallback((topics: GeneratedTopic[]) => {
    if (typeof window === "undefined") return;

    try {
      localStorage.setItem(SAVED_TOPICS_KEY, JSON.stringify(topics));
      setError(null);
    } catch (error) {
      log.warn("Failed to save topics to localStorage:", error);
      setError("Failed to save topics. Storage may be full or unavailable.");
    }
  }, []);

  useEffect(() => {
    const loadedTopics = loadTopicsFromStorage();
    setSavedTopics(loadedTopics);
  }, [loadTopicsFromStorage]);

  useEffect(() => {
    saveTopicsToStorage(savedTopics);
  }, [savedTopics, saveTopicsToStorage]);

  const saveTopic = useCallback((topic: GeneratedTopic) => {
    setSavedTopics((prev) => {
      if (prev.some((t) => t.id === topic.id)) {
        return prev;
      }

      const updatedTopic = { ...topic, is_saved: true };
      return [...prev, updatedTopic];
    });
  }, []);

  const saveTopics = useCallback((topics: GeneratedTopic[]) => {
    setSavedTopics((prev) => {
      const existingIds = new Set(prev.map((t) => t.id));
      const newTopics = topics.filter((topic) => !existingIds.has(topic.id));
      const updatedTopics = newTopics.map((topic) => ({
        ...topic,
        is_saved: true,
      }));

      return [...prev, ...updatedTopics];
    });
  }, []);

  const removeTopic = useCallback((id: string) => {
    setSavedTopics((prev) => prev.filter((topic) => topic.id !== id));
  }, []);

  const updateTopic = useCallback(
    (id: string, updates: Partial<GeneratedTopic>) => {
      setSavedTopics((prev) =>
        prev.map((topic) =>
          topic.id === id ? { ...topic, ...updates } : topic,
        ),
      );
    },
    [],
  );

  const exportTopics = useCallback(
    (format: "json" | "csv" = "json") => {
      if (savedTopics.length === 0) {
        setError("No topics to export");
        return;
      }

      try {
        if (format === "json") {
          const dataStr = JSON.stringify(savedTopics, null, 2);
          const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;

          const exportFileDefaultName = `topic-topics-${new Date().toISOString().slice(0, 10)}.json`;

          const linkElement = document.createElement("a");
          linkElement.setAttribute("href", dataUri);
          linkElement.setAttribute("download", exportFileDefaultName);
          linkElement.click();
        } else if (format === "csv") {
          const headers = ["Title", "Description"];

          const csvRows = savedTopics.map((topic) => [
            `"${(topic.topic_name || topic.title).replace(/"/g, '""')}"`,
            `"${(topic.description ?? "").replace(/"/g, '""')}"`,
          ]);

          const csvContent = [
            headers.join(","),
            ...csvRows.map((row) => row.join(",")),
          ].join("\n");

          const dataUri = `data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`;
          const exportFileDefaultName = `topic-topics-${new Date().toISOString().slice(0, 10)}.csv`;

          const linkElement = document.createElement("a");
          linkElement.setAttribute("href", dataUri);
          linkElement.setAttribute("download", exportFileDefaultName);
          linkElement.click();
        }

        setError(null);
      } catch (error) {
        log.error("Export failed:", error);
        setError(`Failed to export topics as ${format.toUpperCase()}`);
      }
    },
    [savedTopics],
  );

  const clearAllTopics = useCallback(() => {
    setSavedTopics([]);
  }, []);

  const isTopicSaved = useCallback(
    (id: string): boolean => {
      return savedTopics.some((topic) => topic.id === id);
    },
    [savedTopics],
  );

  const getTopicById = useCallback(
    (id: string): GeneratedTopic | undefined => {
      return savedTopics.find((topic) => topic.id === id);
    },
    [savedTopics],
  );

  return {
    savedTopics,
    saveTopic,
    removeTopic,
    updateTopic,
    exportTopics,
    clearAllTopics,
    isTopicSaved,
    saveTopics,
    getTopicById,
    error,
    clearError,
  };
};
