"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { DetailGridItemProps, DetailGridProps } from "@/types/detail-page";

/**
 * DetailGrid component for flexible grid layouts in detail pages
 */
export const DetailGrid = React.forwardRef<HTMLDivElement, DetailGridProps>(
  (
    { children, className, columns = 1, gap = "md", responsive, ...props },
    ref,
  ) => {
    // Build grid classes
    const gridClasses = cn(
      "grid",
      // Base columns
      {
        "grid-cols-1": columns === 1,
        "grid-cols-2": columns === 2,
        "grid-cols-3": columns === 3,
        "grid-cols-4": columns === 4,
        "grid-cols-6": columns === 6,
        "grid-cols-12": columns === 12,
      },
      // Gap classes
      {
        "gap-2": gap === "sm",
        "gap-4": gap === "md",
        "gap-6": gap === "lg",
        "gap-8": gap === "xl",
      },
      // Responsive columns
      responsive?.sm && {
        "sm:grid-cols-1": responsive.sm === 1,
        "sm:grid-cols-2": responsive.sm === 2,
        "sm:grid-cols-3": responsive.sm === 3,
        "sm:grid-cols-4": responsive.sm === 4,
        "sm:grid-cols-6": responsive.sm === 6,
        "sm:grid-cols-12": responsive.sm === 12,
      },
      responsive?.md && {
        "md:grid-cols-1": responsive.md === 1,
        "md:grid-cols-2": responsive.md === 2,
        "md:grid-cols-3": responsive.md === 3,
        "md:grid-cols-4": responsive.md === 4,
        "md:grid-cols-6": responsive.md === 6,
        "md:grid-cols-12": responsive.md === 12,
      },
      responsive?.lg && {
        "lg:grid-cols-1": responsive.lg === 1,
        "lg:grid-cols-2": responsive.lg === 2,
        "lg:grid-cols-3": responsive.lg === 3,
        "lg:grid-cols-4": responsive.lg === 4,
        "lg:grid-cols-6": responsive.lg === 6,
        "lg:grid-cols-12": responsive.lg === 12,
      },
      responsive?.xl && {
        "xl:grid-cols-1": responsive.xl === 1,
        "xl:grid-cols-2": responsive.xl === 2,
        "xl:grid-cols-3": responsive.xl === 3,
        "xl:grid-cols-4": responsive.xl === 4,
        "xl:grid-cols-6": responsive.xl === 6,
        "xl:grid-cols-12": responsive.xl === 12,
      },
      className,
    );

    return (
      <div ref={ref} className={gridClasses} {...props}>
        {children}
      </div>
    );
  },
);

DetailGrid.displayName = "DetailGrid";

/**
 * DetailGridItem component for individual grid items
 */
export const DetailGridItem = React.forwardRef<
  HTMLDivElement,
  DetailGridItemProps
>(
  (
    { children, className, span, responsive, start, startResponsive, ...props },
    ref,
  ) => {
    // Build grid item classes
    const itemClasses = cn(
      // Base column span
      span && {
        "col-span-1": span === 1,
        "col-span-2": span === 2,
        "col-span-3": span === 3,
        "col-span-4": span === 4,
        "col-span-5": span === 5,
        "col-span-6": span === 6,
        "col-span-7": span === 7,
        "col-span-8": span === 8,
        "col-span-9": span === 9,
        "col-span-10": span === 10,
        "col-span-11": span === 11,
        "col-span-12": span === 12,
      },
      // Base column start
      start && {
        "col-start-1": start === 1,
        "col-start-2": start === 2,
        "col-start-3": start === 3,
        "col-start-4": start === 4,
        "col-start-5": start === 5,
        "col-start-6": start === 6,
        "col-start-7": start === 7,
        "col-start-8": start === 8,
        "col-start-9": start === 9,
        "col-start-10": start === 10,
        "col-start-11": start === 11,
        "col-start-12": start === 12,
      },
      // Responsive column spans
      responsive?.sm && {
        "sm:col-span-1": responsive.sm === 1,
        "sm:col-span-2": responsive.sm === 2,
        "sm:col-span-3": responsive.sm === 3,
        "sm:col-span-4": responsive.sm === 4,
        "sm:col-span-5": responsive.sm === 5,
        "sm:col-span-6": responsive.sm === 6,
        "sm:col-span-7": responsive.sm === 7,
        "sm:col-span-8": responsive.sm === 8,
        "sm:col-span-9": responsive.sm === 9,
        "sm:col-span-10": responsive.sm === 10,
        "sm:col-span-11": responsive.sm === 11,
        "sm:col-span-12": responsive.sm === 12,
      },
      responsive?.md && {
        "md:col-span-1": responsive.md === 1,
        "md:col-span-2": responsive.md === 2,
        "md:col-span-3": responsive.md === 3,
        "md:col-span-4": responsive.md === 4,
        "md:col-span-5": responsive.md === 5,
        "md:col-span-6": responsive.md === 6,
        "md:col-span-7": responsive.md === 7,
        "md:col-span-8": responsive.md === 8,
        "md:col-span-9": responsive.md === 9,
        "md:col-span-10": responsive.md === 10,
        "md:col-span-11": responsive.md === 11,
        "md:col-span-12": responsive.md === 12,
      },
      responsive?.lg && {
        "lg:col-span-1": responsive.lg === 1,
        "lg:col-span-2": responsive.lg === 2,
        "lg:col-span-3": responsive.lg === 3,
        "lg:col-span-4": responsive.lg === 4,
        "lg:col-span-5": responsive.lg === 5,
        "lg:col-span-6": responsive.lg === 6,
        "lg:col-span-7": responsive.lg === 7,
        "lg:col-span-8": responsive.lg === 8,
        "lg:col-span-9": responsive.lg === 9,
        "lg:col-span-10": responsive.lg === 10,
        "lg:col-span-11": responsive.lg === 11,
        "lg:col-span-12": responsive.lg === 12,
      },
      responsive?.xl && {
        "xl:col-span-1": responsive.xl === 1,
        "xl:col-span-2": responsive.xl === 2,
        "xl:col-span-3": responsive.xl === 3,
        "xl:col-span-4": responsive.xl === 4,
        "xl:col-span-5": responsive.xl === 5,
        "xl:col-span-6": responsive.xl === 6,
        "xl:col-span-7": responsive.xl === 7,
        "xl:col-span-8": responsive.xl === 8,
        "xl:col-span-9": responsive.xl === 9,
        "xl:col-span-10": responsive.xl === 10,
        "xl:col-span-11": responsive.xl === 11,
        "xl:col-span-12": responsive.xl === 12,
      },
      // Responsive column starts
      startResponsive?.sm && {
        "sm:col-start-1": startResponsive.sm === 1,
        "sm:col-start-2": startResponsive.sm === 2,
        "sm:col-start-3": startResponsive.sm === 3,
        "sm:col-start-4": startResponsive.sm === 4,
        "sm:col-start-5": startResponsive.sm === 5,
        "sm:col-start-6": startResponsive.sm === 6,
        "sm:col-start-7": startResponsive.sm === 7,
        "sm:col-start-8": startResponsive.sm === 8,
        "sm:col-start-9": startResponsive.sm === 9,
        "sm:col-start-10": startResponsive.sm === 10,
        "sm:col-start-11": startResponsive.sm === 11,
        "sm:col-start-12": startResponsive.sm === 12,
      },
      startResponsive?.md && {
        "md:col-start-1": startResponsive.md === 1,
        "md:col-start-2": startResponsive.md === 2,
        "md:col-start-3": startResponsive.md === 3,
        "md:col-start-4": startResponsive.md === 4,
        "md:col-start-5": startResponsive.md === 5,
        "md:col-start-6": startResponsive.md === 6,
        "md:col-start-7": startResponsive.md === 7,
        "md:col-start-8": startResponsive.md === 8,
        "md:col-start-9": startResponsive.md === 9,
        "md:col-start-10": startResponsive.md === 10,
        "md:col-start-11": startResponsive.md === 11,
        "md:col-start-12": startResponsive.md === 12,
      },
      startResponsive?.lg && {
        "lg:col-start-1": startResponsive.lg === 1,
        "lg:col-start-2": startResponsive.lg === 2,
        "lg:col-start-3": startResponsive.lg === 3,
        "lg:col-start-4": startResponsive.lg === 4,
        "lg:col-start-5": startResponsive.lg === 5,
        "lg:col-start-6": startResponsive.lg === 6,
        "lg:col-start-7": startResponsive.lg === 7,
        "lg:col-start-8": startResponsive.lg === 8,
        "lg:col-start-9": startResponsive.lg === 9,
        "lg:col-start-10": startResponsive.lg === 10,
        "lg:col-start-11": startResponsive.lg === 11,
        "lg:col-start-12": startResponsive.lg === 12,
      },
      startResponsive?.xl && {
        "xl:col-start-1": startResponsive.xl === 1,
        "xl:col-start-2": startResponsive.xl === 2,
        "xl:col-start-3": startResponsive.xl === 3,
        "xl:col-start-4": startResponsive.xl === 4,
        "xl:col-start-5": startResponsive.xl === 5,
        "xl:col-start-6": startResponsive.xl === 6,
        "xl:col-start-7": startResponsive.xl === 7,
        "xl:col-start-8": startResponsive.xl === 8,
        "xl:col-start-9": startResponsive.xl === 9,
        "xl:col-start-10": startResponsive.xl === 10,
        "xl:col-start-11": startResponsive.xl === 11,
        "xl:col-start-12": startResponsive.xl === 12,
      },
      className,
    );

    return (
      <div ref={ref} className={itemClasses} {...props}>
        {children}
      </div>
    );
  },
);

DetailGridItem.displayName = "DetailGridItem";

// Convenience components for common layouts
export const TwoColumnGrid = ({
  children,
  className,
  gap = "md",
  ...props
}: Omit<DetailGridProps, "columns">) => (
  <DetailGrid
    columns={2}
    gap={gap}
    responsive={{ sm: 1, md: 2 }}
    className={className}
    {...props}
  >
    {children}
  </DetailGrid>
);

export const ThreeColumnGrid = ({
  children,
  className,
  gap = "md",
  ...props
}: Omit<DetailGridProps, "columns">) => (
  <DetailGrid
    columns={3}
    gap={gap}
    responsive={{ sm: 1, md: 2, lg: 3 }}
    className={className}
    {...props}
  >
    {children}
  </DetailGrid>
);

export const FourColumnGrid = ({
  children,
  className,
  gap = "md",
  ...props
}: Omit<DetailGridProps, "columns">) => (
  <DetailGrid
    columns={4}
    gap={gap}
    responsive={{ sm: 1, md: 2, lg: 3, xl: 4 }}
    className={className}
    {...props}
  >
    {children}
  </DetailGrid>
);

export const SixColumnGrid = ({
  children,
  className,
  gap = "md",
  ...props
}: Omit<DetailGridProps, "columns">) => (
  <DetailGrid
    columns={6}
    gap={gap}
    responsive={{ sm: 2, md: 3, lg: 4, xl: 6 }}
    className={className}
    {...props}
  >
    {children}
  </DetailGrid>
);
