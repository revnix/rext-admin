import type { Variants } from "motion/react";
import {
  celebrationVariants,
  getMotionVariants,
  optionCardVariants,
  progressBarVariants,
  questionContentVariants,
  questionItemVariants,
  selectionIndicatorVariants,
  useReducedMotion,
} from "@/lib/animations";

export {
  celebrationVariants,
  optionCardVariants,
  progressBarVariants,
  questionContentVariants,
  questionItemVariants,
  selectionIndicatorVariants,
};

export const useTypeformMotionVariants = (variants: Variants): Variants => {
  const prefersReducedMotion = useReducedMotion();
  return getMotionVariants(variants, prefersReducedMotion);
};
