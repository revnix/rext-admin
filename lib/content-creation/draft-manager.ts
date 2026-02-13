import { log } from "@/lib/logger";
import { safeJsonParse } from "@/lib/utils";

/**
 * Draft Management System
 *
 * This module provides comprehensive draft saving, loading, and management
 * functionality for the content creation wizard.
 */

import type {
  ContentCreationFormData,
  PartialContentCreationFormData,
} from "@/types/content-creation";

// ============================================================================
// TYPES
// ============================================================================

export interface Draft {
  /** Unique draft ID */
  id: string;
  /** Draft title/name */
  title: string;
  /** Form data */
  formData: PartialContentCreationFormData;
  /** Creation timestamp */
  createdAt: string;
  /** Last modified timestamp */
  updatedAt: string;
  /** Completion percentage */
  completionPercentage: number;
  /** Current step when saved */
  currentStep: number;
  /** Version number for conflict resolution */
  version: number;
  /** Metadata */
  metadata?: {
    platform?: string;
    contentType?: string;
    industry?: string;
    tags?: string[];
  };
}

export interface DraftSaveOptions {
  /** Manual save (user-initiated) or auto-save */
  isAutoSave?: boolean;
  /** Force save even if no changes detected */
  forceSave?: boolean;
  /** Custom draft title */
  title?: string;
  /** Additional metadata */
  metadata?: Draft["metadata"];
}

export interface DraftLoadOptions {
  /** Whether to merge with current data or replace */
  mergeWithCurrent?: boolean;
  /** Fields to exclude from loading */
  excludeFields?: (keyof ContentCreationFormData)[];
}

export interface AutoSaveConfig {
  /** Auto-save interval in milliseconds */
  interval: number;
  /** Maximum number of drafts to keep */
  maxDrafts: number;
  /** Minimum completion percentage for auto-save */
  minCompletionForAutoSave: number;
  /** Whether auto-save is enabled */
  enabled: boolean;
}

// ============================================================================
// DRAFT STORAGE INTERFACE
// ============================================================================

export interface DraftStorage {
  /** Save a draft */
  saveDraft(draft: Draft): Promise<void>;
  /** Load a draft by ID */
  loadDraft(id: string): Promise<Draft | null>;
  /** List all drafts */
  listDrafts(): Promise<Draft[]>;
  /** Delete a draft */
  deleteDraft(id: string): Promise<void>;
  /** Clear all drafts */
  clearAllDrafts(): Promise<void>;
  /** Get storage usage info */
  getStorageInfo(): Promise<{ used: number; available: number }>;
}

// ============================================================================
// LOCAL STORAGE IMPLEMENTATION
// ============================================================================

export class LocalStorageDraftStorage implements DraftStorage {
  private readonly storageKey = "content-creation-drafts";
  private readonly maxStorageSize = 5 * 1024 * 1024; // 5MB

  async saveDraft(draft: Draft): Promise<void> {
    try {
      const drafts = await this.listDrafts();
      const existingIndex = drafts.findIndex((d) => d.id === draft.id);

      if (existingIndex >= 0) {
        drafts[existingIndex] = draft;
      } else {
        drafts.push(draft);
      }

      // Sort by updatedAt (most recent first)
      drafts.sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );

      const serialized = JSON.stringify(drafts);

      // Check storage size
      if (serialized.length > this.maxStorageSize) {
        throw new Error("Storage quota exceeded. Please delete some drafts.");
      }

      localStorage.setItem(this.storageKey, serialized);
    } catch (error) {
      log.error("Failed to save draft:", error);
      throw error;
    }
  }

  async loadDraft(id: string): Promise<Draft | null> {
    try {
      const drafts = await this.listDrafts();
      return drafts.find((d) => d.id === id) || null;
    } catch (error) {
      log.error("Failed to load draft:", error);
      return null;
    }
  }

  async listDrafts(): Promise<Draft[]> {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return [];

      const drafts = safeJsonParse<Draft[]>(stored, []) ?? [];

      // Validate draft format and remove corrupted entries
      return drafts.filter((draft) => {
        return (
          draft &&
          typeof draft.id === "string" &&
          typeof draft.title === "string" &&
          typeof draft.formData === "object" &&
          typeof draft.createdAt === "string" &&
          typeof draft.updatedAt === "string"
        );
      });
    } catch (error) {
      log.error("Failed to list drafts:", error);
      return [];
    }
  }

  async deleteDraft(id: string): Promise<void> {
    try {
      const drafts = await this.listDrafts();
      const filteredDrafts = drafts.filter((d) => d.id !== id);
      localStorage.setItem(this.storageKey, JSON.stringify(filteredDrafts));
    } catch (error) {
      log.error("Failed to delete draft:", error);
      throw error;
    }
  }

  async clearAllDrafts(): Promise<void> {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      log.error("Failed to clear drafts:", error);
      throw error;
    }
  }

  async getStorageInfo(): Promise<{ used: number; available: number }> {
    try {
      const stored = localStorage.getItem(this.storageKey);
      const used = stored ? stored.length : 0;
      return {
        used,
        available: this.maxStorageSize - used,
      };
    } catch (error) {
      log.error("Failed to get storage info:", error);
      return { used: 0, available: this.maxStorageSize };
    }
  }
}

// ============================================================================
// DRAFT MANAGER CLASS
// ============================================================================

export class DraftManager {
  private storage: DraftStorage;
  private autoSaveTimer: NodeJS.Timeout | null = null;
  private config: AutoSaveConfig;
  private lastSavedData: string | null = null;

  constructor(
    storage: DraftStorage = new LocalStorageDraftStorage(),
    config: Partial<AutoSaveConfig> = {},
  ) {
    this.storage = storage;
    this.config = {
      interval: 30000, // 30 seconds
      maxDrafts: 10,
      minCompletionForAutoSave: 25,
      enabled: true,
      ...config,
    };
  }

  /**
   * Save draft with comprehensive conflict detection
   */
  async saveDraft(
    formData: PartialContentCreationFormData,
    currentStep: number,
    completionPercentage: number,
    options: DraftSaveOptions = {},
  ): Promise<Draft> {
    const {
      isAutoSave = false,
      forceSave = false,
      title,
      metadata = {},
    } = options;

    // Check if data has actually changed (avoid unnecessary saves)
    const currentDataString = JSON.stringify(formData);
    if (!forceSave && currentDataString === this.lastSavedData) {
      throw new Error("No changes detected since last save");
    }

    // Generate draft ID and title
    const draftId = this.generateDraftId(formData);
    const draftTitle = title || this.generateDraftTitle(formData, isAutoSave);

    // Create draft object
    const draft: Draft = {
      id: draftId,
      title: draftTitle,
      formData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completionPercentage,
      currentStep,
      version: 1,
      metadata: {
        platform: formData.platform,
        contentType: formData.contentType,
        industry: formData.industry,
        tags: this.extractTags(formData),
        ...metadata,
      },
    };

    // Check if draft already exists (update version)
    const existingDraft = await this.storage.loadDraft(draftId);
    if (existingDraft) {
      draft.createdAt = existingDraft.createdAt;
      draft.version = existingDraft.version + 1;
    }

    // Save draft
    await this.storage.saveDraft(draft);

    // Cleanup old drafts
    await this.cleanupOldDrafts();

    // Update last saved data
    this.lastSavedData = currentDataString;

    return draft;
  }

  /**
   * Load draft with merge options
   */
  async loadDraft(
    draftId: string,
    options: DraftLoadOptions = {},
  ): Promise<PartialContentCreationFormData | null> {
    const draft = await this.storage.loadDraft(draftId);
    if (!draft) return null;

    const formData = { ...draft.formData };

    // Exclude specified fields
    if (options.excludeFields) {
      options.excludeFields.forEach((field) => {
        delete formData[field];
      });
    }

    return formData;
  }

  /**
   * Get draft metadata without loading full form data
   */
  async getDraftInfo(draftId: string): Promise<Omit<Draft, "formData"> | null> {
    const draft = await this.storage.loadDraft(draftId);
    if (!draft) return null;

    const { formData: _formData, ...info } = draft;
    return info;
  }

  /**
   * List all drafts with optional filtering
   */
  async listDrafts(filter?: {
    platform?: string;
    contentType?: string;
    industry?: string;
    minCompletion?: number;
    maxAge?: number; // in days
  }): Promise<Draft[]> {
    let drafts = await this.storage.listDrafts();

    if (filter) {
      const maxAgeMs = filter.maxAge
        ? filter.maxAge * 24 * 60 * 60 * 1000
        : null;
      const now = Date.now();

      drafts = drafts.filter((draft) => {
        if (filter.platform && draft.metadata?.platform !== filter.platform) {
          return false;
        }
        if (
          filter.contentType &&
          draft.metadata?.contentType !== filter.contentType
        ) {
          return false;
        }
        if (filter.industry && draft.metadata?.industry !== filter.industry) {
          return false;
        }
        if (
          filter.minCompletion &&
          draft.completionPercentage < filter.minCompletion
        ) {
          return false;
        }
        if (maxAgeMs) {
          const draftAge = now - new Date(draft.updatedAt).getTime();
          if (draftAge > maxAgeMs) {
            return false;
          }
        }
        return true;
      });
    }

    return drafts;
  }

  /**
   * Start auto-save timer
   */
  startAutoSave(
    getCurrentData: () => {
      formData: PartialContentCreationFormData;
      currentStep: number;
      completionPercentage: number;
    },
    onAutoSave?: (draft: Draft) => void,
    onError?: (error: Error) => void,
  ): void {
    if (!this.config.enabled) return;

    this.stopAutoSave(); // Clear existing timer

    this.autoSaveTimer = setInterval(async () => {
      try {
        const { formData, currentStep, completionPercentage } =
          getCurrentData();

        // Only auto-save if we meet minimum completion
        if (completionPercentage < this.config.minCompletionForAutoSave) {
          return;
        }

        const draft = await this.saveDraft(
          formData,
          currentStep,
          completionPercentage,
          { isAutoSave: true },
        );

        onAutoSave?.(draft);
      } catch (error) {
        // Don't throw for "no changes" errors
        if (
          error instanceof Error &&
          error.message.includes("No changes detected")
        ) {
          return;
        }

        log.error("Auto-save failed:", error);
        onError?.(error as Error);
      }
    }, this.config.interval);
  }

  /**
   * Stop auto-save timer
   */
  stopAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }

  /**
   * Check if draft exists
   */
  async draftExists(draftId: string): Promise<boolean> {
    const draft = await this.storage.loadDraft(draftId);
    return draft !== null;
  }

  /**
   * Delete draft
   */
  async deleteDraft(draftId: string): Promise<void> {
    await this.storage.deleteDraft(draftId);
  }

  /**
   * Clear all drafts
   */
  async clearAllDrafts(): Promise<void> {
    await this.storage.clearAllDrafts();
  }

  /**
   * Get storage usage statistics
   */
  async getStorageStats(): Promise<{
    draftCount: number;
    totalSize: number;
    availableSpace: number;
    oldestDraft?: string;
    newestDraft?: string;
  }> {
    const drafts = await this.storage.listDrafts();
    const storageInfo = await this.storage.getStorageInfo();

    return {
      draftCount: drafts.length,
      totalSize: storageInfo.used,
      availableSpace: storageInfo.available,
      oldestDraft:
        drafts.length > 0
          ? drafts.sort(
            (a, b) =>
              new Date(a.createdAt).getTime() -
              new Date(b.createdAt).getTime(),
          )[0]?.title
          : undefined,
      newestDraft:
        drafts.length > 0
          ? drafts.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() -
              new Date(a.createdAt).getTime(),
          )[0]?.title
          : undefined,
    };
  }

  // ========================================================================
  // PRIVATE METHODS
  // ========================================================================

  private generateDraftId(formData: PartialContentCreationFormData): string {
    // Create a stable ID based on form content
    const key = [
      formData.topicId || "no-topic",
      formData.platform || "no-platform",
      formData.contentType || "no-type",
      formData.industry || "no-industry",
    ].join("-");

    return `draft-${key}-${Date.now()}`;
  }

  private generateDraftTitle(
    formData: PartialContentCreationFormData,
    isAutoSave: boolean,
  ): string {
    const parts = [];

    if (formData.contentType) parts.push(formData.contentType);
    if (formData.platform) parts.push(`for ${formData.platform}`);
    if (formData.industry) parts.push(`(${formData.industry})`);

    const baseName = parts.length > 0 ? parts.join(" ") : "Untitled Content";
    const timestamp = new Date().toLocaleString();
    const prefix = isAutoSave ? "Auto-saved" : "Draft";

    return `${prefix}: ${baseName} - ${timestamp}`;
  }

  private extractTags(formData: PartialContentCreationFormData): string[] {
    const tags: string[] = [];

    if (formData.platform) tags.push(formData.platform.toLowerCase());
    if (formData.contentType)
      tags.push(formData.contentType.toLowerCase().replace(/\s+/g, "-"));
    if (formData.industry)
      tags.push(formData.industry.toLowerCase().replace(/\s+/g, "-"));
    if (formData.audienceSize)
      tags.push(`audience-${formData.audienceSize.toLowerCase()}`);
    if (formData.readingLevel)
      tags.push(`level-${formData.readingLevel.toLowerCase()}`);

    // Add keyword-based tags
    if (formData.primaryKeywords && Array.isArray(formData.primaryKeywords)) {
      formData.primaryKeywords.slice(0, 3).forEach((keyword) => {
        tags.push(`keyword-${keyword.toLowerCase().replace(/\s+/g, "-")}`);
      });
    }

    return [...new Set(tags)]; // Remove duplicates
  }

  private async cleanupOldDrafts(): Promise<void> {
    const drafts = await this.storage.listDrafts();

    if (drafts.length <= this.config.maxDrafts) {
      return;
    }

    // Sort by updatedAt (oldest first)
    const sortedDrafts = drafts.sort(
      (a, b) =>
        new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
    );

    // Delete oldest drafts beyond the limit
    const draftsToDelete = sortedDrafts.slice(
      0,
      drafts.length - this.config.maxDrafts,
    );

    for (const draft of draftsToDelete) {
      await this.storage.deleteDraft(draft.id);
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

/** Global draft manager instance */
export const draftManager = new DraftManager();
