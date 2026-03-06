import type { StateCreator } from "zustand";

export interface PersistHydrationSlice {
    _hasHydrated: boolean;
    setHasHydrated: (hydrated: boolean) => void;
}

type HydrationSet<T> = Parameters<StateCreator<T>>[0];

export const createPersistHydrationSlice = <T extends PersistHydrationSlice>(
    set: HydrationSet<T>
): PersistHydrationSlice => ({
    _hasHydrated: false,
    setHasHydrated: (hydrated: boolean) =>
        set({ _hasHydrated: hydrated } as Partial<T>),
});

export const onPersistHydrated = <T extends PersistHydrationSlice>(
    state: T | undefined,
    error?: unknown
): void => {
    if (!error) {
        state?.setHasHydrated(true);
    }
};
