/**
 * Generic Knowledge Store Factory
 *
 * Creates type-safe Zustand stores for knowledge management with:
 * - Optimistic updates
 * - Error handling
 * - UI state management
 * - Persistence
 * - Selection management
 * - Sorting and filtering
 */

import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";

// SSR-safe storage implementation
const getStorage = () => {
  if (typeof window === "undefined") {
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    };
  }
  return localStorage;
};

// ============================================================================
// BASE TYPES
// ============================================================================

export interface BaseKnowledge {
  id: string;
  created_at: string;
  updated_at?: string;
}

export interface BaseState<T extends BaseKnowledge> {
  // Data
  items: T[];
  selectedItems: string[];

  // UI State
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

export interface BaseActions<T extends BaseKnowledge> {
  // Data actions
  setItems: (items: T[]) => void;
  addItem: (item: T) => void;
  updateItem: (id: string, updates: Partial<T>) => void;
  removeItem: (id: string) => void;

  // UI actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSearchQuery: (query: string) => void;
  setSorting: (sortBy: string, sortOrder: "asc" | "desc") => void;

  // Selection actions
  toggleSelection: (id: string) => void;
  selectAll: () => void;
  deselectAll: () => void;

  // Utility
  reset: () => void;
}

export type KnowledgeStore<T extends BaseKnowledge, TState = {}, TActions = {}> =
  BaseState<T> & BaseActions<T> & TState & TActions;

// ============================================================================
// FACTORY CONFIGURATION
// ============================================================================

export interface StoreConfig<T extends BaseKnowledge, TState = {}, TActions = {}> {
  storeName: string;
  defaultSortBy: string;
  defaultSortOrder?: "asc" | "desc";

  // Optional custom initial state
  customState?: TState;

  // Optional custom actions
  customActions?: (
    set: any,
    get: any
  ) => TActions;

  // Optional persistence config
  persistConfig?: {
    partialize?: (state: any) => any;
  };
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createKnowledgeStore<
  T extends BaseKnowledge,
  TState extends Record<string, any> = {},
  TActions extends Record<string, any> = {}
>(
  config: StoreConfig<T, TState, TActions>
) {
  const {
    storeName,
    defaultSortBy,
    defaultSortOrder = "desc",
    customState = {} as TState,
    customActions,
    persistConfig,
  } = config;

  return create<KnowledgeStore<T, TState, TActions>>()(
    devtools(
      persist(
        (set, get) => ({
          // Base state
          items: [],
          selectedItems: [],
          isLoading: false,
          error: null,
          searchQuery: "",
          sortBy: defaultSortBy,
          sortOrder: defaultSortOrder,

          // Custom state
          ...customState,

          // Base actions
          setItems: (items: T[]) => set({ items } as any),

          addItem: (item: T) =>
            set((state: any) => ({
              items: [item, ...state.items],
            })),

          updateItem: (id: string, updates: Partial<T>) =>
            set((state: any) => ({
              items: state.items.map((item: any) =>
                item.id === id ? { ...item, ...updates } : item
              ),
            })),

          removeItem: (id: string) =>
            set((state: any) => ({
              items: state.items.filter((item: any) => item.id !== id),
              selectedItems: state.selectedItems.filter(
                (itemId: string) => itemId !== id
              ),
            })),

          setLoading: (loading: boolean) => set({ isLoading: loading } as any),
          setError: (error: string | null) => set({ error } as any),
          setSearchQuery: (query: string) => set({ searchQuery: query } as any),

          setSorting: (sortBy: string, sortOrder: "asc" | "desc") => set({ sortBy, sortOrder } as any),

          toggleSelection: (id: string) =>
            set((state: any) => ({
              selectedItems: state.selectedItems.includes(id)
                ? state.selectedItems.filter((itemId: string) => itemId !== id)
                : [...state.selectedItems, id],
            })),

          selectAll: () =>
            set((state: any) => ({
              selectedItems: state.items.map((item: any) => item.id),
            })),

          deselectAll: () => set({ selectedItems: [] } as any),

          reset: () =>
            set({
              items: [],
              selectedItems: [],
              isLoading: false,
              error: null,
              searchQuery: "",
              ...customState,
            } as any),

          // Custom actions
          ...(customActions ? customActions(set, get) : {}),
        } as any),
        {
          name: storeName,
          storage: createJSONStorage(() => getStorage()),
          partialize: persistConfig?.partialize || ((state: any) => ({
            searchQuery: state.searchQuery,
            sortBy: state.sortBy,
            sortOrder: state.sortOrder,
          })),
        }
      ),
      { name: storeName }
    )
  );
}

// ============================================================================
// HELPER TYPES FOR STORE CREATION
// ============================================================================

export type InferStoreState<TStore> = TStore extends ReturnType<typeof create<infer S>>
  ? S
  : never;

export type InferStoreActions<TStore> = TStore extends ReturnType<typeof create<infer S>>
  ? {
      [K in keyof S]: S[K] extends (...args: any[]) => any ? K : never;
    }[keyof S]
  : never;
