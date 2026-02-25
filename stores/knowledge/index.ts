/**
 * Knowledge Stores - Unified Export
 *
 * Exports all knowledge stores and their utilities.
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
export { getStorage } from "@/lib/storage";

// ============================================================================
// STORES
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
