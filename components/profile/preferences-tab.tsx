"use client";

import { Accessibility, Monitor, Moon, Palette, Sun } from "lucide-react";
import { useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/providers/theme-provider";
import { useAccessibilityPreferences } from "@/hooks/use-accessibility-preferences";

const ACCESSIBILITY_STORAGE_KEY = "wrext-accessibility";

export function PreferencesTab() {
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
      {/* Appearance Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            <CardTitle>Appearance</CardTitle>
          </div>
          <CardDescription>
            Customize how REXT looks and feels for you
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
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
        </CardContent>
      </Card>

      {/* Accessibility Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Accessibility className="h-5 w-5" />
            <CardTitle>Accessibility</CardTitle>
          </div>
          <CardDescription>
            Configure accessibility options to make REXT more comfortable to use
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
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

          <Separator />

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
        </CardContent>
      </Card>
    </div>
  );
}
