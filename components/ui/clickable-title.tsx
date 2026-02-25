import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

interface ClickableTitleProps {
  value: unknown;
  href: string;
  className?: string;
  children?: ReactNode;
}

/**
 * Generic clickable title component that behaves like a proper anchor link
 * Shows URL on hover and supports right-click context menu
 */
export function ClickableTitle({
  value,
  href,
  className = "",
  children,
}: ClickableTitleProps): ReactNode {
  const title = String(value || "");

  if (!title && !children) {
    return <span className="text-muted-foreground">Untitled</span>;
  }

  return (
    <Link
      href={href as Route}
      className={`font-medium text-foreground leading-tight hover:text-primary transition-colors ${className}`}
    >
      {children || title}
    </Link>
  );
}
