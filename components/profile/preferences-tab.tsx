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
import { ThemeSelector } from "@/components/settings/theme-selector";

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
      <ThemeSelector showHeader={false} />
    </div>
  );
}
