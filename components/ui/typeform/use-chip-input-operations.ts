import { useCallback } from "react";
import { log } from "@/lib/logger";

interface UseChipInputOperationsArgs {
    value: string[];
    onChange: (values: string[]) => void;
    maxItems?: number;
    enableFallback: boolean;
    onFallbackTriggered?: (error: Error) => void;
    announce: (message: string) => void;
    setInputValue: (value: string) => void;
    setInternalError: (value: string | undefined) => void;
    setIsFallbackMode: (value: boolean) => void;
    focusedChipIndex: number;
    setFocusedChipIndex: (value: number) => void;
    focusInput: () => void;
}

export function useChipInputOperations({
    value,
    onChange,
    maxItems,
    enableFallback,
    onFallbackTriggered,
    announce,
    setInputValue,
    setInternalError,
    setIsFallbackMode,
    focusedChipIndex,
    setFocusedChipIndex,
    focusInput,
}: UseChipInputOperationsArgs) {
    const safeOperation = useCallback(
        (operation: () => void, context: string) => {
            if (!enableFallback) {
                operation();
                return;
            }

            try {
                operation();
            } catch (error) {
                const typedError = error instanceof Error ? error : new Error(String(error));
                log.error(`ChipInput operation failed (${context}):`, typedError);
                setIsFallbackMode(true);
                announce("Switched to text input mode due to an error");
                onFallbackTriggered?.(typedError);
            }
        },
        [announce, enableFallback, onFallbackTriggered, setIsFallbackMode],
    );

    const addChip = useCallback(
        (chipValue: string): boolean => {
            let added = false;
            safeOperation(() => {
                const trimmedValue = chipValue.trim();
                if (!trimmedValue) {
                    announce("Cannot add empty item");
                    return;
                }

                if (value.includes(trimmedValue)) {
                    announce(`"${trimmedValue}" is already selected`);
                    return;
                }

                if (maxItems && value.length >= maxItems) {
                    announce(`Maximum ${maxItems} items allowed`);
                    return;
                }

                onChange([...value, trimmedValue]);
                setInputValue("");
                setInternalError(undefined);
                announce(`Added "${trimmedValue}". ${value.length + 1} item${value.length === 0 ? "" : "s"} selected.`);
                added = true;
            }, "addChip");

            return added;
        },
        [announce, maxItems, onChange, safeOperation, setInputValue, setInternalError, value],
    );

    const removeChip = useCallback(
        (index: number) => {
            safeOperation(() => {
                const removedChip = value[index];
                const next = value.filter((_, i) => i !== index);
                onChange(next);
                announce(`Removed "${removedChip}". ${next.length} item${next.length === 1 ? "" : "s"} remaining.`);
                if (next.length === 0) setInternalError("At least one item is required");

                if (focusedChipIndex === index) {
                    setFocusedChipIndex(-1);
                    focusInput();
                } else if (focusedChipIndex > index) {
                    setFocusedChipIndex(focusedChipIndex - 1);
                }
            }, "removeChip");
        },
        [announce, focusInput, focusedChipIndex, onChange, safeOperation, setFocusedChipIndex, setInternalError, value],
    );

    return { addChip, removeChip, safeOperation };
}
