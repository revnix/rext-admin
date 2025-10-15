"use client";

import { Lightbulb } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useTooltips } from "@/providers/tooltip-provider";

export function UIPreferences() {
  const { enabled, toggleTooltips } = useTooltips();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-primary" />
            <Label htmlFor="show-tooltips" className="cursor-pointer">
              Show Feature Hints
            </Label>
          </div>
          <p className="text-sm text-muted-foreground">
            Display helpful tooltips when hovering over features throughout the
            app
          </p>
        </div>
        <Switch
          id="show-tooltips"
          checked={enabled}
          onCheckedChange={toggleTooltips}
        />
      </div>

      <div className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg">
        <p>
          <strong>Tip:</strong> Feature hints provide contextual information
          about key features as you navigate the app. They're especially useful
          when you're getting started with WREXT.
        </p>
      </div>
    </div>
  );
}
