/**
 * Knowledge Stores - Unified Export
 *
 * Exports all knowledge stores and their utilities from the refactored
 * generic factory pattern implementation.
 */

// Factory
export { createKnowledgeStore } from "./create-knowledge-store";
export type {
  BaseKnowledge,
  BaseState,
  BaseActions,
  KnowledgeStore,
  StoreConfig,
} from "./create-knowledge-store";

// Web Knowledge Store
export {
  useWebKnowledgeStore,
  useWebKnowledgeItems,
  useWebKnowledgeSelected,
  useWebKnowledgeLoading,
  useWebKnowledgeAdding,
} from "./web-knowledge-store";

// File Knowledge Store
export {
  useFileKnowledgeStore,
  useFileKnowledgeItems,
  useFileKnowledgeSelected,
  useFileKnowledgeUploading,
  useFileUploadProgress,
} from "./file-knowledge-store";
export type { FileUploadProgress } from "./file-knowledge-store";

// Text Knowledge Store
export {
  useTextKnowledgeStore,
  useTextKnowledgeItems,
  useTextKnowledgeSelected,
  useTextKnowledgeEditing,
} from "./text-knowledge-store";

// Re-export remaining stores from main knowledge-store.ts for compatibility
export {
  useUnifiedKnowledgeStore,
  useGlobalKnowledgeSearchStore,
  useKnowledgeFilterStore,
  useCurrentKnowledgeType,
  useCurrentWorkspaceId,
} from "../knowledge-store";
