import { Loader2 } from "lucide-react";

/**
 * Root level loading state
 * Simple spinner without a page layout, to prevent a flash of the page's frame. It appears only
 * after 200 ms, as the layouts' skeletons do, so a fast load shows nothing.
 * This is used as the fallback UI while any page segment in the root app directory is loading.
 */
export default function RootLoading() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background animate-in fade-in delay-200 fill-mode-backwards">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-foreground" />
        <p className="text-sm text-muted-foreground font-medium animate-pulse">
          Loading...
        </p>
      </div>
    </div>
  );
}
