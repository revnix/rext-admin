import { Badge } from "@/components/ui/badge";

/**
 * The performance slot (plans/app/D-pages.md §2.1): clicks and rankings need Google Search Console,
 * which nothing connects to yet (Plan H). Until then the slot says so, with no button.
 */
export function SearchConsoleCard() {
  return (
    <div className="flex flex-col gap-2 rounded-md border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-section">Search Console</h2>
        <Badge variant="neutral">Coming soon</Badge>
      </div>
      <p className="text-sm text-muted-foreground">
        Clicks, impressions and positions for your published articles, from
        Google Search Console, will show here once it can be connected.
      </p>
    </div>
  );
}
