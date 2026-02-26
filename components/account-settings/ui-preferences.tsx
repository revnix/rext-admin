"use client";

import {
  Accessibility,
  Lightbulb,
  Monitor,
  Moon,
  Palette,
  Sun,
} from "lucide-react";
import { useEffect } from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/providers/theme-provider";
import { useTooltips } from "@/providers/tooltip-provider";
import { useAccessibilityPreferences } from "@/hooks/use-accessibility-preferences";

const ACCESSIBILITY_STORAGE_KEY = "wrext-accessibility";

export function UIPreferences() {
  const { enabled, toggleTooltips } = useTooltips();
  const { theme, setTheme } = useTheme();

  const { accessibility, updateAccessibility } = useAccessibilityPreferences();

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
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Palette className="h-5 w-5 text-primary" />
          <div>
            <h3 className="text-lg font-semibold">Appearance</h3>
            <p className="text-sm text-muted-foreground">
              Customize how REXT looks and feels for you
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <Label htmlFor="theme">Theme</Label>
          <RadioGroup
            options={[
              {
                value: "light",
                label: "Light",
                description: "Use light theme",
                icon: Sun,
              },
              {
                value: "dark",
                label: "Dark",
                description: "Use dark theme",
                icon: Moon,
              },
              {
                value: "system",
                label: "System",
                description: "Follow system preference",
                icon: Monitor,
              },
            ]}
            value={theme}
            onValueChange={(value) =>
              setTheme(value as "light" | "dark" | "system")
            }
            columns={3}
          />
          <p className="text-sm text-muted-foreground">
            Choose between light, dark, or system preference
          </p>
        </div>
      </div>

      <Separator />

      {/* Accessibility Preferences */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Accessibility className="h-5 w-5 text-primary" />
          <div>
            <h3 className="text-lg font-semibold">Accessibility</h3>
            <p className="text-sm text-muted-foreground">
              Configure accessibility options to make REXT more comfortable to
              use
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="reduce-motion">Reduce motion</Label>
              <p className="text-sm text-muted-foreground">
                Minimize animations and transitions
              </p>
            </div>
            <Switch
              id="reduce-motion"
              checked={accessibility.reduceMotion}
              onCheckedChange={(checked) =>
                updateAccessibility("reduceMotion", checked)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="high-contrast">High contrast</Label>
              <p className="text-sm text-muted-foreground">
                Increase color contrast for better readability
              </p>
            </div>
            <Switch
              id="high-contrast"
              checked={accessibility.highContrast}
              onCheckedChange={(checked) =>
                updateAccessibility("highContrast", checked)
              }
            />
          </div>
        </div>
      </div>

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
