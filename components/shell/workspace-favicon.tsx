"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * A workspace's 20 px mark in the switcher: its site's favicon when the backend has one (G9's
 * favicon_url), else the name's first letter on the inset surface, which is also shown when the
 * image fails to load. Never stretched.
 */
export function WorkspaceFavicon({
  name,
  src,
  className,
}: {
  name: string;
  src?: string | null;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (src && !failed) {
    return (
      // A plain img: favicons come from any host, which next/image would have to allow one by one.
      <img
        src={src}
        alt=""
        width={20}
        height={20}
        loading="lazy"
        onError={() => setFailed(true)}
        className={cn("size-5 shrink-0 rounded-sm object-contain", className)}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      data-icon=""
      className={cn(
        "flex size-5 shrink-0 items-center justify-center rounded-sm border border-border bg-surface-inset text-caption font-semibold text-muted-foreground uppercase",
        className,
      )}
    >
      {name.trim().charAt(0) || "W"}
    </span>
  );
}
