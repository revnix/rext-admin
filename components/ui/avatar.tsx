"use client";

import { Avatar as AvatarPrimitive } from "radix-ui";
import type * as React from "react";

import { cn } from "@/lib/utils";

function Avatar({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root>) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn(
        "relative flex size-8 shrink-0 overflow-hidden rounded-full",
        className,
      )}
      {...props}
    />
  );
}

function AvatarImage({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn("aspect-square size-full", className)}
      {...props}
    />
  );
}

function AvatarFallback({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        "bg-muted flex size-full items-center justify-center rounded-full",
        className,
      )}
      {...props}
    />
  );
}

export { Avatar, AvatarImage, AvatarFallback, AvatarStatus };

function AvatarStatus({
  status,
  className,
  ...props
}: React.ComponentProps<"span"> & {
  status?: "online" | "busy" | "away" | "offline";
}) {
  const statusColor = {
    online: "bg-green-500",
    busy: "bg-red-500",
    away: "bg-orange-500",
    offline: "bg-gray-500",
  };

  if (!status) return null;

  return (
    <span
      data-slot="avatar-status"
      className={cn(
        "absolute bottom-0 right-0 z-10 block size-3 rounded-full border-2 border-background ring-0",
        statusColor[status],
        className,
      )}
      {...props}
    />
  );
}
