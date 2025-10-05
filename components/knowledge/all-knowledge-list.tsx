/**
 * Unified Knowledge List - Legacy Export
 *
 * This file maintains backward compatibility by re-exporting the
 * refactored UnifiedKnowledgeList component and its dependencies.
 *
 * The original 1,506-line monolith has been split into focused modules:
 *
 * Core Component:
 * - UnifiedKnowledgeList.tsx (main orchestrator, ~400 lines)
 *
 * Sub-Components:
 * - FilterBar.tsx (filter controls, ~350 lines)
 * - ActiveFiltersBar.tsx (active filter chips, ~140 lines)
 * - KnowledgeCard.tsx (card view, ~130 lines)
 * - KnowledgeRow.tsx (list view, ~115 lines)
 * - KnowledgeSkeleton.tsx (loading states, ~60 lines)
 * - DropdownSort.tsx (sort control, ~95 lines)
 *
 * Utilities:
 * - lib/knowledge/filtering.ts (filter/sort logic, ~290 lines)
 * - unified/types.ts (constants and types, ~100 lines)
 *
 * Total: ~1,680 lines across 9 focused files vs 1,506 lines in 1 file
 * Benefit: Better separation of concerns, easier maintenance and testing
 */

// Re-export sub-components for advanced usage
export {
  ActiveFiltersBar,
  DropdownSort,
  FilterBar,
  KnowledgeCard,
  KnowledgeRow,
  KnowledgeSkeleton,
} from "./unified";
// Re-export types and constants
export type * from "./unified/types";
export {
  DUPLICATE_REASON_LABELS,
  KNOWLEDGE_TYPE_LABELS,
  STATUS_CLASSES,
  STATUS_LABELS,
  TYPE_COLORS,
} from "./unified/types";
export type { UnifiedKnowledgeListProps as AllKnowledgeListProps } from "./unified/UnifiedKnowledgeList";
export { UnifiedKnowledgeList as AllKnowledgeList } from "./unified/UnifiedKnowledgeList";
