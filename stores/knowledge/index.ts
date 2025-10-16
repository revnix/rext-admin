/**
 * Knowledge Stores - Unified Export
 *
 * Exports all knowledge stores and their utilities from both
 * the factory pattern implementation and individual store files.
 */

// ============================================================================
// TYPES
// ============================================================================
export type {
  FileKnowledge,
  FileUploadProgress,
  GlobalSearchResult,
  KnowledgeType,
  TextKnowledge,
  WebKnowledge,
} from "@/types/workspace";
export { getStorage } from "@/types/workspace";
// Factory pattern types
export type {
  BaseActions,
  BaseKnowledge,
  BaseState,
  KnowledgeStore,
  StoreConfig,
} from "./create-knowledge-store";
// ============================================================================
// FACTORY PATTERN STORES (Original)
// ============================================================================
export { createKnowledgeStore } from "./create-knowledge-store";
// Original factory-based stores
export {
  useFileKnowledgeItems as useFileKnowledgeItemsFactory,
  useFileKnowledgeSelected as useFileKnowledgeSelectedFactory,
  useFileKnowledgeStore as useFileKnowledgeStoreFactory,
  useFileKnowledgeUploading as useFileKnowledgeUploadingFactory,
  useFileUploadProgress as useFileUploadProgressFactory,
} from "./file-knowledge-store";
export {
  useTextKnowledgeEditing as useTextKnowledgeEditingFactory,
  useTextKnowledgeItems as useTextKnowledgeItemsFactory,
  useTextKnowledgeSelected as useTextKnowledgeSelectedFactory,
  useTextKnowledgeStore as useTextKnowledgeStoreFactory,
} from "./text-knowledge-store";

export {
  useWebKnowledgeAdding as useWebKnowledgeAddingFactory,
  useWebKnowledgeItems as useWebKnowledgeItemsFactory,
  useWebKnowledgeLoading as useWebKnowledgeLoadingFactory,
  useWebKnowledgeSelected as useWebKnowledgeSelectedFactory,
  useWebKnowledgeStore as useWebKnowledgeStoreFactory,
} from "./web-knowledge-store";

// ============================================================================
// INDIVIDUAL STORES (Refactored - Recommended)
// ============================================================================

// File Knowledge Store
export {
  useFileKnowledgeItems,
  useFileKnowledgeSelected,
  useFileKnowledgeStore,
  useFileKnowledgeUploading,
  useFileUploadProgress,
} from "./use-file-knowledge-store";
// Global Knowledge Search Store
export { useGlobalKnowledgeSearchStore } from "./use-global-knowledge-search-store";
// Knowledge Filter Store
export { useKnowledgeFilterStore } from "./use-knowledge-filter-store";
// Text Knowledge Store
export {
  useTextKnowledgeEditing,
  useTextKnowledgeItems,
  useTextKnowledgeSelected,
  useTextKnowledgeStore,
} from "./use-text-knowledge-store";
// Unified Knowledge Store
export {
  useCurrentKnowledgeType,
  useCurrentWorkspaceId,
  useUnifiedKnowledgeStore,
} from "./use-unified-knowledge-store";
// Web Knowledge Store
export {
  useWebKnowledgeItems,
  useWebKnowledgeLoading,
  useWebKnowledgeSelected,
  useWebKnowledgeStore,
} from "./use-web-knowledge-store";
