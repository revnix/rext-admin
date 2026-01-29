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

import type { StateCreator } from "zustand";
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

export type KnowledgeStore<
  T extends BaseKnowledge,
  TState = Record<string, never>,
  TActions = Record<string, never>,
> = BaseState<T> & BaseActions<T> & TState & TActions;

// ============================================================================
// FACTORY CONFIGURATION
// ============================================================================

export interface StoreConfig<
  TItem extends BaseKnowledge,
  TState = Record<string, never>,
  TActions = Record<string, never>,
> {
  storeName: string;
  defaultSortBy: string;
  defaultSortOrder?: "asc" | "desc";

  // Optional custom initial state
  customState?: TState;

  // Optional custom actions
  customActions?: (
    set: Parameters<StateCreator<BaseState<TItem> & TState & TActions>>[0],
    get: Parameters<StateCreator<BaseState<TItem> & TState & TActions>>[1],
  ) => TActions;

  // Optional persistence config
  persistConfig?: {
    partialize?: (
      state: BaseState<TItem> & TState & TActions,
    ) => Partial<BaseState<TItem> & TState & TActions>;
  };
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createKnowledgeStore<
  T extends BaseKnowledge,
  TState = Record<string, never>,
  TActions = Record<string, never>,
>(config: StoreConfig<T, TState, TActions>) {
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
        (set, get) =>
          ({
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
            setItems: (items: T[]) =>
              set({ items } as Partial<KnowledgeStore<T, TState, TActions>>),

            addItem: (item: T) =>
              set(
                (state) =>
                  ({
                    items: [item, ...(state as BaseState<T>).items],
                  }) as Partial<KnowledgeStore<T, TState, TActions>>,
              ),

            updateItem: (id: string, updates: Partial<T>) =>
              set(
                (state) =>
                  ({
                    items: (state as BaseState<T>).items.map((item) =>
                      item.id === id ? { ...item, ...updates } : item,
                    ),
                  }) as Partial<KnowledgeStore<T, TState, TActions>>,
              ),

            removeItem: (id: string) =>
              set((state) => {
                const typedState = state as BaseState<T>;
                return {
                  items: typedState.items.filter((item) => item.id !== id),
                  selectedItems: typedState.selectedItems.filter(
                    (itemId: string) => itemId !== id,
                  ),
                } as Partial<KnowledgeStore<T, TState, TActions>>;
              }),

            setLoading: (loading: boolean) =>
              set({ isLoading: loading } as Partial<
                KnowledgeStore<T, TState, TActions>
              >),
            setError: (error: string | null) =>
              set({ error } as Partial<KnowledgeStore<T, TState, TActions>>),
            setSearchQuery: (query: string) =>
              set({ searchQuery: query } as Partial<
                KnowledgeStore<T, TState, TActions>
              >),

            setSorting: (sortBy: string, sortOrder: "asc" | "desc") =>
              set({ sortBy, sortOrder } as Partial<
                KnowledgeStore<T, TState, TActions>
              >),

            toggleSelection: (id: string) =>
              set((state) => {
                const typedState = state as BaseState<T>;
                return {
                  selectedItems: typedState.selectedItems.includes(id)
                    ? typedState.selectedItems.filter(
                        (itemId: string) => itemId !== id,
                      )
                    : [...typedState.selectedItems, id],
                } as Partial<KnowledgeStore<T, TState, TActions>>;
              }),

            selectAll: () =>
              set(
                (state) =>
                  ({
                    selectedItems: (state as BaseState<T>).items.map(
                      (item) => item.id,
                    ),
                  }) as Partial<KnowledgeStore<T, TState, TActions>>,
              ),

            deselectAll: () =>
              set({ selectedItems: [] } as Partial<
                KnowledgeStore<T, TState, TActions>
              >),

            reset: () =>
              set({
                items: [],
                selectedItems: [],
                isLoading: false,
                error: null,
                searchQuery: "",
                ...customState,
              } as unknown as Partial<KnowledgeStore<T, TState, TActions>>),

            // Custom actions
            ...(customActions ? customActions(set, get) : {}),
          }) as unknown as KnowledgeStore<T, TState, TActions>,
        {
          name: storeName,
          storage: createJSONStorage(() => getStorage()),
          partialize:
            persistConfig?.partialize ||
            ((state) => ({
              searchQuery: (state as BaseState<T>).searchQuery,
              sortBy: (state as BaseState<T>).sortBy,
              sortOrder: (state as BaseState<T>).sortOrder,
            })),
        },
      ),
      { name: storeName },
    ),
  );
}

// ============================================================================
// HELPER TYPES FOR STORE CREATION
// ============================================================================

export type InferStoreState<TStore> =
  TStore extends ReturnType<typeof create<infer S>> ? S : never;

export type InferStoreActions<TStore> =
  TStore extends ReturnType<typeof create<infer S>>
    ? {
        [K in keyof S]: S[K] extends (...args: never[]) => unknown ? K : never;
      }[keyof S]
    : never;
