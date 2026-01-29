"use client";

import Image from "next/image";
import { useTheme } from "@/providers/theme-provider";
import { useEffect, useState } from "react";

interface BrandLogoProps {
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  variant?: "white" | "black";
}

export function BrandLogo({
  className = "",
  width = 120,
  height = 40,
  priority = false,
  variant,
}: BrandLogoProps) {
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

  // Select the appropriate logo
  // rext_logo_dark.svg is WHITE (Use in Dark Mode or when variant is white)
  // rext_logo_light.svg is BLACK (Use in Light Mode or when variant is black)
  let logoSrc = "/logos/rext_logo_light.svg"; // Default to black/light mode

  if (variant === "white") {
    // White logo (for dark backgrounds)
    logoSrc = "/logos/rext_logo_dark.svg";
  } else if (variant === "black") {
    // Black logo (for light backgrounds)
    logoSrc = "/logos/rext_logo_light.svg";
  } else {
    // Theme based
    // Dark mode -> White logo (rext_logo_dark.svg)
    // Light mode -> Black logo (rext_logo_light.svg)
    logoSrc =
      resolvedTheme === "dark"
        ? "/logos/rext_logo_dark.svg"
        : "/logos/rext_logo_light.svg";
  }

  return (
    <Image
      src={logoSrc}
      alt="Rext Logo"
      width={width}
      height={height}
      className={`object-contain ${className}`}
      priority={priority}
    />
  );
}
