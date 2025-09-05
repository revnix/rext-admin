"use client";

import { CheckCircle, FileText, Plus } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

interface SuccessConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  topicTitle: string;
  onNavigateToIdeas: () => void;
  onGenerateNew: () => void;
  className?: string;
}

export function SuccessConfirmationDialog({
  open,
  onOpenChange,
  topicTitle,
  onNavigateToIdeas,
  onGenerateNew,
  className,
}: SuccessConfirmationDialogProps) {
  const handleNavigateToIdeas = () => {
    console.log("Navigating to ideas page");
    onNavigateToIdeas();
    onOpenChange(false);
  };

  const handleGenerateNew = () => {
    console.log("Starting new topic generation");
    onGenerateNew();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className={cn("max-w-md", className)}>
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div
              className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center"
              aria-hidden="true"
            >
              <CheckCircle
                className="w-6 h-6 text-green-600"
                aria-hidden="true"
              />
            </div>
            <div className="flex-1">
              <AlertDialogTitle className="text-left">
                Topic Saved Successfully!
              </AlertDialogTitle>
            </div>
          </div>

          <AlertDialogDescription className="text-left">
            "{topicTitle}" has been saved to your ideas library. What would you
            like to do next? Use the Tab key to navigate between options and
            Enter or Space to select.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="gap-3 sm:gap-2">
          <AlertDialogCancel
            onClick={() => onOpenChange(false)}
            className="sm:mr-auto"
            aria-describedby="stay-here-description"
          >
            Stay Here
          </AlertDialogCancel>

          <AlertDialogAction
            onClick={handleNavigateToIdeas}
            className="gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/80"
            aria-describedby="navigate-to-ideas-description"
          >
            <FileText className="w-4 h-4" aria-hidden="true" />
            View All Topics
          </AlertDialogAction>

          <AlertDialogAction
            onClick={handleGenerateNew}
            className="gap-2"
            aria-describedby="generate-new-description"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            Generate New Topics
          </AlertDialogAction>
        </AlertDialogFooter>

        {/* Screen reader descriptions for navigation actions */}
        <div className="sr-only">
          <div id="stay-here-description">
            Close this dialog and remain on the current topic generation page
          </div>
          <div id="navigate-to-ideas-description">
            Navigate to the Ideas page to view and manage all your saved topics
          </div>
          <div id="generate-new-description">
            Start a new topic generation session to create more content ideas
          </div>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
