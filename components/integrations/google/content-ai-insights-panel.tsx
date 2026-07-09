"use client";

import { Compass, Lightbulb, Search, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const SECTIONS = [
  {
    key: "ranking-analysis",
    title: "Ranking Analysis",
    icon: Search,
    description:
      "Why this article's ranking moved, based on its search performance history.",
  },
  {
    key: "root-cause",
    title: "Root Cause Analysis",
    icon: Compass,
    description:
      "The specific factors behind a ranking change — competitor moves, content gaps, freshness, intent shifts.",
  },
  {
    key: "recommendations",
    title: "AI Recommendations",
    icon: Lightbulb,
    description:
      "Concrete next steps to improve this article's search performance.",
  },
];

/**
 * AI Insights section (Module 5 — AI Diagnosis). The backend doesn't
 * generate this data yet — `ai_recommendation` on the content-inventory
 * endpoint is hardcoded null until that module ships — so this renders a
 * clear "coming soon" state per section rather than fake/placeholder copy.
 */
export function ContentAiInsightsPanel() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-muted-foreground" />
          AI Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {SECTIONS.map((section) => (
          <div
            key={section.key}
            className="flex items-start gap-3 rounded-lg border border-dashed p-4"
          >
            <section.icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">{section.title}</p>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  Coming soon
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {section.description}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
