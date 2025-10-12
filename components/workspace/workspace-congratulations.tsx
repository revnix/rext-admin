"use client";

import confetti from "canvas-confetti";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  FolderOpen,
  Sparkles,
  Users,
} from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface WorkspaceCongratulationsProps {
  workspaceName: string;
  onContinue: () => void;
}

const NEXT_ACTIONS = [
  {
    icon: FolderOpen,
    title: "Explore Your Workspace",
    description: "View workspace details and settings",
    action: "view_workspace",
  },
  {
    icon: Users,
    title: "Invite Team Members",
    description: "Collaborate with your team",
    action: "invite_members",
  },
  {
    icon: BookOpen,
    title: "Add Knowledge Bases",
    description: "Upload documents and connect data sources",
    action: "add_knowledge",
  },
  {
    icon: Sparkles,
    title: "Generate Topics",
    description: "Start creating AI-powered content",
    action: "generate_topics",
  },
];

/**
 * WorkspaceCongratulations Component
 *
 * Success screen displayed after workspace creation and brand voice review.
 * Features:
 * - Confetti animation celebration
 * - Clear success message with workspace name
 * - Guided next actions (not buttons, just suggestions)
 * - Professional and uncluttered design
 * - Smooth animations with Framer Motion
 *
 * @example
 * ```tsx
 * <WorkspaceCongratulations
 *   workspaceName="My Company"
 *   onContinue={() => router.push(`/w/my-company/topics`)}
 * />
 * ```
 */
export function WorkspaceCongratulations({
  workspaceName,
  onContinue,
}: WorkspaceCongratulationsProps) {
  // Trigger confetti animation on mount
  useEffect(() => {
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ["#a786ff", "#fd8bbc", "#eca184", "#f8dda4"],
      });

      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ["#a786ff", "#fd8bbc", "#eca184", "#f8dda4"],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();
  }, []);

  return (
    <div className="space-y-8 py-8">
      {/* Success Icon & Message */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="flex flex-col items-center text-center space-y-4"
      >
        <div className="relative">
          <CheckCircle2 className="h-20 w-20 text-green-500" />
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.2, 1] }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="absolute -top-2 -right-2"
          >
            <Sparkles className="h-8 w-8 text-yellow-500" />
          </motion.div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Congratulations! 🎉</h1>
          <p className="text-lg text-muted-foreground">
            Your workspace{" "}
            <span className="font-semibold text-foreground">
              {workspaceName}
            </span>{" "}
            is ready
          </p>
        </div>
      </motion.div>

      {/* Next Steps Guide */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-4"
      >
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">
            What would you like to do next?
          </h2>
          <p className="text-sm text-muted-foreground">
            Here are some actions to help you get started
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {NEXT_ACTIONS.map((action, index) => {
            const Icon = action.icon;
            return (
              <motion.div
                key={action.action}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
              >
                <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer group">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-sm mb-1">
                        {action.title}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Continue Button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="flex justify-center pt-4"
      >
        <Button size="lg" onClick={onContinue} className="px-8">
          Go to Workspace
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </motion.div>
    </div>
  );
}
