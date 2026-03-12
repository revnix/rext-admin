import type * as React from "react";
import { useCallback, useState } from "react";

interface UseChipInputKeyboardArgs {
  valueLength: number;
  inputValue: string;
  enableDualEnter: boolean;
  onStepAdvance?: () => void;
  addChip: (value: string) => boolean;
  removeLastChip: () => void;
  focusLastChip: () => void;
  safeOperation: (operation: () => void, context: string) => void;
}

/**
 * Hook for managing chip input keyboard behavior, including dual-enter step advancement.
 */
export function useChipInputKeyboard({
  valueLength,
  inputValue,
  enableDualEnter,
  onStepAdvance,
  addChip,
  removeLastChip,
  focusLastChip,
  safeOperation,
}: UseChipInputKeyboardArgs) {
  const [lastEnterTime, setLastEnterTime] = useState<number | null>(null);

  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      safeOperation(() => {
        if (e.key === "Enter") {
          e.preventDefault();

          if (!enableDualEnter) {
            addChip(inputValue);
            return;
          }

          const now = Date.now();
          const hasContent = inputValue.trim().length > 0;

          if (hasContent) {
            if (addChip(inputValue)) setLastEnterTime(now);
            return;
          }

          const shouldAdvance = !lastEnterTime || now - lastEnterTime <= 500;
          if (shouldAdvance) {
            setLastEnterTime(null);
            onStepAdvance?.();
          }
          return;
        }

        if (e.key === "Backspace" && inputValue === "" && valueLength > 0) {
          removeLastChip();
          setLastEnterTime(null);
          return;
        }

        if (e.key === "ArrowLeft" && inputValue === "" && valueLength > 0) {
          e.preventDefault();
          focusLastChip();
          return;
        }

        setLastEnterTime(null);
      }, "handleInputKeyDown");
    },
    [
      addChip,
      enableDualEnter,
      focusLastChip,
      inputValue,
      lastEnterTime,
      onStepAdvance,
      removeLastChip,
      safeOperation,
      valueLength,
    ],
  );

  return { handleInputKeyDown, lastEnterTime };
}
