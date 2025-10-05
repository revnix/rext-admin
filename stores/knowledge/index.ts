/**
 * Knowledge Stores - Unified Export
 *
 * Exports all knowledge stores and their utilities from the refactored
 * generic factory pattern implementation.
 */

// Re-export remaining stores from main knowledge-store.ts for compatibility
export {
  useCurrentKnowledgeType,
  useCurrentWorkspaceId,
  useGlobalKnowledgeSearchStore,
  useKnowledgeFilterStore,
  useUnifiedKnowledgeStore,
} from "../knowledge-store";
export type {
  BaseActions,
  BaseKnowledge,
  BaseState,
  KnowledgeStore,
  StoreConfig,
} from "./create-knowledge-store";
// Factory
export { createKnowledgeStore } from "./create-knowledge-store";
export type { FileUploadProgress } from "./file-knowledge-store";
// File Knowledge Store
export {
  useFileKnowledgeItems,
  useFileKnowledgeSelected,
  useFileKnowledgeStore,
  useFileKnowledgeUploading,
  useFileUploadProgress,
} from "./file-knowledge-store";

// Text Knowledge Store
export {
  useTextKnowledgeEditing,
  useTextKnowledgeItems,
  useTextKnowledgeSelected,
  useTextKnowledgeStore,
} from "./text-knowledge-store";
// Web Knowledge Store
export {
  useWebKnowledgeAdding,
  useWebKnowledgeItems,
  useWebKnowledgeLoading,
  useWebKnowledgeSelected,
  useWebKnowledgeStore,
} from "./web-knowledge-store";
