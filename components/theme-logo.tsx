"use client";

import Image from "next/image";
import { useTheme } from "@/providers/theme-provider";
import { useEffect, useState } from "react";

interface ThemeLogoProps {
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
}

export function ThemeLogo({
  className = "",
  width = 120,
  height = 40,
  priority = false,
}: ThemeLogoProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Return a placeholder with the same dimensions to prevent layout shift
    return (
      <div
        className={className}
        style={{ width: `${width}px`, height: `${height}px` }}
      />
    );
  }

  // Select the appropriate logo based on resolved theme
  // Note: filenames seem inverted relative to usage context
  // rext_logo_light.svg is WHITE (Use in Dark Mode)
  // rext_logo_dark.svg is BLACK (Use in Light Mode)
  const isDark = resolvedTheme === "dark";
  const logoSrc = isDark
    ? "/logos/rext_logo_dark.svg"
    : "/logos/rext_logo_light.svg";

  return (
    <img
      src={logoSrc}
      alt="Rext Logo"
      width={width}
      height={height}
      className={`object-contain ${className}`}
    />
  );
}
