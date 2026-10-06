"use client";

/**
 * The start screen's heading (plans/app/E-workflow.md §4 steps 0 and 1): what the screen is for,
 * above the keyword input, with the recent keywords beneath it. No hero: the input is the point.
 */
export function HeroSection() {
  return (
    <div className="flex flex-col gap-1 text-center">
      <h2 className="font-display text-page-title text-foreground">
        Start with a keyword
      </h2>
      <p className="text-body text-muted-foreground">
        We read its search results first. You choose the type, the title and the
        outline before the article is written.
      </p>
    </div>
  );
}
