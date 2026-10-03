"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ListChecks } from "lucide-react";

export interface WorkflowStep {
  id: string;
  label: string;
}

interface WorkflowStepIndicatorProps {
  steps: WorkflowStep[];
  activeStepIndex: number;
}

export function WorkflowStepIndicator({
  steps,
  activeStepIndex,
}: WorkflowStepIndicatorProps) {
  const activeStep = steps[activeStepIndex];

  return (
    <div className="flex flex-col items-center gap-3 self-center">
      {/* Active step label */}
      <AnimatePresence mode="wait">
        {activeStep && (
          <motion.div
            key={activeStepIndex}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25 }}
            className="flex items-center gap-1.5 text-muted-foreground px-1"
          >
            <ListChecks className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">
              Step {activeStepIndex + 1} · {activeStep.label}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
