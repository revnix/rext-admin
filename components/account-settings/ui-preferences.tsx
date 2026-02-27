"use client";

import { Lightbulb } from "lucide-react";
import { useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useTooltips } from "@/providers/tooltip-provider";
import { useAccessibilityPreferences } from "@/hooks/use-accessibility-preferences";
import { ThemeSelector } from "@/components/settings/theme-selector";

const ACCESSIBILITY_STORAGE_KEY = "wrext-accessibility";

export function UIPreferences() {
  const { enabled, toggleTooltips } = useTooltips();

  const { accessibility } = useAccessibilityPreferences();

  // Apply accessibility preferences to document
  useEffect(() => {
    const root = window.document.documentElement;

    if (accessibility.reduceMotion) {
      root.style.setProperty("--animation-duration", "0.01ms");
    } else {
      root.style.removeProperty("--animation-duration");
    }

    if (accessibility.highContrast) {
      root.classList.add("high-contrast");
    } else {
      root.classList.remove("high-contrast");
    }

    localStorage.setItem(
      ACCESSIBILITY_STORAGE_KEY,
      JSON.stringify(accessibility),
    );
  }, [accessibility]);

  return (
    <div className="space-y-6">
      {/* Theme Preferences */}
      <ThemeSelector showHeader={false} />

      <Separator />

      {/* Feature Hints */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-primary" />
          <div>
            <h3 className="text-lg font-semibold">Feature Hints</h3>
            <p className="text-sm text-muted-foreground">
              Control tooltip display throughout the application
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="show-tooltips" className="cursor-pointer">
              Show Feature Hints
            </Label>
            <p className="text-sm text-muted-foreground">
              Display helpful tooltips when hovering over features throughout
              the app
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
            about key features as you navigate the app. They're especially
            useful when you're getting started with REXT.
          </p>
        </div>
      </div>
    </div>
  );
}
