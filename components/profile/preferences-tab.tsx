"use client";

import { useEffect } from "react";
import { useAccessibilityPreferences } from "@/hooks/use-accessibility-preferences";
import { ThemeSelector } from "@/components/settings/theme-selector";

const ACCESSIBILITY_STORAGE_KEY = "wrext-accessibility";

export function PreferencesTab() {
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
      <ThemeSelector showHeader={false} />
    </div>
  );
}
