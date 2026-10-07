import { cn } from "@/lib/utils";

/**
 * A placeholder shaped like the content it stands for (design/app-language.md §6 and §8), on the
 * inset surface. A client view shows it through `useShowAfter` (`hooks/use-show-after.ts`), so a
 * fast load never flashes it.
 */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-sm bg-muted", className)}
      {...props}
    />
  );
}

export { Skeleton };
