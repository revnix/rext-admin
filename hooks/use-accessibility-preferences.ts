"use client";

import { useEffect, useState } from "react";

export interface AccessibilityPreferences {
  reduceMotion: boolean;
  highContrast: boolean;
}

const ACCESSIBILITY_STORAGE_KEY = "wrext-accessibility";

const DEFAULT_ACCESSIBILITY: AccessibilityPreferences = {
  reduceMotion: false,
  highContrast: false,
};

export function useAccessibilityPreferences() {
  const [accessibility, setAccessibility] = useState<AccessibilityPreferences>(
    DEFAULT_ACCESSIBILITY,
  );

  useEffect(() => {
    const saved = localStorage.getItem(ACCESSIBILITY_STORAGE_KEY);
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved) as Partial<AccessibilityPreferences>;
      setAccessibility({
        reduceMotion: Boolean(parsed.reduceMotion),
        highContrast: Boolean(parsed.highContrast),
      });
    } catch {
      localStorage.removeItem(ACCESSIBILITY_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;

    if (accessibility.reduceMotion) {
      root.style.setProperty("--animation-duration", "0.01ms");
    } else {
      root.style.removeProperty("--animation-duration");
    }

    root.classList.toggle("high-contrast", accessibility.highContrast);
    localStorage.setItem(
      ACCESSIBILITY_STORAGE_KEY,
      JSON.stringify(accessibility),
    );
  }, [accessibility]);

  const updateAccessibility = (
    key: keyof AccessibilityPreferences,
    value: boolean,
  ) => {
    setAccessibility((prev) => ({ ...prev, [key]: value }));
  };

  return { accessibility, updateAccessibility };
}
